import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { HtmlPreview } from '@/components/HtmlPreview';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  onOpenPreview?: (html: string) => void;
}

interface ParsedBlock {
  type: 'text' | 'code' | 'html-preview';
  content: string;
  language?: string;
}

function parseContent(content: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const textBefore = content.slice(lastIndex, match.index).trim();
      if (textBefore) blocks.push({ type: 'text', content: textBefore });
    }

    const lang = match[1]?.toLowerCase() || '';
    const code = match[2]?.trim() || '';

    if (lang === 'html' && code.includes('<') && (code.includes('<html') || code.includes('<!DOCTYPE') || code.includes('<body') || code.includes('<div'))) {
      blocks.push({ type: 'html-preview', content: code, language: 'html' });
    } else {
      blocks.push({ type: 'code', content: code, language: lang });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    const remaining = content.slice(lastIndex).trim();
    if (remaining) blocks.push({ type: 'text', content: remaining });
  }

  if (blocks.length === 0 && content.trim()) {
    blocks.push({ type: 'text', content: content.trim() });
  }

  return blocks;
}

function InlineMarkdown({ text, isUser }: { text: string; isUser: boolean }) {
  const baseColor = isUser ? '#F5F2EC' : Colors.blackSoft;
  const boldColor = isUser ? '#FFFFFF' : Colors.black;
  const codeColor = isUser ? 'rgba(255,255,255,0.15)' : 'rgba(22,46,35,0.06)';
  const codeFg = isUser ? '#F5F2EC' : Colors.primaryLight;

  const elements = useMemo(() => {
    const result: React.ReactNode[] = [];
    const lines = text.split('\n');

    lines.forEach((line, lineIdx) => {
      if (lineIdx > 0) result.push(<Text key={`br-${lineIdx}`} style={{ color: baseColor }}>{'\n'}</Text>);

      const trimmed = line.trim();

      if (trimmed.startsWith('### ')) {
        result.push(
          <Text key={`h3-${lineIdx}`} style={[styles.heading3, { color: boldColor }]}>
            {trimmed.slice(4)}
          </Text>
        );
        return;
      }
      if (trimmed.startsWith('## ')) {
        result.push(
          <Text key={`h2-${lineIdx}`} style={[styles.heading2, { color: boldColor }]}>
            {trimmed.slice(3)}
          </Text>
        );
        return;
      }
      if (trimmed.startsWith('# ')) {
        result.push(
          <Text key={`h1-${lineIdx}`} style={[styles.heading1, { color: boldColor }]}>
            {trimmed.slice(2)}
          </Text>
        );
        return;
      }

      let prefix: React.ReactNode = null;
      let processLine = line;
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        prefix = <Text key={`bullet-${lineIdx}`} style={{ color: Colors.accent }}>  {'  '}</Text>;
        processLine = trimmed.slice(2);
      } else if (/^\d+\.\s/.test(trimmed)) {
        const numMatch = trimmed.match(/^(\d+\.)\s/);
        if (numMatch) {
          prefix = <Text key={`num-${lineIdx}`} style={[styles.listNum, { color: Colors.accent }]}>{numMatch[1]} </Text>;
          processLine = trimmed.slice(numMatch[0].length);
        }
      }

      const parts: React.ReactNode[] = [];
      if (prefix) parts.push(prefix);

      const inlineRegex = /(\*\*(.+?)\*\*|`([^`]+)`)/g;
      let lastIdx = 0;
      let inlineMatch;

      while ((inlineMatch = inlineRegex.exec(processLine)) !== null) {
        if (inlineMatch.index > lastIdx) {
          parts.push(
            <Text key={`t-${lineIdx}-${lastIdx}`} style={{ color: baseColor }}>
              {processLine.slice(lastIdx, inlineMatch.index)}
            </Text>
          );
        }

        if (inlineMatch[2]) {
          parts.push(
            <Text key={`b-${lineIdx}-${inlineMatch.index}`} style={[styles.bold, { color: boldColor }]}>
              {inlineMatch[2]}
            </Text>
          );
        } else if (inlineMatch[3]) {
          parts.push(
            <Text key={`c-${lineIdx}-${inlineMatch.index}`} style={[styles.inlineCode, { backgroundColor: codeColor, color: codeFg }]}>
              {inlineMatch[3]}
            </Text>
          );
        }

        lastIdx = inlineMatch.index + inlineMatch[0].length;
      }

      if (lastIdx < processLine.length) {
        parts.push(
          <Text key={`t-${lineIdx}-end`} style={{ color: baseColor }}>
            {processLine.slice(lastIdx)}
          </Text>
        );
      }

      result.push(<Text key={`line-${lineIdx}`}>{parts}</Text>);
    });

    return result;
  }, [text, baseColor, boldColor, codeColor, codeFg]);

  return <Text style={styles.textBase}>{elements}</Text>;
}

function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(code);
      }
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <View style={styles.codeContainer}>
      <View style={styles.codeHeader}>
        <Text style={styles.codeLang}>{language || 'code'}</Text>
        <Pressable onPress={handleCopy} hitSlop={8} style={styles.copyBtn}>
          <Feather name={copied ? "check" : "copy"} size={12} color={copied ? Colors.success : Colors.warmGray} />
        </Pressable>
      </View>
      <View style={styles.codeBody}>
        <Text style={styles.codeText}>{code}</Text>
      </View>
    </View>
  );
}

export function MessageBubble({ role, content, onOpenPreview }: MessageBubbleProps) {
  const isUser = role === 'user';

  if (isUser) {
    return (
      <View style={[styles.row, styles.rowUser]}>
        <View style={[styles.bubble, styles.bubbleUser]}>
          <Text style={[styles.textBase, styles.textUser]}>{content}</Text>
        </View>
      </View>
    );
  }

  const blocks = parseContent(content);

  return (
    <View style={styles.row}>
      <View style={styles.avatarWrap}>
        <View style={styles.avatar}>
          <Feather name="zap" size={12} color={Colors.accent} />
        </View>
      </View>
      <View style={styles.assistantColumn}>
        {blocks.map((block, i) => {
          if (block.type === 'html-preview') {
            return (
              <View key={i}>
                <HtmlPreview html={block.content} onOpenPreview={onOpenPreview} />
              </View>
            );
          }
          if (block.type === 'code') {
            return <CodeBlock key={i} code={block.content} language={block.language} />;
          }
          return (
            <View key={i} style={[styles.bubble, styles.bubbleAssistant]}>
              <InlineMarkdown text={block.content} isUser={false} />
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    marginBottom: 12,
    maxWidth: '100%',
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  avatarWrap: {
    marginRight: 10,
    marginTop: 4,
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 78, 0.15)',
  },
  assistantColumn: {
    flex: 1,
    maxWidth: '85%',
    gap: 6,
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  bubbleUser: {
    maxWidth: '78%',
    backgroundColor: Colors.userBubble,
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: Colors.assistantBubble,
    borderBottomLeftRadius: 4,
    boxShadow: '0px 1px 3px rgba(22, 46, 35, 0.06)',
    elevation: 1,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  textBase: {
    fontSize: 15,
    lineHeight: 23,
    fontFamily: 'DMSans_400Regular',
    letterSpacing: 0.1,
  },
  textUser: {
    color: '#F5F2EC',
  },
  heading1: {
    fontSize: 18,
    fontFamily: 'DMSans_700Bold',
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  heading2: {
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  heading3: {
    fontSize: 15,
    fontFamily: 'DMSans_600SemiBold',
    lineHeight: 23,
    letterSpacing: -0.1,
  },
  bold: {
    fontFamily: 'DMSans_700Bold',
  },
  inlineCode: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  listNum: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
  },
  codeContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.divider,
    marginTop: 4,
  },
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  codeLang: {
    fontSize: 11,
    fontFamily: 'DMSans_600SemiBold',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  copyBtn: {
    padding: 4,
  },
  codeBody: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    lineHeight: 18,
    color: '#D4D4D4',
  },
});
