import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Dimensions,
  ScrollView,
  Share,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import Colors from '@/constants/colors';

let WebView: any = null;
if (Platform.OS !== 'web') {
  try {
    WebView = require('react-native-webview').WebView;
  } catch {}
}

type DeviceFrame = 'phone' | 'tablet' | 'desktop';

const DEVICE_FRAMES: { key: DeviceFrame; icon: 'smartphone' | 'tablet' | 'monitor'; label: string; width: number; height: number }[] = [
  { key: 'phone', icon: 'smartphone', label: 'Phone', width: 375, height: 667 },
  { key: 'tablet', icon: 'tablet', label: 'Tablet', width: 768, height: 1024 },
  { key: 'desktop', icon: 'monitor', label: 'Desktop', width: 1280, height: 800 },
];

export default function PreviewScreen() {
  const params = useLocalSearchParams<{ html: string; chatId: string }>();
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;
  const html = params.html || '';
  const chatId = params.chatId || '';

  const [activeFrame, setActiveFrame] = useState<DeviceFrame>('desktop');
  const [showSource, setShowSource] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);

  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  const frame = DEVICE_FRAMES.find(f => f.key === activeFrame)!;
  const frameW = isLandscape ? frame.height : frame.width;
  const frameH = isLandscape ? frame.width : frame.height;

  const toolbarHeight = 56;
  const topPad = (insets.top || webTopInset) + 8;
  const bottomPad = (insets.bottom || webBottomInset);
  const availableWidth = screenWidth - 32;
  const availableHeight = screenHeight - topPad - toolbarHeight - bottomPad - 80;

  const scale = Math.min(availableWidth / frameW, availableHeight / frameH, 1);
  const displayW = frameW * scale;
  const displayH = frameH * scale;

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const handleEdit = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (chatId) {
      router.push({ pathname: '/chat/[id]', params: { id: chatId } });
    } else {
      router.back();
    }
  };

  const handleShare = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    try {
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(html);
        alert('HTML copied to clipboard!');
      } else {
        await Share.share({
          message: html,
          title: 'Generated App',
        });
      }
    } catch {}
  };

  const handleToggleLandscape = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsLandscape(!isLandscape);
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: topPad }]}>
        <Pressable
          onPress={handleBack}
          hitSlop={12}
          style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.6 }]}
        >
          <Feather name="x" size={20} color="rgba(255,255,255,0.8)" />
        </Pressable>
        <Text style={styles.headerTitle}>App Preview</Text>
        <View style={styles.headerRight}>
          <Pressable
            onPress={handleEdit}
            hitSlop={8}
            style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.8 }]}
          >
            <Feather name="edit-2" size={14} color={Colors.primary} />
            <Text style={styles.editBtnText}>Edit</Text>
          </Pressable>
        </View>
      </View>

      {showSource ? (
        <ScrollView
          style={styles.sourceScroll}
          contentContainerStyle={{ paddingBottom: bottomPad + 80 }}
        >
          <Text style={styles.sourceText} selectable>{html}</Text>
        </ScrollView>
      ) : (
        <View style={styles.previewArea}>
          <View
            style={[
              styles.deviceFrame,
              activeFrame === 'phone' && styles.deviceFramePhone,
              activeFrame === 'tablet' && styles.deviceFrameTablet,
              {
                width: displayW,
                height: displayH,
              },
            ]}
          >
            {Platform.OS === 'web' ? (
              <iframe
                srcDoc={html}
                style={{
                  width: frameW,
                  height: frameH,
                  border: 'none',
                  backgroundColor: '#ffffff',
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                } as any}
                sandbox="allow-scripts allow-forms allow-popups"
              />
            ) : WebView ? (
              <WebView
                source={{ html }}
                style={{ width: displayW, height: displayH, backgroundColor: '#ffffff' }}
                scrollEnabled={true}
                scalesPageToFit={true}
                javaScriptEnabled={true}
              />
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Feather name="globe" size={24} color={Colors.warmGray} />
                <Text style={styles.nativeHint}>Preview not available</Text>
              </View>
            )}
          </View>
        </View>
      )}

      <View style={[styles.toolbar, { paddingBottom: bottomPad + 8 }]}>
        <View style={styles.framePicker}>
          {DEVICE_FRAMES.map(f => (
            <Pressable
              key={f.key}
              onPress={() => {
                setActiveFrame(f.key);
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
              style={[
                styles.frameBtn,
                activeFrame === f.key && styles.frameBtnActive,
              ]}
            >
              <Feather
                name={f.icon}
                size={16}
                color={activeFrame === f.key ? Colors.accent : Colors.warmGray}
              />
            </Pressable>
          ))}
        </View>

        <View style={styles.toolbarActions}>
          <Pressable onPress={handleToggleLandscape} hitSlop={8} style={styles.toolbarBtn}>
            <Feather
              name="rotate-cw"
              size={16}
              color={isLandscape ? Colors.accent : Colors.warmGray}
            />
          </Pressable>
          <Pressable
            onPress={() => {
              setShowSource(!showSource);
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
            hitSlop={8}
            style={styles.toolbarBtn}
          >
            <Feather
              name="code"
              size={16}
              color={showSource ? Colors.accent : Colors.warmGray}
            />
          </Pressable>
          <Pressable onPress={handleShare} hitSlop={8} style={styles.toolbarBtn}>
            <Feather name="share" size={16} color={Colors.warmGray} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.primaryDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.primary,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.white,
    letterSpacing: -0.1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editBtnText: {
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.primary,
  },
  previewArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  deviceFrame: {
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    borderRadius: 8,
  },
  deviceFramePhone: {
    borderRadius: 24,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  deviceFrameTablet: {
    borderRadius: 16,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  nativeHint: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    marginTop: 8,
  },
  sourceScroll: {
    flex: 1,
    padding: 16,
  },
  sourceText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    lineHeight: 18,
    color: '#D4D4D4',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: Colors.primary,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  framePicker: {
    flexDirection: 'row',
    gap: 4,
  },
  frameBtn: {
    width: 40,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  frameBtnActive: {
    backgroundColor: 'rgba(201, 162, 78, 0.15)',
  },
  toolbarActions: {
    flexDirection: 'row',
    gap: 4,
  },
  toolbarBtn: {
    width: 40,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
});
