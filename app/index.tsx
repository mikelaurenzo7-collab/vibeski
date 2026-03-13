import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import Colors from '@/constants/colors';
import { AGENTS } from '@/constants/agents';
import { useChat, type Conversation } from '@/lib/chat-context';
import { useAuth } from '@/lib/auth-context';
import { ConversationItem } from '@/components/ConversationItem';
import { AgentCard } from '@/components/AgentCard';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { conversations, createConversation, deleteConversation } = useChat();
  const { isLoggedIn, user } = useAuth();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  const handleNewChat = async (agentId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const convo = await createConversation(agentId);
    router.push({ pathname: '/chat/[id]', params: { id: convo.id } });
  };

  const handleDelete = (id: string) => {
    if (Platform.OS === 'web') {
      deleteConversation(id);
      return;
    }
    Alert.alert('Delete Conversation', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          deleteConversation(id);
        },
      },
    ]);
  };

  const handleOpenChat = (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push({ pathname: '/chat/[id]', params: { id } });
  };

  const sortedConversations = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);
  const recentConversations = sortedConversations.slice(0, 5);

  return (
    <View style={[styles.screen, { paddingBottom: webBottomInset }]}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: (insets.top || webTopInset) + 16 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerLabel}>FIELD OF DREAMS</Text>
            <Text style={styles.headerSubtitle}>
              {isLoggedIn
                ? `Welcome, ${user?.username}`
                : 'AI Agents'}
            </Text>
          </View>
          <View style={styles.headerActions}>
            {isLoggedIn && (
              <Pressable
                onPress={() => router.push('/projects')}
                hitSlop={8}
                style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.6 }]}
              >
                <Feather name="folder" size={20} color="rgba(255,255,255,0.7)" />
              </Pressable>
            )}
            <Pressable
              onPress={() => router.push('/profile')}
              hitSlop={8}
              style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.6 }]}
            >
              <Feather name="user" size={20} color="rgba(255,255,255,0.7)" />
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!isLoggedIn && (
          <Pressable
            onPress={() => router.push('/auth')}
            style={({ pressed }) => [styles.signupBanner, pressed && { opacity: 0.9 }]}
          >
            <View style={styles.bannerLeft}>
              <Feather name="shield" size={18} color={Colors.primary} />
              <View style={styles.bannerTextGroup}>
                <Text style={styles.bannerTitle}>Save your work</Text>
                <Text style={styles.bannerSubtitle}>Create an account to sync projects</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={18} color={Colors.warmGrayLight} />
          </Pressable>
        )}

        <Pressable
          onPress={() => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            router.push('/templates');
          }}
          style={({ pressed }) => [styles.templateBanner, pressed && styles.templateBannerPressed]}
        >
          <View style={styles.templateBannerIcon}>
            <Feather name="grid" size={18} color={Colors.accent} />
          </View>
          <View style={styles.templateBannerText}>
            <Text style={styles.templateBannerTitle}>Template Gallery</Text>
            <Text style={styles.templateBannerSub}>Browse curated app templates to get started fast</Text>
          </View>
          <Feather name="chevron-right" size={18} color={Colors.warmGrayLight} />
        </Pressable>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Agents</Text>
          <Text style={styles.sectionSub}>{AGENTS.length} specialists</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.agentsRow}
        >
          {AGENTS.map(agent => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onPress={() => handleNewChat(agent.id)}
            />
          ))}
        </ScrollView>

        {recentConversations.length > 0 && (
          <View style={styles.conversationsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent</Text>
              {sortedConversations.length > 5 && (
                <Pressable onPress={() => router.push('/projects')}>
                  <Text style={styles.sectionLink}>See all</Text>
                </Pressable>
              )}
            </View>
            <View style={styles.conversationsList}>
              {recentConversations.map((item, index) => (
                <ConversationItem
                  key={item.id}
                  conversation={item}
                  onPress={() => handleOpenChat(item.id)}
                  onDelete={() => handleDelete(item.id)}
                  isFirst={index === 0}
                  isLast={index === recentConversations.length - 1}
                />
              ))}
            </View>
          </View>
        )}

        {sortedConversations.length === 0 && (
          <View style={styles.emptyHint}>
            <Feather name="arrow-up" size={14} color={Colors.warmGrayLight} />
            <Text style={styles.emptyHintText}>
              Pick an agent to start a conversation
            </Text>
          </View>
        )}
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
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLabel: {
    fontSize: 24,
    fontFamily: 'DMSans_700Bold',
    color: Colors.white,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 4,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  signupBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  bannerTextGroup: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
    color: Colors.black,
  },
  bannerSubtitle: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    marginTop: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'DMSans_700Bold',
    color: Colors.black,
    letterSpacing: -0.2,
  },
  sectionSub: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGrayLight,
  },
  sectionLink: {
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.primary,
  },
  agentsRow: {
    paddingHorizontal: 16,
    gap: 10,
  },
  conversationsSection: {
    marginTop: 4,
  },
  conversationsList: {
    marginHorizontal: 16,
  },
  emptyHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 40,
  },
  emptyHintText: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGrayLight,
  },
  templateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.divider,
    gap: 12,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  templateBannerPressed: {
    backgroundColor: Colors.creamDark,
    transform: [{ scale: 0.98 }],
  },
  templateBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.accentSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateBannerText: {
    flex: 1,
  },
  templateBannerTitle: {
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
    color: Colors.black,
    letterSpacing: -0.1,
  },
  templateBannerSub: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    marginTop: 2,
  },
});
