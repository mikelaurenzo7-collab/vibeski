import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Colors from '@/constants/colors';
import { useAuth, getAuthToken } from '@/lib/auth-context';
import { getApiUrl } from '@/lib/query-client';
import { useChat } from '@/lib/chat-context';

interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  slug: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
}

export default function ProjectsScreen() {
  const insets = useSafeAreaInsets();
  const { isLoggedIn } = useAuth();
  const { createConversation } = useChat();
  const queryClient = useQueryClient();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'live' | 'draft'>('all');
  const [showTemplates, setShowTemplates] = useState(false);

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    queryFn: async () => {
      const token = getAuthToken();
      if (!token) return [];
      const res = await fetch(new URL('/api/projects', getApiUrl()).toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isLoggedIn,
  });

  const { data: templates = [] } = useQuery<Template[]>({
    queryKey: ['/api/project-templates'],
    queryFn: async () => {
      const res = await fetch(new URL('/api/project-templates', getApiUrl()).toString());
      if (!res.ok) return [];
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (projectId: number) => {
      const token = getAuthToken();
      const res = await fetch(new URL(`/api/projects/${projectId}`, getApiUrl()).toString(), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete project');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
    },
    onError: () => {
      Alert.alert('Error', 'Failed to delete project');
    },
  });

  const forkMutation = useMutation({
    mutationFn: async (projectId: number) => {
      const token = getAuthToken();
      const res = await fetch(new URL(`/api/projects/${projectId}/fork`, getApiUrl()).toString(), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Fork failed');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      router.push({ pathname: '/project/[id]', params: { id: String(data.id) } });
    },
    onError: () => {
      Alert.alert('Error', 'Failed to fork project');
    },
  });

  const handleUseTemplate = async (template: Template) => {
    try {
      const convo = await createConversation('builder');
      router.push({
        pathname: '/chat/[id]',
        params: {
          id: convo.id,
          initialPrompt: `Build me a ${template.name}: ${template.description}. Make it production-quality with dark mode, responsive design, animations, and realistic sample data.`,
        },
      });
    } catch {
      Alert.alert('Error', 'Failed to start from template');
    }
  };

  const [menuId, setMenuId] = useState<number | null>(null);

  const handleBack = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleOpen = (projectId: number) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/project/[id]', params: { id: String(projectId) } });
  };

  const handleDelete = (projectId: number) => {
    setMenuId(null);
    if (Platform.OS === 'web') {
      deleteMutation.mutate(projectId);
      return;
    }
    Alert.alert('Delete Project', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(projectId) },
    ]);
  };

  const handleFork = (projectId: number) => {
    setMenuId(null);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    forkMutation.mutate(projectId);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const mins = Math.floor(diff / (1000 * 60));
        return mins <= 1 ? 'Just now' : `${mins}m ago`;
      }
      return `${hours}h ago`;
    }
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filteredProjects = projects.filter(p => {
    if (activeFilter === 'live' && p.status !== 'deployed') return false;
    if (activeFilter === 'draft' && p.status === 'deployed') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q);
    }
    return true;
  });

  const liveCount = projects.filter(p => p.status === 'deployed').length;
  const draftCount = projects.filter(p => p.status !== 'deployed').length;

  const templateCategories = [...new Set(templates.map(t => t.category))];

  const renderProject = ({ item }: { item: Project }) => {
    const isDeployed = item.status === 'deployed';

    return (
      <Pressable
        onPress={() => handleOpen(item.id)}
        onLongPress={() => setMenuId(item.id)}
        style={({ pressed }) => [styles.projectCard, pressed && styles.projectCardPressed]}
      >
        <View style={styles.projectTop}>
          <View style={[styles.iconBadge, isDeployed ? styles.iconBadgeLive : styles.iconBadgeDraft]}>
            <Feather
              name={isDeployed ? 'globe' : 'box'}
              size={16}
              color={isDeployed ? Colors.live : Colors.accent}
            />
          </View>
          <View style={styles.projectInfo}>
            <Text style={styles.projectTitle} numberOfLines={1}>{item.name}</Text>
            <View style={styles.projectMeta}>
              <View style={[styles.statusPill, isDeployed ? styles.statusPillLive : styles.statusPillDraft]}>
                <View style={[styles.statusDotSmall, { backgroundColor: isDeployed ? Colors.live : Colors.warmGrayLight }]} />
                <Text style={[styles.statusLabel, { color: isDeployed ? Colors.live : Colors.warmGray }]}>
                  {isDeployed ? 'Live' : 'Draft'}
                </Text>
              </View>
            </View>
          </View>
          <Pressable
            onPress={() => setMenuId(menuId === item.id ? null : item.id)}
            hitSlop={8}
            style={styles.moreBtn}
          >
            <Feather name="more-horizontal" size={18} color={Colors.warmGray} />
          </Pressable>
        </View>

        {item.description ? (
          <Text style={styles.projectDesc} numberOfLines={2}>{item.description}</Text>
        ) : null}

        <View style={styles.projectBottom}>
          <Text style={styles.projectDate}>{formatDate(item.updatedAt)}</Text>
          {isDeployed && item.slug && (
            <View style={styles.slugBadge}>
              <Feather name="link" size={10} color={Colors.warmGrayLight} />
              <Text style={styles.slugText} numberOfLines={1}>/{item.slug}</Text>
            </View>
          )}
        </View>

        {menuId === item.id && (
          <View style={styles.actionMenu}>
            <Pressable onPress={() => { setMenuId(null); handleOpen(item.id); }} style={styles.actionItem}>
              <Feather name="eye" size={14} color={Colors.black} />
              <Text style={styles.actionText}>View</Text>
            </Pressable>
            <View style={styles.actionDivider} />
            <Pressable onPress={() => handleFork(item.id)} style={styles.actionItem}>
              <Feather name="copy" size={14} color={Colors.black} />
              <Text style={styles.actionText}>Fork</Text>
            </Pressable>
            <View style={styles.actionDivider} />
            <Pressable onPress={() => handleDelete(item.id)} style={styles.actionItem}>
              <Feather name="trash-2" size={14} color={Colors.error} />
              <Text style={[styles.actionText, { color: Colors.error }]}>Delete</Text>
            </Pressable>
          </View>
        )}
      </Pressable>
    );
  };

  const renderTemplateCard = (template: Template) => (
    <Pressable
      key={template.id}
      onPress={() => {
        if (!isLoggedIn) {
          router.push('/auth');
          return;
        }
        handleUseTemplate(template);
      }}
      style={({ pressed }) => [styles.templateCard, pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }]}
    >
      <Text style={styles.templateIcon}>{template.icon}</Text>
      <Text style={styles.templateName} numberOfLines={1}>{template.name}</Text>
      <Text style={styles.templateDesc} numberOfLines={2}>{template.description}</Text>
      <View style={styles.templateAction}>
        <Feather name="plus" size={12} color={Colors.accent} />
        <Text style={styles.templateActionText}>Use</Text>
      </View>
    </Pressable>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Feather name="layers" size={32} color={Colors.warmGrayLight} />
      </View>
      <Text style={styles.emptyTitle}>No projects yet</Text>
      <Text style={styles.emptySubtitle}>
        {isLoggedIn
          ? 'Start from a template below or chat with Builder to create your first app'
          : 'Sign in to save and manage your projects'}
      </Text>
      <Pressable
        onPress={() => isLoggedIn ? setShowTemplates(true) : router.push('/auth')}
        style={({ pressed }) => [styles.emptyBtn, pressed && { opacity: 0.8 }]}
      >
        <Text style={styles.emptyBtnText}>
          {isLoggedIn ? 'Browse Templates' : 'Sign In'}
        </Text>
      </Pressable>
    </View>
  );

  return (
    <View style={[styles.screen, { paddingBottom: webBottomInset }]}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: (insets.top || webTopInset) + 8 }]}>
        <Pressable onPress={handleBack} hitSlop={12} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}>
          <Feather name="chevron-left" size={22} color="rgba(255,255,255,0.7)" />
        </Pressable>
        <Text style={styles.headerTitle}>My Projects</Text>
        <Pressable
          onPress={() => setShowTemplates(!showTemplates)}
          hitSlop={12}
          style={({ pressed }) => [styles.templateToggle, pressed && { opacity: 0.6 }]}
        >
          <Feather name={showTemplates ? 'x' : 'plus-square'} size={20} color={Colors.accent} />
        </Pressable>
      </View>

      {projects.length > 0 && !showTemplates && (
        <View style={styles.searchBar}>
          <Feather name="search" size={16} color={Colors.warmGrayLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search projects..."
            placeholderTextColor={Colors.warmGrayLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Feather name="x" size={16} color={Colors.warmGray} />
            </Pressable>
          ) : null}
        </View>
      )}

      {projects.length > 0 && !showTemplates && (
        <View style={styles.filterBar}>
          {([
            { key: 'all' as const, label: `All (${projects.length})` },
            { key: 'live' as const, label: `Live (${liveCount})` },
            { key: 'draft' as const, label: `Draft (${draftCount})` },
          ]).map(f => (
            <Pressable
              key={f.key}
              onPress={() => setActiveFilter(f.key)}
              style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, activeFilter === f.key && styles.filterChipTextActive]}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {showTemplates ? (
        <ScrollView style={styles.templatesScroll} contentContainerStyle={styles.templatesContent}>
          <View style={styles.templatesBanner}>
            <Feather name="zap" size={20} color={Colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.templatesBannerTitle}>Start from a Template</Text>
              <Text style={styles.templatesBannerSub}>Pick a starter and Builder will generate a production-quality app</Text>
            </View>
          </View>
          {templateCategories.map(category => (
            <View key={category} style={styles.templateCategory}>
              <Text style={styles.templateCategoryTitle}>{category}</Text>
              <View style={styles.templateGrid}>
                {templates.filter(t => t.category === category).map(renderTemplateCard)}
              </View>
            </View>
          ))}
        </ScrollView>
      ) : isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      ) : (
        <FlatList
          data={filteredProjects}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderProject}
          ListEmptyComponent={projects.length === 0 ? renderEmpty : (
            <View style={[styles.emptyContainer, { paddingTop: 40 }]}>
              <Feather name="search" size={24} color={Colors.warmGrayLight} />
              <Text style={styles.emptySubtitle}>No projects match your search</Text>
            </View>
          )}
          contentContainerStyle={[styles.listContent, filteredProjects.length === 0 && styles.listEmpty]}
          showsVerticalScrollIndicator={false}
        />
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
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontFamily: 'DMSans_700Bold',
    color: Colors.white,
    textAlign: 'center' as const,
    letterSpacing: -0.2,
  },
  templateToggle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: Colors.white,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.divider,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.black,
    padding: 0,
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  filterChipActive: {
    backgroundColor: Colors.accentSubtle,
    borderColor: Colors.accent,
  },
  filterChipText: {
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    color: Colors.warmGray,
  },
  filterChipTextActive: {
    color: Colors.accent,
    fontFamily: 'DMSans_600SemiBold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  listEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  projectCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  projectCardPressed: {
    backgroundColor: Colors.creamDark,
    transform: [{ scale: 0.99 }],
  },
  projectTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadgeLive: {
    backgroundColor: 'rgba(40,200,64,0.08)',
  },
  iconBadgeDraft: {
    backgroundColor: Colors.accentSubtle,
  },
  projectInfo: {
    flex: 1,
  },
  projectTitle: {
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
    color: Colors.black,
    letterSpacing: -0.2,
  },
  projectMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 3,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusPillLive: {
    backgroundColor: 'rgba(40,200,64,0.08)',
  },
  statusPillDraft: {
    backgroundColor: Colors.overlay,
  },
  statusDotSmall: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  statusLabel: {
    fontSize: 11,
    fontFamily: 'DMSans_600SemiBold',
  },
  moreBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectDesc: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 19,
    marginBottom: 10,
  },
  projectBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectDate: {
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    color: Colors.warmGrayLight,
  },
  slugBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: 140,
  },
  slugText: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGrayLight,
  },
  actionMenu: {
    position: 'absolute' as const,
    top: 52,
    right: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 4,
    ...Platform.select({
      web: { boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)' },
      default: { elevation: 8 },
    }),
    borderWidth: 1,
    borderColor: Colors.divider,
    zIndex: 10,
    minWidth: 130,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  actionText: {
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
    color: Colors.black,
  },
  actionDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginHorizontal: 10,
  },
  templatesScroll: {
    flex: 1,
  },
  templatesContent: {
    padding: 16,
    paddingBottom: 40,
  },
  templatesBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.accentSubtle,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(201,162,78,0.2)',
  },
  templatesBannerTitle: {
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
    color: Colors.black,
    marginBottom: 2,
  },
  templatesBannerSub: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 17,
  },
  templateCategory: {
    marginBottom: 20,
  },
  templateCategoryTitle: {
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
    color: Colors.blackSoft,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
    marginBottom: 10,
  },
  templateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap' as const,
    gap: 10,
  },
  templateCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.divider,
    width: Platform.OS === 'web' ? 'calc(50% - 5px)' as any : '48%' as any,
    minWidth: 150,
  },
  templateIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  templateName: {
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
    color: Colors.black,
    marginBottom: 4,
  },
  templateDesc: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 16,
    marginBottom: 10,
  },
  templateAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start' as const,
    backgroundColor: Colors.accentSubtle,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  templateActionText: {
    fontSize: 11,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.accent,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'DMSans_700Bold',
    color: Colors.black,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    textAlign: 'center' as const,
    lineHeight: 21,
    marginBottom: 20,
  },
  emptyBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyBtnText: {
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
    color: Colors.white,
  },
});
