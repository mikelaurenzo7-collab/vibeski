import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Platform,
  Alert,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Linking,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Colors from '@/constants/colors';
import { getApiUrl } from '@/lib/query-client';
import { getAuthToken, useAuth } from '@/lib/auth-context';
import { assembleProjectHtml } from '@/lib/file-parser';

interface ProjectFile {
  id: number;
  filePath: string;
  content: string;
  fileType: string;
}

interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  slug: string | null;
  files: ProjectFile[];
  createdAt: string;
  updatedAt: string;
}

interface ProjectVersion {
  id: number;
  versionNumber: number;
  description: string | null;
  fileCount: number;
  createdAt: string;
}

type TabType = 'preview' | 'files' | 'versions';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.replace('/auth');
    }
  }, [authLoading, isLoggedIn]);

  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('preview');
  const [editingContent, setEditingContent] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const { data: project, isLoading, error } = useQuery<Project>({
    queryKey: ['/api/projects', id],
    queryFn: async () => {
      const token = getAuthToken();
      const res = await fetch(new URL(`/api/projects/${id}`, getApiUrl()).toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load project');
      return res.json();
    },
    enabled: !!id,
  });

  const { data: versions } = useQuery<ProjectVersion[]>({
    queryKey: ['/api/projects', id, 'versions'],
    queryFn: async () => {
      const token = getAuthToken();
      const res = await fetch(new URL(`/api/projects/${id}/versions`, getApiUrl()).toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!id && activeTab === 'versions',
  });

  const deployMutation = useMutation({
    mutationFn: async () => {
      const token = getAuthToken();
      const res = await fetch(new URL(`/api/projects/${id}/deploy`, getApiUrl()).toString(), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Deploy failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
    },
  });

  const undeployMutation = useMutation({
    mutationFn: async () => {
      const token = getAuthToken();
      const res = await fetch(new URL(`/api/projects/${id}/undeploy`, getApiUrl()).toString(), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Undeploy failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
    },
  });

  const saveFilesMutation = useMutation({
    mutationFn: async (files: { filePath: string; content: string; fileType: string }[]) => {
      const token = getAuthToken();
      const res = await fetch(new URL(`/api/projects/${id}/save-files`, getApiUrl()).toString(), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ files }),
      });
      if (!res.ok) throw new Error('Save failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects', id, 'versions'] });
      setIsEditing(false);
      setEditingContent(null);
    },
  });

  const forkMutation = useMutation({
    mutationFn: async () => {
      const token = getAuthToken();
      const res = await fetch(new URL(`/api/projects/${id}/fork`, getApiUrl()).toString(), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Fork failed');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      router.push(`/project/${data.id}`);
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (versionId: number) => {
      const token = getAuthToken();
      const res = await fetch(new URL(`/api/projects/${id}/versions/${versionId}/restore`, getApiUrl()).toString(), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Restore failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects', id, 'versions'] });
      setActiveTab('preview');
    },
  });

  const handleDeploy = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    deployMutation.mutate();
  }, []);

  const handleUndeploy = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (Platform.OS === 'web') {
      undeployMutation.mutate();
    } else {
      Alert.alert('Take Offline', 'This will make your project unavailable at its live URL.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Offline', style: 'destructive', onPress: () => undeployMutation.mutate() },
      ]);
    }
  }, []);

  const handleOpenLive = useCallback(() => {
    if (!project?.slug) return;
    const url = `${getApiUrl()}live/${project.slug}/`;
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
  }, [project?.slug]);

  const handleBack = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleSaveEdit = useCallback(() => {
    if (!project?.files || !selectedFile || editingContent === null) return;
    const updatedFiles = project.files.map(f =>
      f.filePath === selectedFile ? { filePath: f.filePath, content: editingContent, fileType: f.fileType } : { filePath: f.filePath, content: f.content, fileType: f.fileType }
    );
    saveFilesMutation.mutate(updatedFiles);
  }, [project, selectedFile, editingContent]);

  const handleExport = useCallback(async () => {
    if (!project) return;
    try {
      const token = getAuthToken();
      const res = await fetch(new URL(`/api/projects/${id}/export`, getApiUrl()).toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const blob = new Blob(
        [data.files.map((f: any) => `// ===== ${f.path} =====\n${f.content}`).join('\n\n')],
        { type: 'text/plain' }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name.replace(/\s+/g, '-').toLowerCase()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      Alert.alert('Error', 'Failed to export project');
    }
  }, [project, id]);

  const handleRestore = useCallback((versionId: number, versionNumber: number) => {
    if (Platform.OS === 'web') {
      if (confirm(`Restore to version ${versionNumber}? Your current files will be saved as a new version first.`)) {
        restoreMutation.mutate(versionId);
      }
    } else {
      Alert.alert('Restore Version', `Restore to version ${versionNumber}? Current files will be saved first.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Restore', onPress: () => restoreMutation.mutate(versionId) },
      ]);
    }
  }, []);

  const startEditing = useCallback(() => {
    if (!currentFile) return;
    setEditingContent(currentFile.content);
    setIsEditing(true);
  }, [selectedFile, project]);

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setEditingContent(null);
  }, []);

  const assembledHtml = project?.files
    ? assembleProjectHtml(project.files.map(f => ({
        path: f.filePath,
        content: f.content,
        type: f.fileType,
      })))
    : '';

  const currentFile = selectedFile
    ? project?.files?.find(f => f.filePath === selectedFile)
    : null;

  if (isLoading) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (error || !project) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Text style={styles.errorText}>Project not found</Text>
        <Pressable onPress={handleBack} style={styles.errorBtn}>
          <Text style={styles.errorBtnText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const isDeployed = project.status === 'deployed';
  const isDeploying = deployMutation.isPending;
  const fileCount = project.files?.length || 0;

  return (
    <View style={[styles.screen, { paddingBottom: webBottomInset }]}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: (insets.top || webTopInset) + 8 }]}>
        <Pressable onPress={handleBack} hitSlop={12} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}>
          <Feather name="chevron-left" size={22} color="rgba(255,255,255,0.7)" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{project.name}</Text>
          <View style={[styles.statusBadge, isDeployed ? styles.statusLive : styles.statusDraft]}>
            <View style={[styles.statusDot, { backgroundColor: isDeployed ? Colors.live : Colors.warmGrayLight }]} />
            <Text style={[styles.statusText, { color: isDeployed ? Colors.live : Colors.warmGrayLight }]}>
              {isDeployed ? 'LIVE' : 'DRAFT'}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => setShowActions(!showActions)}
          hitSlop={12}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
        >
          <Feather name="more-vertical" size={18} color="rgba(255,255,255,0.7)" />
        </Pressable>
      </View>

      {showActions && (
        <View style={styles.actionsDropdown}>
          <Pressable onPress={() => { setShowActions(false); forkMutation.mutate(); }} style={styles.actionItem}>
            <Feather name="copy" size={15} color={Colors.blackSoft} />
            <Text style={styles.actionText}>{forkMutation.isPending ? 'Forking...' : 'Fork Project'}</Text>
          </Pressable>
          {Platform.OS === 'web' && (
            <Pressable onPress={() => { setShowActions(false); handleExport(); }} style={styles.actionItem}>
              <Feather name="download" size={15} color={Colors.blackSoft} />
              <Text style={styles.actionText}>Export / Download</Text>
            </Pressable>
          )}
          {isDeployed && (
            <Pressable onPress={() => { setShowActions(false); handleOpenLive(); }} style={styles.actionItem}>
              <Feather name="external-link" size={15} color={Colors.blackSoft} />
              <Text style={styles.actionText}>Open Live URL</Text>
            </Pressable>
          )}
        </View>
      )}

      <View style={styles.toolbar}>
        <View style={styles.tabs}>
          {(['preview', 'files', 'versions'] as TabType[]).map(tab => (
            <Pressable
              key={tab}
              onPress={() => { setActiveTab(tab); setSelectedFile(null); setIsEditing(false); setEditingContent(null); }}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
            >
              <Feather
                name={tab === 'preview' ? 'eye' : tab === 'files' ? 'file-text' : 'git-branch'}
                size={14}
                color={activeTab === tab ? Colors.accent : Colors.warmGray}
              />
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'preview' ? 'Preview' : tab === 'files' ? `Files (${fileCount})` : `History${versions?.length ? ` (${versions.length})` : ''}`}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.toolbarActions}>
          {isDeployed ? (
            <Pressable
              onPress={handleUndeploy}
              disabled={undeployMutation.isPending}
              style={({ pressed }) => [styles.deployBtn, styles.undeployBtn, pressed && { opacity: 0.8 }]}
            >
              <Feather name="pause-circle" size={14} color={Colors.error} />
              <Text style={[styles.deployBtnText, { color: Colors.error }]}>
                {undeployMutation.isPending ? 'Stopping...' : 'Offline'}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={handleDeploy}
              disabled={isDeploying || fileCount === 0}
              style={({ pressed }) => [
                styles.deployBtn,
                styles.deployBtnActive,
                pressed && { opacity: 0.8 },
                (isDeploying || fileCount === 0) && { opacity: 0.5 },
              ]}
            >
              {isDeploying ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Feather name="upload-cloud" size={14} color={Colors.white} />
              )}
              <Text style={[styles.deployBtnText, { color: Colors.white }]}>
                {isDeploying ? 'Deploying...' : 'Deploy'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {isDeployed && project.slug && (
        <Pressable onPress={handleOpenLive} style={styles.liveBanner}>
          <View style={styles.liveBannerLeft}>
            <View style={styles.liveIndicator} />
            <Text style={styles.liveBannerText} numberOfLines={1}>
              {getApiUrl()}live/{project.slug}/
            </Text>
          </View>
          <Feather name="arrow-up-right" size={14} color={Colors.accent} />
        </Pressable>
      )}

      {activeTab === 'preview' ? (
        <View style={styles.previewContainer}>
          {assembledHtml ? (
            Platform.OS === 'web' ? (
              <iframe
                srcDoc={assembledHtml}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  backgroundColor: '#ffffff',
                } as any}
                sandbox="allow-scripts allow-forms allow-popups"
              />
            ) : (
              <View style={styles.center}>
                <Feather name="globe" size={24} color={Colors.accent} />
                <Text style={styles.nativePreviewText}>Open on web for live preview</Text>
              </View>
            )
          ) : (
            <View style={styles.center}>
              <Feather name="file-minus" size={24} color={Colors.warmGrayLight} />
              <Text style={styles.nativePreviewText}>No files to preview</Text>
            </View>
          )}
        </View>
      ) : activeTab === 'files' ? (
        <View style={styles.filesContainer}>
          {selectedFile && currentFile ? (
            <View style={{ flex: 1 }}>
              <View style={styles.fileHeader}>
                <Pressable onPress={() => { setSelectedFile(null); setIsEditing(false); setEditingContent(null); }} style={styles.fileBack}>
                  <Feather name="chevron-left" size={16} color={Colors.accent} />
                  <Text style={styles.fileBackText}>{currentFile.filePath}</Text>
                </Pressable>
                <View style={styles.fileActions}>
                  {isEditing ? (
                    <>
                      <Pressable onPress={cancelEditing} style={styles.fileActionBtn}>
                        <Feather name="x" size={14} color={Colors.warmGray} />
                        <Text style={[styles.fileActionText, { color: Colors.warmGray }]}>Cancel</Text>
                      </Pressable>
                      <Pressable onPress={handleSaveEdit} disabled={saveFilesMutation.isPending} style={[styles.fileActionBtn, styles.saveBtn]}>
                        {saveFilesMutation.isPending ? (
                          <ActivityIndicator size="small" color={Colors.white} />
                        ) : (
                          <Feather name="check" size={14} color={Colors.white} />
                        )}
                        <Text style={[styles.fileActionText, { color: Colors.white }]}>Save</Text>
                      </Pressable>
                    </>
                  ) : (
                    <Pressable onPress={startEditing} style={[styles.fileActionBtn, styles.editBtn]}>
                      <Feather name="edit-2" size={14} color={Colors.accent} />
                      <Text style={[styles.fileActionText, { color: Colors.accent }]}>Edit</Text>
                    </Pressable>
                  )}
                </View>
              </View>
              {isEditing ? (
                <TextInput
                  style={styles.codeEditor}
                  value={editingContent ?? ''}
                  onChangeText={setEditingContent}
                  multiline
                  autoCapitalize="none"
                  autoCorrect={false}
                  spellCheck={false}
                  textAlignVertical="top"
                  scrollEnabled
                />
              ) : (
                <ScrollView style={styles.codeScroll}>
                  <Text style={styles.codeText} selectable>{currentFile.content}</Text>
                </ScrollView>
              )}
            </View>
          ) : (
            <FlatList
              data={project.files || []}
              keyExtractor={(item) => item.filePath}
              contentContainerStyle={styles.fileList}
              renderItem={({ item }) => {
                const iconMap: Record<string, string> = {
                  html: 'code',
                  css: 'hash',
                  javascript: 'terminal',
                  json: 'file-text',
                };
                const icon = (iconMap[item.fileType] || 'file') as any;
                return (
                  <Pressable
                    onPress={() => setSelectedFile(item.filePath)}
                    style={({ pressed }) => [styles.fileRow, pressed && { backgroundColor: Colors.creamDark }]}
                  >
                    <Feather name={icon} size={16} color={Colors.accent} />
                    <View style={styles.fileInfo}>
                      <Text style={styles.fileName}>{item.filePath}</Text>
                      <Text style={styles.fileMeta}>
                        {item.fileType} · {Math.round(item.content.length / 1024 * 10) / 10}KB
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={16} color={Colors.warmGrayLight} />
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <View style={styles.center}>
                  <Text style={styles.nativePreviewText}>No files yet</Text>
                </View>
              }
            />
          )}
        </View>
      ) : (
        <View style={styles.filesContainer}>
          <FlatList
            data={versions || []}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.fileList}
            renderItem={({ item }) => {
              const date = new Date(item.createdAt);
              const timeStr = date.toLocaleString();
              return (
                <View style={styles.versionRow}>
                  <View style={styles.versionInfo}>
                    <View style={styles.versionHeader}>
                      <View style={styles.versionBadge}>
                        <Text style={styles.versionBadgeText}>v{item.versionNumber}</Text>
                      </View>
                      <Text style={styles.versionFiles}>{item.fileCount} files</Text>
                    </View>
                    {item.description && (
                      <Text style={styles.versionDesc} numberOfLines={1}>{item.description}</Text>
                    )}
                    <Text style={styles.versionDate}>{timeStr}</Text>
                  </View>
                  <Pressable
                    onPress={() => handleRestore(item.id, item.versionNumber)}
                    disabled={restoreMutation.isPending}
                    style={({ pressed }) => [styles.restoreBtn, pressed && { opacity: 0.7 }]}
                  >
                    {restoreMutation.isPending ? (
                      <ActivityIndicator size="small" color={Colors.accent} />
                    ) : (
                      <>
                        <Feather name="rotate-ccw" size={13} color={Colors.accent} />
                        <Text style={styles.restoreBtnText}>Restore</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={[styles.center, { paddingTop: 60 }]}>
                <Feather name="git-branch" size={28} color={Colors.warmGrayLight} />
                <Text style={styles.nativePreviewText}>No version history yet</Text>
                <Text style={[styles.fileMeta, { textAlign: 'center' as const, marginTop: 4 }]}>
                  Versions are created automatically when you edit files or update via chat
                </Text>
              </View>
            }
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
    gap: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
    color: Colors.white,
    letterSpacing: -0.2,
  },
  headerSpacer: { width: 36 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusLive: { backgroundColor: 'rgba(40,200,64,0.12)' },
  statusDraft: { backgroundColor: 'rgba(255,255,255,0.08)' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: {
    fontSize: 10,
    fontFamily: 'DMSans_700Bold',
    letterSpacing: 0.8,
  },
  actionsDropdown: {
    position: 'absolute' as const,
    top: Platform.OS === 'web' ? 105 : 90,
    right: 12,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
    zIndex: 100,
    ...Platform.select({
      web: { boxShadow: '0 4px 20px rgba(0,0,0,0.12)' },
      default: { elevation: 8 },
    }),
    overflow: 'hidden' as const,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  actionText: {
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
    color: Colors.blackSoft,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  tabs: {
    flexDirection: 'row',
    gap: 2,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: Colors.accentSubtle,
  },
  tabText: {
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    color: Colors.warmGray,
  },
  tabTextActive: {
    color: Colors.accent,
    fontFamily: 'DMSans_600SemiBold',
  },
  toolbarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deployBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  deployBtnActive: {
    backgroundColor: Colors.primary,
  },
  undeployBtn: {
    backgroundColor: 'rgba(184,59,59,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(184,59,59,0.2)',
  },
  deployBtnText: {
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
  },
  liveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 12,
    marginTop: 8,
    backgroundColor: 'rgba(40,200,64,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(40,200,64,0.15)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  liveBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.live,
  },
  liveBannerText: {
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    color: Colors.blackSoft,
    flex: 1,
  },
  previewContainer: {
    flex: 1,
    margin: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.divider,
    backgroundColor: '#ffffff',
  },
  nativePreviewText: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
  },
  filesContainer: {
    flex: 1,
  },
  fileList: {
    padding: 12,
    gap: 6,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.black,
  },
  fileMeta: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGrayLight,
    marginTop: 2,
  },
  fileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    paddingRight: 8,
  },
  fileBack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  fileBackText: {
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.accent,
  },
  fileActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fileActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  fileActionText: {
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
  },
  editBtn: {
    backgroundColor: Colors.accentSubtle,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
  },
  codeScroll: {
    flex: 1,
    backgroundColor: Colors.primaryDark,
    padding: 14,
  },
  codeEditor: {
    flex: 1,
    backgroundColor: Colors.codeBackground,
    padding: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    lineHeight: 20,
    color: Colors.codeText,
    textAlignVertical: 'top' as const,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    lineHeight: 18,
    color: Colors.codeText,
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  versionInfo: {
    flex: 1,
    gap: 4,
  },
  versionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  versionBadge: {
    backgroundColor: Colors.accentSubtle,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  versionBadgeText: {
    fontSize: 12,
    fontFamily: 'DMSans_700Bold',
    color: Colors.accent,
  },
  versionFiles: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
  },
  versionDesc: {
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
    color: Colors.blackSoft,
  },
  versionDate: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGrayLight,
  },
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.accentSubtle,
  },
  restoreBtnText: {
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.accent,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'DMSans_500Medium',
    color: Colors.warmGray,
  },
  errorBtn: {
    marginTop: 12,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  errorBtnText: {
    fontSize: 14,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.white,
  },
});
