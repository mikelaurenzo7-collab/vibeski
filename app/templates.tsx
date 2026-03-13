import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import Colors from '@/constants/colors';
import { TEMPLATE_CATEGORIES, type TemplateCategory, type Template } from '@/constants/templates';
import { useChat } from '@/lib/chat-context';

export default function TemplatesScreen() {
  const insets = useSafeAreaInsets();
  const { createConversation } = useChat();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;
  const [activeCategory, setActiveCategory] = useState<string>(TEMPLATE_CATEGORIES[0].id);

  const selectedCategory = TEMPLATE_CATEGORIES.find(c => c.id === activeCategory) || TEMPLATE_CATEGORIES[0];

  const handleSelectTemplate = (template: Template) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const convo = createConversation('builder');
    router.push({
      pathname: '/chat/[id]',
      params: { id: convo.id, initialPrompt: template.prompt },
    });
  };

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  return (
    <View style={[styles.screen, { paddingBottom: webBottomInset }]}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: (insets.top || webTopInset) + 8 }]}>
        <Pressable
          onPress={handleBack}
          hitSlop={12}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
        >
          <Feather name="chevron-left" size={22} color="rgba(255,255,255,0.7)" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Template Gallery</Text>
          <Text style={styles.headerSubtitle}>Pick a template to get started</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRow}
        style={styles.categoryScroll}
      >
        {TEMPLATE_CATEGORIES.map(cat => (
          <Pressable
            key={cat.id}
            onPress={() => {
              setActiveCategory(cat.id);
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
            style={[
              styles.categoryChip,
              activeCategory === cat.id && { backgroundColor: cat.color },
            ]}
          >
            <Feather
              name={cat.icon as any}
              size={14}
              color={activeCategory === cat.id ? '#FFFFFF' : Colors.warmGray}
            />
            <Text
              style={[
                styles.categoryChipText,
                activeCategory === cat.id && styles.categoryChipTextActive,
              ]}
            >
              {cat.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.categoryHeader}>
          <View style={[styles.categoryIcon, { backgroundColor: selectedCategory.colorLight }]}>
            <Feather name={selectedCategory.icon as any} size={20} color={selectedCategory.color} />
          </View>
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryName}>{selectedCategory.name}</Text>
            <Text style={styles.categoryDesc}>{selectedCategory.description}</Text>
          </View>
        </View>

        <View style={styles.templateGrid}>
          {selectedCategory.templates.map(template => (
            <Pressable
              key={template.id}
              onPress={() => handleSelectTemplate(template)}
              style={({ pressed }) => [
                styles.templateCard,
                pressed && styles.templateCardPressed,
              ]}
            >
              <View style={[styles.templateIconWrap, { backgroundColor: selectedCategory.colorLight }]}>
                <Feather name={template.icon as any} size={22} color={selectedCategory.color} />
              </View>
              <Text style={styles.templateLabel}>{template.label}</Text>
              <Text style={styles.templatePrompt} numberOfLines={3}>
                {template.prompt}
              </Text>
              <View style={styles.templateArrow}>
                <Feather name="arrow-right" size={14} color={selectedCategory.color} />
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'DMSans_700Bold',
    color: Colors.white,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  headerSpacer: {
    width: 36,
  },
  categoryScroll: {
    maxHeight: 52,
    backgroundColor: Colors.cream,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  categoryRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  categoryChipText: {
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.warmGray,
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 20,
    paddingBottom: 40,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 20,
    fontFamily: 'DMSans_700Bold',
    color: Colors.black,
    letterSpacing: -0.3,
  },
  categoryDesc: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    marginTop: 2,
  },
  templateGrid: {
    gap: 12,
  },
  templateCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.divider,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  templateCardPressed: {
    backgroundColor: Colors.creamDark,
    transform: [{ scale: 0.98 }],
  },
  templateIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  templateLabel: {
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
    color: Colors.black,
    letterSpacing: -0.2,
    marginBottom: 6,
  },
  templatePrompt: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 19,
  },
  templateArrow: {
    position: 'absolute',
    top: 18,
    right: 18,
  },
});
