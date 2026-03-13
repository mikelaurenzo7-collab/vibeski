import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import Colors from '@/constants/colors';
import { useAuth } from '@/lib/auth-context';
import { getAuthToken } from '@/lib/auth-context';
import { useChat } from '@/lib/chat-context';
import { useSubscription } from '@/lib/subscription-context';
import { AGENTS } from '@/constants/agents';
import { getApiUrl } from '@/lib/query-client';
import { useModel, MODELS, type ModelProvider as ModelProviderType } from '@/lib/model-context';

type TabId = 'overview' | 'analytics' | 'secrets' | 'integrations' | 'settings' | 'data' | 'security';

interface TabDef {
  id: TabId;
  label: string;
  icon: React.ComponentProps<typeof Feather>['name'];
}

const TABS: TabDef[] = [
  { id: 'overview', label: 'Overview', icon: 'grid' },
  { id: 'analytics', label: 'Analytics', icon: 'bar-chart-2' },
  { id: 'secrets', label: 'Secrets', icon: 'key' },
  { id: 'integrations', label: 'Integrations', icon: 'link' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
  { id: 'data', label: 'Data', icon: 'database' },
  { id: 'security', label: 'Security', icon: 'shield' },
];

interface Analytics {
  totalProjects: number;
  totalMessages: number;
  agentUsage: Record<string, number>;
  recentActivity: { date: string; count: number }[];
}

interface SecretEntry {
  key: string;
  value: string;
  visible: boolean;
}

export default function CommandCenterScreen() {
  const insets = useSafeAreaInsets();
  const { user, isLoggedIn, isLoading: authLoading } = useAuth();
  const { conversations } = useChat();
  const { status } = useSubscription();
  const { preferredModel, setPreferredModel } = useModel();
  const modelKeys = Object.keys(MODELS) as ModelProviderType[];
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.replace('/auth');
    }
  }, [authLoading, isLoggedIn]);

  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [secrets, setSecrets] = useState<SecretEntry[]>([]);
  const [newSecretKey, setNewSecretKey] = useState('');
  const [newSecretValue, setNewSecretValue] = useState('');
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    if (!isLoggedIn) return;
    setSettingsLoading(true);
    try {
      const token = getAuthToken();
      const url = new URL('/api/settings', getApiUrl());
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        const secretEntries: SecretEntry[] = Object.entries(data)
          .filter(([k]) => k.startsWith('secret_'))
          .map(([k, v]) => ({ key: k.replace('secret_', ''), value: v as string, visible: false }));
        setSecrets(secretEntries);
      }
    } catch (e) {
      console.error('Failed to fetch settings:', e);
    } finally {
      setSettingsLoading(false);
    }
  }, [isLoggedIn, getAuthToken]);

  const fetchAnalytics = useCallback(async () => {
    if (!isLoggedIn) return;
    setAnalyticsLoading(true);
    try {
      const token = getAuthToken();
      const url = new URL('/api/analytics', getApiUrl());
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setAnalytics(await res.json());
      }
    } catch (e) {
      console.error('Failed to fetch analytics:', e);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [isLoggedIn, getAuthToken]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchSettings();
      fetchAnalytics();
    }
  }, [isLoggedIn, fetchSettings, fetchAnalytics]);

  const saveSetting = async (key: string, value: string) => {
    setSaving(true);
    try {
      const token = getAuthToken();
      const url = new URL('/api/settings', getApiUrl());
      await fetch(url.toString(), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ settings: { [key]: value } }),
      });
    } catch (e) {
      console.error('Failed to save setting:', e);
    } finally {
      setSaving(false);
    }
  };

  const deleteSetting = async (key: string) => {
    try {
      const token = getAuthToken();
      const url = new URL(`/api/settings/${key}`, getApiUrl());
      await fetch(url.toString(), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {
      console.error('Failed to delete setting:', e);
    }
  };

  const handleAddSecret = async () => {
    if (!newSecretKey.trim() || !newSecretValue.trim()) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const storeKey = `secret_${newSecretKey.trim().toUpperCase().replace(/\s+/g, '_')}`;
    await saveSetting(storeKey, newSecretValue.trim());
    setSecrets(prev => [...prev, { key: newSecretKey.trim().toUpperCase().replace(/\s+/g, '_'), value: newSecretValue.trim(), visible: false }]);
    setNewSecretKey('');
    setNewSecretValue('');
  };

  const handleDeleteSecret = (secretKey: string) => {
    const doDelete = async () => {
      await deleteSetting(`secret_${secretKey}`);
      setSecrets(prev => prev.filter(s => s.key !== secretKey));
    };
    if (Platform.OS === 'web') {
      doDelete();
    } else {
      Alert.alert('Delete Secret', `Remove "${secretKey}"?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const toggleSecretVisibility = (key: string) => {
    setSecrets(prev => prev.map(s => s.key === key ? { ...s, visible: !s.visible } : s));
  };

  const handleBack = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleTabChange = (tab: TabId) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  };

  const handleSaveSetting = async (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    await saveSetting(key, value);
  };

  if (!isLoggedIn) {
    return (
      <View style={[styles.screen, { paddingBottom: webBottomInset }]}>
        <StatusBar style="light" />
        <View style={[styles.header, { paddingTop: (insets.top || webTopInset) + 8 }]}>
          <Pressable onPress={handleBack} hitSlop={12} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}>
            <Feather name="chevron-left" size={22} color="rgba(255,255,255,0.7)" />
          </Pressable>
          <Text style={styles.headerTitle}>Command Center</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.guestContainer}>
          <View style={styles.guestIconCircle}>
            <Feather name="terminal" size={28} color={Colors.accent} />
          </View>
          <Text style={styles.guestTitle}>Sign in to Access</Text>
          <Text style={styles.guestSub}>The Command Center requires an account to manage your secrets, integrations, and settings.</Text>
          <Pressable onPress={() => router.push('/auth')} style={({ pressed }) => [styles.guestBtn, pressed && { opacity: 0.8 }]}>
            <Text style={styles.guestBtnText}>Sign In or Sign Up</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const renderOverview = () => {
    const totalMsgs = conversations.reduce((sum, c) => sum + c.messages.length, 0);
    const agentSet = new Set(conversations.map(c => c.agentId));
    return (
      <View style={styles.tabContent}>
        <View style={styles.overviewGrid}>
          <View style={styles.overviewCard}>
            <View style={[styles.overviewIconBox, { backgroundColor: 'rgba(26, 107, 74, 0.08)' }]}>
              <Feather name="folder" size={18} color="#1A6B4A" />
            </View>
            <Text style={styles.overviewNumber}>{conversations.length}</Text>
            <Text style={styles.overviewLabel}>Projects</Text>
          </View>
          <View style={styles.overviewCard}>
            <View style={[styles.overviewIconBox, { backgroundColor: 'rgba(14, 165, 233, 0.08)' }]}>
              <Feather name="message-circle" size={18} color="#0EA5E9" />
            </View>
            <Text style={styles.overviewNumber}>{totalMsgs}</Text>
            <Text style={styles.overviewLabel}>Messages</Text>
          </View>
          <View style={styles.overviewCard}>
            <View style={[styles.overviewIconBox, { backgroundColor: 'rgba(139, 92, 246, 0.08)' }]}>
              <Feather name="cpu" size={18} color={Colors.premium} />
            </View>
            <Text style={styles.overviewNumber}>{agentSet.size}</Text>
            <Text style={styles.overviewLabel}>Agents Used</Text>
          </View>
          <View style={styles.overviewCard}>
            <View style={[styles.overviewIconBox, { backgroundColor: 'rgba(201, 162, 78, 0.08)' }]}>
              <Feather name="zap" size={18} color={Colors.accent} />
            </View>
            <Text style={styles.overviewNumber}>{status.dailyGenerationsUsed}</Text>
            <Text style={styles.overviewLabel}>Used Today</Text>
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>SUBSCRIPTION</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Plan</Text>
              <View style={[styles.badge, status.tier === 'free' ? styles.badgeFree : styles.badgePro]}>
                <Text style={[styles.badgeText, status.tier === 'free' ? styles.badgeTextFree : styles.badgeTextPro]}>
                  {status.tier.toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Daily Usage</Text>
              <Text style={styles.infoValue}>
                {status.dailyGenerationsUsed} / {status.dailyGenerationsLimit === -1 ? '∞' : status.dailyGenerationsLimit}
              </Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Agents</Text>
              <Text style={styles.infoValue}>{status.tier === 'free' ? '2 / 15' : '15 / 15'}</Text>
            </View>
          </View>
          {status.tier === 'free' && (
            <Pressable
              onPress={() => router.push('/pricing')}
              style={({ pressed }) => [styles.upgradeBtn, pressed && { opacity: 0.8 }]}
            >
              <Feather name="zap" size={14} color={Colors.white} />
              <Text style={styles.upgradeBtnText}>Upgrade to Pro</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
          <View style={styles.menuList}>
            <Pressable
              onPress={() => router.push('/projects')}
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
            >
              <View style={[styles.menuIcon, { backgroundColor: 'rgba(26, 107, 74, 0.08)' }]}>
                <Feather name="folder" size={16} color="#1A6B4A" />
              </View>
              <Text style={styles.menuText}>My Projects</Text>
              <Feather name="chevron-right" size={16} color={Colors.warmGrayLight} />
            </Pressable>
            <View style={styles.menuDivider} />
            <Pressable
              onPress={() => router.push('/billing')}
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
            >
              <View style={[styles.menuIcon, { backgroundColor: 'rgba(201, 162, 78, 0.08)' }]}>
                <Feather name="credit-card" size={16} color={Colors.accent} />
              </View>
              <Text style={styles.menuText}>Billing & Usage</Text>
              <Feather name="chevron-right" size={16} color={Colors.warmGrayLight} />
            </Pressable>
            <View style={styles.menuDivider} />
            <Pressable
              onPress={() => router.push('/templates')}
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
            >
              <View style={[styles.menuIcon, { backgroundColor: 'rgba(14, 165, 233, 0.08)' }]}>
                <Feather name="layout" size={16} color="#0EA5E9" />
              </View>
              <Text style={styles.menuText}>Template Gallery</Text>
              <Feather name="chevron-right" size={16} color={Colors.warmGrayLight} />
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  const renderAnalytics = () => {
    if (analyticsLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      );
    }
    const data = analytics || { totalProjects: 0, totalMessages: 0, agentUsage: {}, recentActivity: [] };
    const sortedAgents = Object.entries(data.agentUsage).sort(([, a], [, b]) => b - a);
    const maxUsage = sortedAgents.length > 0 ? sortedAgents[0][1] : 1;

    return (
      <View style={styles.tabContent}>
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>USAGE OVERVIEW</Text>
          <View style={styles.analyticsRow}>
            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsNumber}>{data.totalProjects}</Text>
              <Text style={styles.analyticsLabel}>Total Projects</Text>
            </View>
            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsNumber}>{data.totalMessages}</Text>
              <Text style={styles.analyticsLabel}>Total Messages</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>AGENT PERFORMANCE</Text>
          <View style={styles.infoCard}>
            {sortedAgents.length === 0 ? (
              <Text style={styles.emptyText}>No agent usage data yet</Text>
            ) : (
              sortedAgents.map(([agentId, count], idx) => {
                const agent = AGENTS.find(a => a.id === agentId);
                const pct = Math.round((count / maxUsage) * 100);
                return (
                  <View key={agentId}>
                    {idx > 0 && <View style={styles.infoDivider} />}
                    <View style={styles.agentRow}>
                      <View style={[styles.agentDot, { backgroundColor: agent?.color || Colors.warmGray }]} />
                      <Text style={styles.agentRowName}>{agent?.name || agentId}</Text>
                      <Text style={styles.agentRowCount}>{count}</Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: agent?.color || Colors.primary }]} />
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>RECENT ACTIVITY</Text>
          <View style={styles.infoCard}>
            {data.recentActivity.length === 0 ? (
              <Text style={styles.emptyText}>No recent activity</Text>
            ) : (
              data.recentActivity.slice(0, 7).map((entry, idx) => {
                const dateObj = new Date(entry.date);
                const dayLabel = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                return (
                  <View key={entry.date}>
                    {idx > 0 && <View style={styles.infoDivider} />}
                    <View style={styles.infoRow}>
                      <Text style={styles.infoKey}>{dayLabel}</Text>
                      <View style={styles.activityPill}>
                        <Text style={styles.activityPillText}>{entry.count} session{entry.count !== 1 ? 's' : ''}</Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderSecrets = () => {
    return (
      <View style={styles.tabContent}>
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>API KEYS & SECRETS</Text>
          <Text style={styles.sectionDescription}>
            Store your API keys securely. These are encrypted and only visible to you.
          </Text>
          <View style={styles.infoCard}>
            {secrets.length === 0 ? (
              <Text style={styles.emptyText}>No secrets stored yet</Text>
            ) : (
              secrets.map((secret, idx) => (
                <View key={secret.key}>
                  {idx > 0 && <View style={styles.infoDivider} />}
                  <View style={styles.secretRow}>
                    <View style={styles.secretInfo}>
                      <Text style={styles.secretKey}>{secret.key}</Text>
                      <Text style={styles.secretValue} numberOfLines={1}>
                        {secret.visible ? secret.value : '•'.repeat(Math.min(secret.value.length, 24))}
                      </Text>
                    </View>
                    <View style={styles.secretActions}>
                      <Pressable onPress={() => toggleSecretVisibility(secret.key)} hitSlop={8} style={styles.secretActionBtn}>
                        <Feather name={secret.visible ? 'eye-off' : 'eye'} size={16} color={Colors.warmGray} />
                      </Pressable>
                      <Pressable onPress={() => handleDeleteSecret(secret.key)} hitSlop={8} style={styles.secretActionBtn}>
                        <Feather name="trash-2" size={16} color={Colors.error} />
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>ADD NEW SECRET</Text>
          <View style={styles.addSecretCard}>
            <TextInput
              style={styles.secretInput}
              placeholder="Key name (e.g. OPENAI_API_KEY)"
              placeholderTextColor={Colors.warmGrayLight}
              value={newSecretKey}
              onChangeText={setNewSecretKey}
              autoCapitalize="characters"
            />
            <TextInput
              style={styles.secretInput}
              placeholder="Value (e.g. sk-...)"
              placeholderTextColor={Colors.warmGrayLight}
              value={newSecretValue}
              onChangeText={setNewSecretValue}
              secureTextEntry
            />
            <Pressable
              onPress={handleAddSecret}
              disabled={!newSecretKey.trim() || !newSecretValue.trim()}
              style={({ pressed }) => [
                styles.addSecretBtn,
                (!newSecretKey.trim() || !newSecretValue.trim()) && styles.addSecretBtnDisabled,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Feather name="plus" size={16} color={Colors.white} />
              <Text style={styles.addSecretBtnText}>Add Secret</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  const renderIntegrations = () => {
    const integrations = [
      { id: 'webhook', name: 'Webhooks', description: 'Send events to external services', icon: 'link' as const, color: '#0EA5E9', connected: !!settings.integration_webhook },
      { id: 'slack', name: 'Slack', description: 'Get notifications in Slack', icon: 'message-square' as const, color: '#4A154B', connected: !!settings.integration_slack },
      { id: 'github', name: 'GitHub', description: 'Connect your repositories', icon: 'github' as const, color: '#1F2937', connected: !!settings.integration_github },
      { id: 'notion', name: 'Notion', description: 'Export content to Notion', icon: 'book-open' as const, color: '#000000', connected: !!settings.integration_notion },
      { id: 'zapier', name: 'Zapier', description: 'Automate with 5000+ apps', icon: 'zap' as const, color: '#FF4A00', connected: !!settings.integration_zapier },
      { id: 'analytics', name: 'Google Analytics', description: 'Track usage analytics', icon: 'activity' as const, color: '#E37400', connected: !!settings.integration_analytics },
    ];

    return (
      <View style={styles.tabContent}>
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>CONNECTED SERVICES</Text>
          <Text style={styles.sectionDescription}>
            Connect external services to extend your workflow.
          </Text>
          {integrations.map((integration) => (
            <Pressable
              key={integration.id}
              style={({ pressed }) => [styles.integrationCard, pressed && { backgroundColor: Colors.creamDark }]}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <View style={[styles.integrationIcon, { backgroundColor: `${integration.color}12` }]}>
                <Feather name={integration.icon} size={20} color={integration.color} />
              </View>
              <View style={styles.integrationInfo}>
                <Text style={styles.integrationName}>{integration.name}</Text>
                <Text style={styles.integrationDesc}>{integration.description}</Text>
              </View>
              <View style={[styles.statusDot, integration.connected ? styles.statusConnected : styles.statusDisconnected]} />
            </Pressable>
          ))}
        </View>
      </View>
    );
  };

  const renderSettings = () => {
    const defaultAgent = settings.default_agent || 'builder';
    const theme = settings.theme || 'system';
    const notifications = settings.notifications !== 'false';
    return (
      <View style={styles.tabContent}>
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>AI MODEL</Text>
          <Text style={[styles.settingDesc, { marginBottom: 12, paddingHorizontal: 4 }]}>Choose your preferred AI brain. If unavailable, we auto-fallback to the next.</Text>
          <View style={{ gap: 8 }}>
            {modelKeys.map((key) => {
              const m = MODELS[key];
              const isActive = preferredModel === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => {
                    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setPreferredModel(key);
                  }}
                  style={[
                    styles.infoCard,
                    { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16 },
                    isActive && { borderColor: Colors.accent, borderWidth: 2 },
                  ]}
                >
                  <Text style={{ fontSize: 22 }}>{m.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.settingTitle, isActive && { color: Colors.accent }]}>{m.name}</Text>
                    <Text style={styles.settingDesc}>{m.description}</Text>
                  </View>
                  {isActive && <Feather name="check-circle" size={20} color={Colors.accent} />}
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>PREFERENCES</Text>
          <View style={styles.infoCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Default Agent</Text>
                <Text style={styles.settingDesc}>Agent used for new chats</Text>
              </View>
              <Pressable
                onPress={() => {
                  const agents = AGENTS.slice(0, 6);
                  const currentIdx = agents.findIndex(a => a.id === defaultAgent);
                  const nextIdx = (currentIdx + 1) % agents.length;
                  handleSaveSetting('default_agent', agents[nextIdx].id);
                }}
                style={styles.settingAction}
              >
                <Text style={styles.settingActionText}>
                  {AGENTS.find(a => a.id === defaultAgent)?.name || 'Builder'}
                </Text>
                <Feather name="chevron-right" size={14} color={Colors.warmGrayLight} />
              </Pressable>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Theme</Text>
                <Text style={styles.settingDesc}>Appearance mode</Text>
              </View>
              <Pressable
                onPress={() => {
                  const themes = ['system', 'light', 'dark'];
                  const idx = themes.indexOf(theme);
                  const next = themes[(idx + 1) % themes.length];
                  handleSaveSetting('theme', next);
                }}
                style={styles.settingAction}
              >
                <Text style={styles.settingActionText}>{theme.charAt(0).toUpperCase() + theme.slice(1)}</Text>
                <Feather name="chevron-right" size={14} color={Colors.warmGrayLight} />
              </Pressable>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Notifications</Text>
                <Text style={styles.settingDesc}>Push and email alerts</Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={(val) => handleSaveSetting('notifications', val ? 'true' : 'false')}
                trackColor={{ false: Colors.divider, true: Colors.primary }}
                thumbColor={Colors.white}
              />
            </View>
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>GENERATION</Text>
          <View style={styles.infoCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Response Length</Text>
                <Text style={styles.settingDesc}>Default token limit</Text>
              </View>
              <Pressable
                onPress={() => {
                  const options = ['standard', 'long', 'max'];
                  const current = settings.response_length || 'standard';
                  const idx = options.indexOf(current);
                  const next = options[(idx + 1) % options.length];
                  handleSaveSetting('response_length', next);
                }}
                style={styles.settingAction}
              >
                <Text style={styles.settingActionText}>
                  {(settings.response_length || 'standard').charAt(0).toUpperCase() + (settings.response_length || 'standard').slice(1)}
                </Text>
                <Feather name="chevron-right" size={14} color={Colors.warmGrayLight} />
              </Pressable>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Auto-save Chats</Text>
                <Text style={styles.settingDesc}>Save conversations automatically</Text>
              </View>
              <Switch
                value={settings.auto_save !== 'false'}
                onValueChange={(val) => handleSaveSetting('auto_save', val ? 'true' : 'false')}
                trackColor={{ false: Colors.divider, true: Colors.primary }}
                thumbColor={Colors.white}
              />
            </View>
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Username</Text>
              <Text style={styles.infoValue}>{user?.username}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Email</Text>
              <Text style={styles.infoValue}>{user?.email || 'Not set'}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>User ID</Text>
              <Text style={[styles.infoValue, { fontSize: 11 }]} numberOfLines={1}>{user?.id}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderData = () => {
    const totalMsgs = conversations.reduce((sum, c) => sum + c.messages.length, 0);
    const dataSize = conversations.reduce((sum, c) => {
      return sum + c.messages.reduce((ms, m) => ms + (m.content?.length || 0), 0);
    }, 0);
    const dataSizeKb = Math.round(dataSize / 1024);

    return (
      <View style={styles.tabContent}>
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>DATA OVERVIEW</Text>
          <View style={styles.analyticsRow}>
            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsNumber}>{conversations.length}</Text>
              <Text style={styles.analyticsLabel}>Conversations</Text>
            </View>
            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsNumber}>{dataSizeKb}KB</Text>
              <Text style={styles.analyticsLabel}>Data Size</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>EXPORT</Text>
          <View style={styles.menuList}>
            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                const exportData = JSON.stringify(
                  conversations.map(c => ({
                    title: c.title,
                    agent: c.agentId,
                    messages: c.messages.map(m => ({ role: m.role, content: m.content })),
                    createdAt: c.createdAt,
                  })),
                  null,
                  2
                );
                if (Platform.OS === 'web') {
                  const blob = new Blob([exportData], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'field-of-dreams-export.json';
                  a.click();
                  URL.revokeObjectURL(url);
                } else {
                  Alert.alert('Export Ready', `${conversations.length} conversations (${dataSizeKb}KB) ready for export.`);
                }
              }}
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
            >
              <View style={[styles.menuIcon, { backgroundColor: 'rgba(14, 165, 233, 0.08)' }]}>
                <Feather name="download" size={16} color="#0EA5E9" />
              </View>
              <Text style={styles.menuText}>Export All Data (JSON)</Text>
              <Feather name="chevron-right" size={16} color={Colors.warmGrayLight} />
            </Pressable>
            <View style={styles.menuDivider} />
            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                const lines = conversations.flatMap(c => [
                  `\n=== ${c.title} (${c.agentId}) ===\n`,
                  ...c.messages.map(m => `[${m.role}]: ${m.content}\n`),
                ]);
                const text = lines.join('\n');
                if (Platform.OS === 'web') {
                  const blob = new Blob([text], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'field-of-dreams-export.txt';
                  a.click();
                  URL.revokeObjectURL(url);
                } else {
                  Alert.alert('Export Ready', 'Text export ready.');
                }
              }}
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
            >
              <View style={[styles.menuIcon, { backgroundColor: 'rgba(139, 92, 246, 0.08)' }]}>
                <Feather name="file-text" size={16} color={Colors.premium} />
              </View>
              <Text style={styles.menuText}>Export as Plain Text</Text>
              <Feather name="chevron-right" size={16} color={Colors.warmGrayLight} />
            </Pressable>
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>DANGER ZONE</Text>
          <Pressable
            onPress={() => {
              const doIt = () => Alert.alert('Coming Soon', 'Bulk delete is not yet available.');
              if (Platform.OS === 'web') doIt();
              else doIt();
            }}
            style={({ pressed }) => [styles.dangerBtn, pressed && { opacity: 0.8 }]}
          >
            <Feather name="trash-2" size={16} color={Colors.error} />
            <Text style={styles.dangerBtnText}>Delete All Conversations</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const renderSecurity = () => {
    return (
      <View style={styles.tabContent}>
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>ACCOUNT SECURITY</Text>
          <View style={styles.infoCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Password</Text>
                <Text style={styles.settingDesc}>Last changed: Never</Text>
              </View>
              <Pressable style={styles.settingAction}>
                <Text style={[styles.settingActionText, { color: Colors.primary }]}>Change</Text>
              </Pressable>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Two-Factor Auth</Text>
                <Text style={styles.settingDesc}>Extra layer of security</Text>
              </View>
              <View style={[styles.badge, styles.badgeFree]}>
                <Text style={[styles.badgeText, styles.badgeTextFree]}>COMING SOON</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>ACTIVE SESSIONS</Text>
          <View style={styles.infoCard}>
            <View style={styles.sessionRow}>
              <View style={[styles.sessionDot, { backgroundColor: Colors.success }]} />
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionDevice}>Current Session</Text>
                <Text style={styles.sessionMeta}>{Platform.OS === 'web' ? 'Web Browser' : 'Mobile App'} — Active now</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>PRIVACY</Text>
          <View style={styles.menuList}>
            <Pressable style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}>
              <View style={[styles.menuIcon, { backgroundColor: 'rgba(20, 184, 166, 0.08)' }]}>
                <Feather name="file-text" size={16} color="#14B8A6" />
              </View>
              <Text style={styles.menuText}>Privacy Policy</Text>
              <Feather name="external-link" size={14} color={Colors.warmGrayLight} />
            </Pressable>
            <View style={styles.menuDivider} />
            <Pressable style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}>
              <View style={[styles.menuIcon, { backgroundColor: 'rgba(139, 92, 246, 0.08)' }]}>
                <Feather name="book" size={16} color={Colors.premium} />
              </View>
              <Text style={styles.menuText}>Terms of Service</Text>
              <Feather name="external-link" size={14} color={Colors.warmGrayLight} />
            </Pressable>
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>DANGER ZONE</Text>
          <Pressable
            onPress={() => Alert.alert('Coming Soon', 'Account deletion is not yet available.')}
            style={({ pressed }) => [styles.dangerBtn, pressed && { opacity: 0.8 }]}
          >
            <Feather name="alert-triangle" size={16} color={Colors.error} />
            <Text style={styles.dangerBtnText}>Delete Account</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'analytics': return renderAnalytics();
      case 'secrets': return renderSecrets();
      case 'integrations': return renderIntegrations();
      case 'settings': return renderSettings();
      case 'data': return renderData();
      case 'security': return renderSecurity();
      default: return renderOverview();
    }
  };

  return (
    <View style={[styles.screen, { paddingBottom: webBottomInset }]}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: (insets.top || webTopInset) + 8 }]}>
        <Pressable onPress={handleBack} hitSlop={12} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}>
          <Feather name="chevron-left" size={22} color="rgba(255,255,255,0.7)" />
        </Pressable>
        <Text style={styles.headerTitle}>Command Center</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabBar}
        style={styles.tabBarScroll}
      >
        {TABS.map((tab) => (
          <Pressable
            key={tab.id}
            onPress={() => handleTabChange(tab.id)}
            style={[styles.tabPill, activeTab === tab.id && styles.tabPillActive]}
          >
            <Feather
              name={tab.icon}
              size={14}
              color={activeTab === tab.id ? Colors.white : Colors.warmGray}
            />
            <Text style={[styles.tabPillText, activeTab === tab.id && styles.tabPillTextActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={styles.mainScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderActiveTab()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.cream },
  header: {
    backgroundColor: Colors.primary,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 17, fontFamily: 'DMSans_700Bold', color: Colors.white, textAlign: 'center', letterSpacing: -0.2 },
  headerSpacer: { width: 36 },
  tabBarScroll: { backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.divider, flexGrow: 0 },
  tabBar: { paddingHorizontal: 12, paddingVertical: 10, gap: 6 },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  tabPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabPillText: { fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: Colors.warmGray },
  tabPillTextActive: { color: Colors.white },
  mainScroll: { flex: 1 },
  mainScrollContent: { paddingBottom: 40 },
  tabContent: { padding: 16 },
  overviewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  overviewCard: {
    width: '48%' as any,
    flexGrow: 1,
    flexBasis: '46%' as any,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.divider,
    alignItems: 'flex-start',
  },
  overviewIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  overviewNumber: { fontSize: 24, fontFamily: 'DMSans_700Bold', color: Colors.black, letterSpacing: -0.5 },
  overviewLabel: { fontSize: 12, fontFamily: 'DMSans_500Medium', color: Colors.warmGray, marginTop: 2 },
  sectionBlock: { marginBottom: 20 },
  sectionLabel: { fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: Colors.warmGrayDark, marginBottom: 8, paddingHorizontal: 4, letterSpacing: 0.5, textTransform: 'uppercase' },
  sectionDescription: { fontSize: 13, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginBottom: 10, paddingHorizontal: 4, lineHeight: 19 },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.divider,
    padding: 14,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  infoDivider: { height: 1, backgroundColor: Colors.divider, marginVertical: 6 },
  infoKey: { fontSize: 14, fontFamily: 'DMSans_500Medium', color: Colors.warmGrayDark },
  infoValue: { fontSize: 14, fontFamily: 'DMSans_500Medium', color: Colors.black },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeFree: { backgroundColor: Colors.cream },
  badgePro: { backgroundColor: 'rgba(201, 162, 78, 0.12)' },
  badgeText: { fontSize: 11, fontFamily: 'DMSans_700Bold', letterSpacing: 0.5 },
  badgeTextFree: { color: Colors.warmGray },
  badgeTextPro: { color: Colors.accent },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 10,
  },
  upgradeBtnText: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.white },
  menuList: { backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1, borderColor: Colors.divider, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, gap: 12 },
  menuItemPressed: { backgroundColor: Colors.creamDark },
  menuIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  menuText: { flex: 1, fontSize: 15, fontFamily: 'DMSans_500Medium', color: Colors.black },
  menuDivider: { height: 1, backgroundColor: Colors.divider, marginLeft: 58 },
  loadingContainer: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  loadingText: { fontSize: 14, fontFamily: 'DMSans_400Regular', color: Colors.warmGray },
  analyticsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  analyticsCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  analyticsNumber: { fontSize: 22, fontFamily: 'DMSans_700Bold', color: Colors.black },
  analyticsLabel: { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginTop: 2 },
  agentRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  agentDot: { width: 8, height: 8, borderRadius: 4 },
  agentRowName: { flex: 1, fontSize: 14, fontFamily: 'DMSans_500Medium', color: Colors.black },
  agentRowCount: { fontSize: 14, fontFamily: 'DMSans_600SemiBold', color: Colors.warmGrayDark },
  barTrack: { height: 6, backgroundColor: Colors.cream, borderRadius: 3, marginTop: 4, marginBottom: 4 },
  barFill: { height: 6, borderRadius: 3 },
  activityPill: { backgroundColor: Colors.cream, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  activityPillText: { fontSize: 12, fontFamily: 'DMSans_500Medium', color: Colors.warmGrayDark },
  emptyText: { fontSize: 14, fontFamily: 'DMSans_400Regular', color: Colors.warmGrayLight, textAlign: 'center', paddingVertical: 16 },
  secretRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  secretInfo: { flex: 1 },
  secretKey: { fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: Colors.black, letterSpacing: 0.2 },
  secretValue: { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginTop: 2 },
  secretActions: { flexDirection: 'row', gap: 12 },
  secretActionBtn: { padding: 4 },
  addSecretCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.divider,
    padding: 14,
    gap: 10,
  },
  secretInput: {
    backgroundColor: Colors.cream,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.black,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  addSecretBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
  },
  addSecretBtnDisabled: { opacity: 0.4 },
  addSecretBtnText: { fontSize: 14, fontFamily: 'DMSans_600SemiBold', color: Colors.white },
  integrationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.divider,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  integrationIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  integrationInfo: { flex: 1 },
  integrationName: { fontSize: 15, fontFamily: 'DMSans_600SemiBold', color: Colors.black },
  integrationDesc: { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginTop: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusConnected: { backgroundColor: Colors.success },
  statusDisconnected: { backgroundColor: Colors.divider },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  settingInfo: { flex: 1 },
  settingTitle: { fontSize: 15, fontFamily: 'DMSans_500Medium', color: Colors.black },
  settingDesc: { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginTop: 2 },
  settingAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  settingActionText: { fontSize: 14, fontFamily: 'DMSans_500Medium', color: Colors.warmGrayDark },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(184, 59, 59, 0.2)',
    paddingVertical: 16,
  },
  dangerBtnText: { fontSize: 15, fontFamily: 'DMSans_600SemiBold', color: Colors.error },
  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  sessionDot: { width: 8, height: 8, borderRadius: 4 },
  sessionInfo: { flex: 1 },
  sessionDevice: { fontSize: 14, fontFamily: 'DMSans_500Medium', color: Colors.black },
  sessionMeta: { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginTop: 2 },
  guestContainer: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, flex: 1 },
  guestIconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(201, 162, 78, 0.08)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  guestTitle: { fontSize: 20, fontFamily: 'DMSans_700Bold', color: Colors.black, marginBottom: 8 },
  guestSub: { fontSize: 14, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, textAlign: 'center', lineHeight: 21, marginBottom: 24 },
  guestBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 32, paddingVertical: 14 },
  guestBtnText: { fontSize: 15, fontFamily: 'DMSans_700Bold', color: Colors.white },
});
