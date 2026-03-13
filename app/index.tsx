import React, { useState } from 'react';
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
import { useSubscription } from '@/lib/subscription-context';
import { ConversationItem } from '@/components/ConversationItem';
import { AgentCard } from '@/components/AgentCard';
import { UpgradeModal } from '@/components/UpgradeModal';

const LANDING_FEATURES = [
  { icon: 'layers' as const, title: '15 AI Agents', desc: 'Builder, Writer, Designer, Strategist, SEO Pro, and 10 more specialists' },
  { icon: 'code' as const, title: 'App Builder', desc: 'Generate full web apps with live preview, code editor, and one-click deploy' },
  { icon: 'cpu' as const, title: 'Smart Memory', desc: 'Remembers your preferences, style, and context across every conversation' },
  { icon: 'git-branch' as const, title: 'Version History', desc: 'Auto-versioning, forking, and restore — never lose your work' },
  { icon: 'zap' as const, title: 'Multi-Model AI', desc: 'Powered by Raptor and Gemini with automatic failover for reliability' },
  { icon: 'globe' as const, title: 'Live Deploy', desc: 'Publish your projects to a live URL instantly, with a built-in data API' },
];

function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  return (
    <View style={[styles.screen, { paddingBottom: webBottomInset }]}>
      <StatusBar style="light" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.heroSection, { paddingTop: (insets.top || webTopInset) + 40 }]}>
          <Text style={styles.heroEmoji}>🌾</Text>
          <Text style={styles.heroTitle}>FIELD OF{'\n'}DREAMS</Text>
          <Text style={styles.heroTagline}>If you build it, they will come.</Text>
          <Text style={styles.heroSub}>
            15 AI agents. App builder. Live deploy.{'\n'}Your entire creative team, powered by AI.
          </Text>

          <View style={styles.heroCtas}>
            <Pressable
              onPress={() => router.push('/auth')}
              style={({ pressed }) => [styles.ctaPrimary, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
            >
              <Feather name="arrow-right" size={18} color={Colors.primary} />
              <Text style={styles.ctaPrimaryText}>Get Started</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/pricing')}
              style={({ pressed }) => [styles.ctaSecondary, pressed && { opacity: 0.8 }]}
            >
              <Text style={styles.ctaSecondaryText}>View Pricing</Text>
            </Pressable>
          </View>

          <View style={styles.heroStats}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>15</Text>
              <Text style={styles.statLabel}>AI Agents</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNumber}>2</Text>
              <Text style={styles.statLabel}>AI Models</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNumber}>∞</Text>
              <Text style={styles.statLabel}>Possibilities</Text>
            </View>
          </View>
        </View>

        <View style={styles.agentShowcase}>
          <Text style={styles.showcaseLabel}>MEET YOUR TEAM</Text>
          <Text style={styles.showcaseTitle}>15 Specialized Agents</Text>
          <Text style={styles.showcaseSub}>Each agent is an expert in their domain</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.agentShowcaseRow}
          >
            {AGENTS.slice(0, 8).map(agent => (
              <View key={agent.id} style={styles.agentShowcaseCard}>
                <View style={[styles.agentShowcaseIcon, { backgroundColor: agent.colorLight }]}>
                  <Feather name={agent.icon as any} size={18} color={agent.color} />
                </View>
                <Text style={styles.agentShowcaseName}>{agent.name}</Text>
                <Text style={styles.agentShowcaseTag} numberOfLines={2}>{agent.tagline}</Text>
              </View>
            ))}
            <Pressable
              onPress={() => router.push('/auth')}
              style={styles.agentShowcaseMore}
            >
              <Feather name="plus" size={20} color={Colors.accent} />
              <Text style={styles.agentShowcaseMoreText}>+7 more</Text>
            </Pressable>
          </ScrollView>
        </View>

        <View style={styles.featuresSection}>
          <Text style={styles.showcaseLabel}>WHY FIELD OF DREAMS</Text>
          <Text style={styles.showcaseTitle}>Everything You Need</Text>
          <View style={styles.featuresGrid}>
            {LANDING_FEATURES.map((feat, i) => (
              <View key={i} style={styles.featureCard}>
                <View style={styles.featureIconBox}>
                  <Feather name={feat.icon} size={18} color={Colors.accent} />
                </View>
                <Text style={styles.featureTitle}>{feat.title}</Text>
                <Text style={styles.featureDesc}>{feat.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.ctaSection}>
          <View style={styles.ctaCard}>
            <Text style={styles.ctaCardEmoji}>🌾</Text>
            <Text style={styles.ctaCardTitle}>Ready to build?</Text>
            <Text style={styles.ctaCardSub}>Start free with 10 credits daily. No credit card required.</Text>
            <Pressable
              onPress={() => router.push('/auth')}
              style={({ pressed }) => [styles.ctaCardBtn, pressed && { opacity: 0.9 }]}
            >
              <Text style={styles.ctaCardBtnText}>Create Free Account</Text>
              <Feather name="arrow-right" size={16} color={Colors.primary} />
            </Pressable>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerBrand}>FIELD OF DREAMS</Text>
          <Text style={styles.footerTagline}>If you build it, they will come.</Text>
          <View style={styles.footerLinks}>
            <Pressable onPress={() => router.push('/pricing')}>
              <Text style={styles.footerLink}>Pricing</Text>
            </Pressable>
            <Text style={styles.footerDot}>·</Text>
            <Pressable onPress={() => router.push('/auth')}>
              <Text style={styles.footerLink}>Sign In</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export default function HomeScreen() {
  const { isLoggedIn, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' }}>
        <StatusBar style="light" />
        <Text style={{ fontSize: 36, marginBottom: 12 }}>🌾</Text>
        <Text style={{ fontSize: 18, fontFamily: 'DMSans_700Bold', color: Colors.white, letterSpacing: 2 }}>FIELD OF DREAMS</Text>
      </View>
    );
  }

  if (!isLoggedIn) {
    return <WelcomeScreen />;
  }

  return <AuthenticatedHome />;
}

function AuthenticatedHome() {
  const insets = useSafeAreaInsets();
  const { conversations, createConversation, deleteConversation } = useChat();
  const { user } = useAuth();
  const { status, canAccessAgent } = useSubscription();
  const [upgradeModal, setUpgradeModal] = useState<{ visible: boolean; reason: 'limit_reached' | 'agent_locked'; agentName?: string }>({
    visible: false,
    reason: 'limit_reached',
  });
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  const handleNewChat = async (agentId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (!canAccessAgent(agentId)) {
      const agent = AGENTS.find(a => a.id === agentId);
      setUpgradeModal({ visible: true, reason: 'agent_locked', agentName: agent?.name });
      return;
    }

    if (!status.canGenerate) {
      setUpgradeModal({ visible: true, reason: 'limit_reached' });
      return;
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

  const usageText = status.dailyGenerationsLimit === -1
    ? 'Unlimited'
    : `${status.dailyGenerationsUsed}/${status.dailyGenerationsLimit}`;

  return (
    <View style={[styles.screen, { paddingBottom: webBottomInset }]}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: (insets.top || webTopInset) + 16 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerLabel}>FIELD OF DREAMS</Text>
            <Text style={styles.headerSubtitle}>Welcome, {user?.username}</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => router.push('/billing')}
              style={({ pressed }) => [styles.usagePill, pressed && { opacity: 0.7 }]}
            >
              <Feather name="zap" size={12} color={Colors.accent} />
              <Text style={styles.usagePillText}>{usageText}</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/projects')}
              hitSlop={8}
              style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.6 }]}
            >
              <Feather name="folder" size={20} color="rgba(255,255,255,0.7)" />
            </Pressable>

            <Pressable
              onPress={() => router.push('/profile')}
              hitSlop={8}
              style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.6 }]}
            >
              <Feather name="user" size={20} color="rgba(255,255,255,0.7)" />
            </Pressable>

            <Pressable
              onPress={() => router.push('/command-center')}
              hitSlop={10}
              style={({ pressed }) => [styles.settingsBtn, pressed && { opacity: 0.6 }]}
            >
              <Feather name="settings" size={18} color="rgba(255,255,255,0.5)" />
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
              locked={!canAccessAgent(agent.id)}
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

      <UpgradeModal
        visible={upgradeModal.visible}
        onDismiss={() => setUpgradeModal({ ...upgradeModal, visible: false })}
        reason={upgradeModal.reason}
        agentName={upgradeModal.agentName}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.cream,
  },

  heroSection: {
    backgroundColor: Colors.primary,
    paddingBottom: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  heroEmoji: {
    fontSize: 48,
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 42,
    fontFamily: 'DMSans_700Bold',
    color: Colors.white,
    textAlign: 'center' as const,
    letterSpacing: 4,
    lineHeight: 48,
    marginBottom: 12,
  },
  heroTagline: {
    fontSize: 18,
    fontFamily: 'DMSans_400Regular',
    fontStyle: 'italic' as const,
    color: Colors.accent,
    textAlign: 'center' as const,
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  heroSub: {
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center' as const,
    lineHeight: 22,
    marginBottom: 32,
  },
  heroCtas: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 40,
  },
  ctaPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.accent,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 14,
  },
  ctaPrimaryText: {
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
    color: Colors.primary,
    letterSpacing: 0.2,
  },
  ctaSecondary: {
    paddingHorizontal: 24,
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  ctaSecondaryText: {
    fontSize: 15,
    fontFamily: 'DMSans_500Medium',
    color: Colors.white,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    paddingTop: 32,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 26,
    fontFamily: 'DMSans_700Bold',
    color: Colors.accent,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  agentShowcase: {
    paddingVertical: 40,
    paddingHorizontal: 24,
    backgroundColor: Colors.white,
  },
  showcaseLabel: {
    fontSize: 11,
    fontFamily: 'DMSans_700Bold',
    color: Colors.accent,
    letterSpacing: 2,
    textAlign: 'center' as const,
    marginBottom: 8,
  },
  showcaseTitle: {
    fontSize: 28,
    fontFamily: 'DMSans_700Bold',
    color: Colors.black,
    textAlign: 'center' as const,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  showcaseSub: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    textAlign: 'center' as const,
    marginBottom: 24,
  },
  agentShowcaseRow: {
    paddingHorizontal: 0,
    gap: 10,
  },
  agentShowcaseCard: {
    width: 130,
    backgroundColor: Colors.cream,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  agentShowcaseIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  agentShowcaseName: {
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
    color: Colors.black,
    marginBottom: 3,
  },
  agentShowcaseTag: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 15,
  },
  agentShowcaseMore: {
    width: 100,
    backgroundColor: Colors.accentSubtle,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(201,162,78,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  agentShowcaseMoreText: {
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.accent,
  },

  featuresSection: {
    paddingVertical: 40,
    paddingHorizontal: 24,
    backgroundColor: Colors.cream,
  },
  featuresGrid: {
    gap: 12,
    marginTop: 8,
  },
  featureCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  featureIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.accentSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
    color: Colors.black,
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 19,
  },

  ctaSection: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: Colors.cream,
  },
  ctaCard: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
  },
  ctaCardEmoji: {
    fontSize: 36,
    marginBottom: 16,
  },
  ctaCardTitle: {
    fontSize: 24,
    fontFamily: 'DMSans_700Bold',
    color: Colors.white,
    textAlign: 'center' as const,
    marginBottom: 8,
  },
  ctaCardSub: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center' as const,
    lineHeight: 21,
    marginBottom: 24,
  },
  ctaCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.accent,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 14,
  },
  ctaCardBtnText: {
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
    color: Colors.primary,
  },

  footer: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    gap: 6,
  },
  footerBrand: {
    fontSize: 12,
    fontFamily: 'DMSans_700Bold',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2,
  },
  footerTagline: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    fontStyle: 'italic' as const,
    color: 'rgba(201,162,78,0.6)',
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  footerLink: {
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
    color: 'rgba(255,255,255,0.5)',
  },
  footerDot: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.2)',
  },

  header: {
    backgroundColor: Colors.primary,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  headerRow: {
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
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  usagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(201, 162, 78, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  usagePillText: {
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.accent,
  },
  settingsBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
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
    ...Platform.select({
      web: { boxShadow: '0px 2px 6px rgba(22, 46, 35, 0.06)' },
      default: { elevation: 2 },
    }),
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
