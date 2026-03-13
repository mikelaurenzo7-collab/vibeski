import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import Colors from '@/constants/colors';
import { useAuth, getAuthToken } from '@/lib/auth-context';
import { getApiUrl } from '@/lib/query-client';

type TabId = 'memories' | 'profile';

interface Memory {
  id: number;
  category: string;
  content: string;
  importance: number;
  source: string | null;
  createdAt: string;
  updatedAt: string;
}

interface BusinessProfile {
  companyName: string;
  industry: string;
  targetAudience: string;
  brandVoice: string;
  techStack: string;
  competitors: string;
  website: string;
  goals: string;
}

const EMPTY_PROFILE: BusinessProfile = {
  companyName: '',
  industry: '',
  targetAudience: '',
  brandVoice: '',
  techStack: '',
  competitors: '',
  website: '',
  goals: '',
};

const CATEGORY_LABELS: Record<string, { label: string; icon: React.ComponentProps<typeof Feather>['name']; color: string }> = {
  preference: { label: 'Preferences', icon: 'heart', color: '#E67E22' },
  tech_stack: { label: 'Tech Stack', icon: 'code', color: '#3B82F6' },
  business: { label: 'Business', icon: 'briefcase', color: '#8B5CF6' },
  style: { label: 'Style', icon: 'feather', color: '#EC4899' },
  project_goal: { label: 'Goals', icon: 'target', color: '#10B981' },
  personal: { label: 'Personal', icon: 'user', color: '#6366F1' },
  feedback: { label: 'Corrections', icon: 'alert-circle', color: '#F59E0B' },
};

const PROFILE_FIELDS: { key: keyof BusinessProfile; label: string; placeholder: string; icon: React.ComponentProps<typeof Feather>['name']; multiline?: boolean }[] = [
  { key: 'companyName', label: 'Company / Brand Name', placeholder: 'Acme Corp', icon: 'briefcase' },
  { key: 'industry', label: 'Industry / Niche', placeholder: 'SaaS, E-commerce, Healthcare...', icon: 'layers' },
  { key: 'targetAudience', label: 'Target Audience', placeholder: 'Small business owners, developers, Gen Z...', icon: 'users' },
  { key: 'brandVoice', label: 'Brand Voice & Tone', placeholder: 'Professional, friendly, bold, minimalist...', icon: 'mic' },
  { key: 'techStack', label: 'Tech Stack', placeholder: 'React, Node.js, PostgreSQL, AWS...', icon: 'cpu' },
  { key: 'competitors', label: 'Key Competitors', placeholder: 'Competitor A, Competitor B...', icon: 'trending-up' },
  { key: 'website', label: 'Website URL', placeholder: 'https://example.com', icon: 'globe' },
  { key: 'goals', label: 'Key Goals', placeholder: 'Launch MVP, grow to 1K users, raise funding...', icon: 'target', multiline: true },
];

export default function MemoryScreen() {
  const insets = useSafeAreaInsets();
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  const [activeTab, setActiveTab] = useState<TabId>('memories');
  const [memories, setMemories] = useState<Memory[]>([]);
  const [profile, setProfile] = useState<BusinessProfile>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileDirty, setProfileDirty] = useState(false);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.replace('/auth');
    }
  }, [authLoading, isLoggedIn]);

  const fetchMemories = useCallback(async () => {
    try {
      const token = getAuthToken();
      if (!token) return;
      const res = await fetch(new URL('/api/memory/all', getApiUrl()).toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMemories(data);
      }
    } catch (e) {
      console.error('Failed to fetch memories:', e);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const token = getAuthToken();
      if (!token) return;
      const res = await fetch(new URL('/api/business-profile', getApiUrl()).toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfile({ ...EMPTY_PROFILE, ...data });
      }
    } catch (e) {
      console.error('Failed to fetch profile:', e);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchMemories(), fetchProfile()]);
      setLoading(false);
    };
    if (isLoggedIn) load();
  }, [isLoggedIn, fetchMemories, fetchProfile]);

  const deleteMemory = async (id: number) => {
    const doDelete = async () => {
      try {
        const token = getAuthToken();
        await fetch(new URL(`/api/memory/${id}`, getApiUrl()).toString(), {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        setMemories(prev => prev.filter(m => m.id !== id));
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        Alert.alert('Error', 'Failed to delete memory');
      }
    };

    if (Platform.OS === 'web') {
      doDelete();
    } else {
      Alert.alert('Delete Memory', 'Remove this from your AI\'s knowledge?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const token = getAuthToken();
      const res = await fetch(new URL('/api/business-profile', getApiUrl()).toString(), {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        setProfileDirty(false);
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Saved', 'Your business profile has been updated. All agents will now use this context.');
      } else {
        Alert.alert('Error', 'Failed to save profile');
      }
    } catch {
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: keyof BusinessProfile, value: string) => {
    setProfile(prev => ({ ...prev, [key]: value }));
    setProfileDirty(true);
  };

  const grouped = memories.reduce<Record<string, Memory[]>>((acc, m) => {
    if (!acc[m.category]) acc[m.category] = [];
    acc[m.category].push(m);
    return acc;
  }, {});

  return (
    <View style={[styles.screen, { paddingBottom: webBottomInset }]}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: (insets.top || webTopInset) + 8 }]}>
        <Pressable
          onPress={() => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
          hitSlop={12}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
        >
          <Feather name="chevron-left" size={22} color="rgba(255,255,255,0.7)" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Memory & Profile</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.tabBar}>
        {([
          { id: 'memories' as TabId, label: 'Memories', icon: 'database' as const },
          { id: 'profile' as TabId, label: 'Business Profile', icon: 'briefcase' as const },
        ]).map(tab => (
          <Pressable
            key={tab.id}
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab(tab.id);
            }}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
          >
            <Feather name={tab.icon} size={14} color={activeTab === tab.id ? Colors.accent : Colors.warmGrayLight} />
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : activeTab === 'memories' ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.infoBox}>
            <Feather name="info" size={14} color={Colors.accent} />
            <Text style={styles.infoText}>
              These are facts your AI agents remember about you, extracted automatically from conversations. You can delete any you don&apos;t want.
            </Text>
          </View>

          {memories.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="database" size={32} color={Colors.warmGrayLight} />
              <Text style={styles.emptyTitle}>No memories yet</Text>
              <Text style={styles.emptySubtitle}>As you chat with agents, they'll learn and remember your preferences, tech stack, and goals.</Text>
            </View>
          ) : (
            Object.entries(grouped).map(([category, items]) => {
              const catInfo = CATEGORY_LABELS[category] || { label: category, icon: 'tag' as const, color: Colors.warmGray };
              return (
                <View key={category} style={styles.categoryGroup}>
                  <View style={styles.categoryHeader}>
                    <View style={[styles.categoryIcon, { backgroundColor: `${catInfo.color}15` }]}>
                      <Feather name={catInfo.icon} size={14} color={catInfo.color} />
                    </View>
                    <Text style={styles.categoryLabel}>{catInfo.label}</Text>
                    <Text style={styles.categoryCount}>{items.length}</Text>
                  </View>
                  {items.map(mem => (
                    <View key={mem.id} style={styles.memoryCard}>
                      <Text style={styles.memoryContent}>{mem.content}</Text>
                      <Pressable
                        onPress={() => deleteMemory(mem.id)}
                        hitSlop={8}
                        style={({ pressed }) => [styles.memoryDelete, pressed && { opacity: 0.5 }]}
                      >
                        <Feather name="x" size={14} color={Colors.warmGrayLight} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              );
            })
          )}

          <Text style={styles.memoryTotal}>{memories.length} memories stored</Text>
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.infoBox}>
            <Feather name="briefcase" size={14} color={Colors.accent} />
            <Text style={styles.infoText}>
              All 15 agents reference your business profile. Fill in what's relevant — leave the rest blank.
            </Text>
          </View>

          {PROFILE_FIELDS.map(field => (
            <View key={field.key} style={styles.fieldGroup}>
              <View style={styles.fieldLabel}>
                <Feather name={field.icon} size={13} color={Colors.warmGray} />
                <Text style={styles.fieldLabelText}>{field.label}</Text>
              </View>
              <TextInput
                style={[styles.fieldInput, field.multiline && styles.fieldInputMultiline]}
                value={profile[field.key]}
                onChangeText={(val) => updateField(field.key, val)}
                placeholder={field.placeholder}
                placeholderTextColor={Colors.warmGrayLight}
                multiline={field.multiline}
                textAlignVertical={field.multiline ? 'top' : 'center'}
              />
            </View>
          ))}

          {profileDirty && (
            <Pressable
              onPress={saveProfile}
              disabled={saving}
              style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
            >
              {saving ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <>
                  <Feather name="check" size={16} color={Colors.primary} />
                  <Text style={styles.saveBtnText}>Save Business Profile</Text>
                </>
              )}
            </Pressable>
          )}

          <View style={styles.profileNote}>
            <Feather name="zap" size={12} color={Colors.accent} />
            <Text style={styles.profileNoteText}>
              Agents use this context automatically. The Builder will use your brand colors, the Writer will match your brand voice, and the Strategist will factor in your competitors.
            </Text>
          </View>
        </ScrollView>
      )}
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
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.white,
    letterSpacing: -0.1,
  },
  headerSpacer: {
    width: 36,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.accent,
  },
  tabText: {
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.warmGrayLight,
  },
  tabTextActive: {
    color: Colors.black,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  infoBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: Colors.accentSubtle,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 19,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.black,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    textAlign: 'center' as const,
    lineHeight: 21,
    maxWidth: 280,
  },
  categoryGroup: {
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  categoryIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    fontSize: 15,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.black,
    flex: 1,
  },
  categoryCount: {
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    color: Colors.warmGrayLight,
  },
  memoryCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.divider,
    alignItems: 'flex-start',
  },
  memoryContent: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.blackSoft,
    lineHeight: 20,
  },
  memoryDelete: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  memoryTotal: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGrayLight,
    textAlign: 'center' as const,
    marginTop: 8,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  fieldLabelText: {
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.warmGray,
  },
  fieldInput: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    color: Colors.black,
  },
  fieldInputMultiline: {
    minHeight: 80,
    paddingTop: 12,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  saveBtnText: {
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
    color: Colors.primary,
  },
  profileNote: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: Colors.accentSubtle,
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    alignItems: 'flex-start',
  },
  profileNoteText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 18,
  },
});
