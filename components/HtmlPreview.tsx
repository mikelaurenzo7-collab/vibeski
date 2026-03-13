import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Colors from '@/constants/colors';

let WebView: any = null;
if (Platform.OS !== 'web') {
  try {
    WebView = require('react-native-webview').WebView;
  } catch {}
}

interface HtmlPreviewProps {
  html: string;
}

export function HtmlPreview({ html }: HtmlPreviewProps) {
  const [expanded, setExpanded] = useState(false);
  const screenWidth = Dimensions.get('window').width;
  const previewWidth = Math.min(screenWidth - 64, 340);
  const previewHeight = expanded ? 480 : 280;

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { width: previewWidth }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Feather name="globe" size={12} color={Colors.accent} />
            <Text style={styles.headerText}>Live Preview</Text>
          </View>
          <Pressable onPress={() => setExpanded(!expanded)} hitSlop={8}>
            <Feather name={expanded ? "minimize-2" : "maximize-2"} size={12} color={Colors.warmGray} />
          </Pressable>
        </View>
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
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Feather name="globe" size={12} color={Colors.accent} />
          <Text style={styles.headerText}>Live Preview</Text>
        </View>
        <Pressable onPress={() => setExpanded(!expanded)} hitSlop={8}>
          <Feather name={expanded ? "minimize-2" : "maximize-2"} size={12} color={Colors.warmGray} />
        </Pressable>
      </View>
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
    backgroundColor: Colors.cream,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerText: {
    fontSize: 11,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.warmGray,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  iframeContainer: {
    backgroundColor: '#ffffff',
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
