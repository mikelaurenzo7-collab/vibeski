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

interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  slug: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ProjectsScreen() {
  const insets = useSafeAreaInsets();
  const { isLoggedIn } = useAuth();
  const queryClient = useQueryClient();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

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

  const deleteMutation = useMutation({
    mutationFn: async (projectId: number) => {
      const token = getAuthToken();
      await fetch(new URL(`/api/projects/${projectId}`, getApiUrl()).toString(), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
    },
  });

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
              color={isDeployed ? '#28C840' : Colors.accent}
            />
          </View>
          <View style={styles.projectInfo}>
            <Text style={styles.projectTitle} numberOfLines={1}>{item.name}</Text>
            <View style={styles.projectMeta}>
              <View style={[styles.statusPill, isDeployed ? styles.statusPillLive : styles.statusPillDraft]}>
                <View style={[styles.statusDotSmall, { backgroundColor: isDeployed ? '#28C840' : Colors.warmGrayLight }]} />
                <Text style={[styles.statusLabel, { color: isDeployed ? '#28C840' : Colors.warmGray }]}>
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
            <Pressable onPress={() => handleDelete(item.id)} style={styles.actionItem}>
              <Feather name="trash-2" size={14} color={Colors.error} />
              <Text style={[styles.actionText, { color: Colors.error }]}>Delete</Text>
            </Pressable>
          </View>
        )}
      </Pressable>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Feather name="layers" size={32} color={Colors.warmGrayLight} />
      </View>
      <Text style={styles.emptyTitle}>No projects yet</Text>
      <Text style={styles.emptySubtitle}>
        {isLoggedIn
          ? 'Chat with the Builder agent to generate your first app'
          : 'Sign in to save and manage your projects'}
      </Text>
      <Pressable
        onPress={() => router.push('/')}
        style={({ pressed }) => [styles.emptyBtn, pressed && { opacity: 0.8 }]}
      >
        <Text style={styles.emptyBtnText}>
          {isLoggedIn ? 'Start Building' : 'Go Home'}
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
        <View style={styles.headerRight}>
          <Text style={styles.projectCount}>{projects.length}</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderProject}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={[styles.listContent, projects.length === 0 && styles.listEmpty]}
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
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  headerRight: {
    width: 36,
    alignItems: 'flex-end',
  },
  projectCount: {
    fontSize: 14,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.accent,
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
    position: 'absolute',
    top: 52,
    right: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 4,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
    elevation: 8,
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
    textAlign: 'center',
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
