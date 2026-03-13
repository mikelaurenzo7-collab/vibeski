import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Dimensions, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

let WebView: any = null;
if (Platform.OS !== 'web') {
  try {
    WebView = require('react-native-webview').WebView;
  } catch {}
}

interface HtmlPreviewProps {
  html: string;
  onOpenPreview?: (html: string) => void;
}

export function HtmlPreview({ html, onOpenPreview }: HtmlPreviewProps) {
  const [expanded, setExpanded] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const screenWidth = Dimensions.get('window').width;
  const previewWidth = Math.min(screenWidth - 64, 340);
  const previewHeight = expanded ? 480 : 280;

  const handleToggleSource = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowSource(!showSource);
  };

  const handleFullscreen = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (onOpenPreview) {
      onOpenPreview(html);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <View style={styles.dots}>
          <View style={[styles.dot, { backgroundColor: Colors.windowClose }]} />
          <View style={[styles.dot, { backgroundColor: Colors.windowMinimize }]} />
          <View style={[styles.dot, { backgroundColor: Colors.windowMaximize }]} />
        </View>
        <Text style={styles.headerText}>Live Preview</Text>
      </View>
      <View style={styles.headerActions}>
        <Pressable onPress={handleToggleSource} hitSlop={8} style={styles.headerActionBtn}>
          <Feather
            name="code"
            size={12}
            color={showSource ? Colors.accent : Colors.warmGray}
          />
        </Pressable>
        <Pressable onPress={() => setExpanded(!expanded)} hitSlop={8} style={styles.headerActionBtn}>
          <Feather
            name={expanded ? "minimize-2" : "maximize-2"}
            size={12}
            color={Colors.warmGray}
          />
        </Pressable>
        {onOpenPreview && (
          <Pressable onPress={handleFullscreen} hitSlop={8} style={styles.headerActionBtn}>
            <Feather name="external-link" size={12} color={Colors.accent} />
          </Pressable>
        )}
      </View>
    </View>
  );

  if (showSource) {
    return (
      <View style={[styles.container, { width: previewWidth }]}>
        {renderHeader()}
        <ScrollView style={[styles.sourceContainer, { height: previewHeight }]}>
          <Text style={styles.sourceText} selectable>{html}</Text>
        </ScrollView>
      </View>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { width: previewWidth }]}>
        {renderHeader()}
        <View style={[styles.iframeContainer, { height: previewHeight }]}>
          <iframe
            srcDoc={html}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              borderRadius: 0,
              backgroundColor: '#ffffff',
            } as any}
            sandbox="allow-scripts allow-same-origin"
          />
        </View>
      </View>
    );
  }

  if (!WebView) {
    return (
      <View style={[styles.container, styles.fallback, { width: previewWidth }]}>
        <Feather name="globe" size={20} color={Colors.accent} />
        <Text style={styles.fallbackText}>Preview available on web</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { width: previewWidth }]}>
      {renderHeader()}
      <WebView
        source={{ html }}
        style={{ height: previewHeight, backgroundColor: '#ffffff' }}
        scrollEnabled={true}
        scalesPageToFit={true}
        javaScriptEnabled={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.divider,
    backgroundColor: Colors.white,
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F6F5F4',
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dots: {
    flexDirection: 'row',
    gap: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  headerText: {
    fontSize: 11,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.warmGray,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 2,
  },
  headerActionBtn: {
    width: 28,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iframeContainer: {
    backgroundColor: '#ffffff',
  },
  sourceContainer: {
    backgroundColor: Colors.primaryDark,
    padding: 12,
  },
  sourceText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    lineHeight: 16,
    color: '#D4D4D4',
  },
  fallback: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fallbackText: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
  },
});
