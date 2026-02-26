import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Colors from '@/constants/colors';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <View style={[styles.row, isUser && styles.rowUser]}>
      {!isUser && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>F</Text>
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        <Text style={[styles.text, isUser ? styles.textUser : styles.textAssistant]}>
          {content}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    marginBottom: 8,
    maxWidth: '100%',
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 2,
  },
  avatarText: {
    color: Colors.white,
    fontSize: 13,
    fontFamily: 'DMSans_700Bold',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  bubbleUser: {
    backgroundColor: Colors.userBubble,
    borderBottomRightRadius: 6,
  },
  bubbleAssistant: {
    backgroundColor: Colors.assistantBubble,
    borderBottomLeftRadius: 6,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'DMSans_400Regular',
  },
  textUser: {
    color: Colors.white,
  },
  textAssistant: {
    color: Colors.black,
  },
});
