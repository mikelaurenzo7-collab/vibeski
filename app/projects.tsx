import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Platform,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import Colors from '@/constants/colors';
import { getAgent } from '@/constants/agents';
import { useChat, type Conversation } from '@/lib/chat-context';
import { useAuth } from '@/lib/auth-context';

export default function ProjectsScreen() {
  const insets = useSafeAreaInsets();
  const { conversations, deleteConversation, updateConversation, duplicateConversation } = useChat();
  const { isLoggedIn } = useAuth();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [menuId, setMenuId] = useState<string | null>(null);

  const sortedConversations = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const handleOpenChat = (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push({ pathname: '/chat/[id]', params: { id } });
  };

  const handleDelete = (id: string) => {
    setMenuId(null);
    if (Platform.OS === 'web') {
      deleteConversation(id);
      return;
    }
    Alert.alert('Delete Project', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          deleteConversation(id);
        },
      },
    ]);
  };

  const handleRename = (id: string, currentTitle: string) => {
    setMenuId(null);
    setRenameId(id);
    setRenameTitle(currentTitle);
  };

  const handleRenameSubmit = () => {
    if (renameId && renameTitle.trim()) {
      updateConversation(renameId, { title: renameTitle.trim() });
    }
    setRenameId(null);
    setRenameTitle('');
  };

  const handleDuplicate = async (id: string) => {
    setMenuId(null);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await duplicateConversation(id);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
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

  const renderProject = ({ item }: { item: Conversation }) => {
    const agent = getAgent(item.agentId);
    const lastMsg = item.messages.length > 0
      ? item.messages[item.messages.length - 1].content.slice(0, 80)
      : 'No messages yet';

    return (
      <Pressable
        onPress={() => handleOpenChat(item.id)}
        onLongPress={() => setMenuId(item.id)}
        style={({ pressed }) => [styles.projectCard, pressed && styles.projectCardPressed]}
      >
        <View style={styles.projectTop}>
          <View style={[styles.agentBadge, { backgroundColor: agent.colorLight }]}>
            <Feather name={agent.icon} size={14} color={agent.color} />
          </View>
          <View style={styles.projectInfo}>
            <Text style={styles.projectTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.projectAgent}>{agent.name}</Text>
          </View>
          <Pressable
            onPress={() => setMenuId(menuId === item.id ? null : item.id)}
            hitSlop={8}
            style={styles.moreBtn}
          >
            <Feather name="more-horizontal" size={18} color={Colors.warmGray} />
          </Pressable>
        </View>

        <Text style={styles.projectSnippet} numberOfLines={2}>{lastMsg}</Text>

        <View style={styles.projectBottom}>
          <Text style={styles.projectDate}>{formatDate(item.updatedAt)}</Text>
          <Text style={styles.projectMsgCount}>
            {item.messages.length} message{item.messages.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {menuId === item.id && (
          <View style={styles.actionMenu}>
            <Pressable
              onPress={() => handleRename(item.id, item.title)}
              style={styles.actionItem}
            >
              <Feather name="edit-2" size={14} color={Colors.black} />
              <Text style={styles.actionText}>Rename</Text>
            </Pressable>
            <Pressable
              onPress={() => handleDuplicate(item.id)}
              style={styles.actionItem}
            >
              <Feather name="copy" size={14} color={Colors.black} />
              <Text style={styles.actionText}>Duplicate</Text>
            </Pressable>
            <View style={styles.actionDivider} />
            <Pressable
              onPress={() => handleDelete(item.id)}
              style={styles.actionItem}
            >
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
        <Feather name="folder" size={32} color={Colors.warmGrayLight} />
      </View>
      <Text style={styles.emptyTitle}>No projects yet</Text>
      <Text style={styles.emptySubtitle}>
        {isLoggedIn
          ? 'Start a conversation with an agent to create your first project'
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
        <Pressable
          onPress={handleBack}
          hitSlop={12}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
        >
          <Feather name="chevron-left" size={22} color="rgba(255,255,255,0.7)" />
        </Pressable>
        <Text style={styles.headerTitle}>My Projects</Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={sortedConversations}
        keyExtractor={(item) => item.id}
        renderItem={renderProject}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          sortedConversations.length === 0 && styles.listEmpty,
        ]}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={!!renameId}
        transparent
        animationType="fade"
        onRequestClose={() => setRenameId(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setRenameId(null)}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <Text style={styles.modalTitle}>Rename Project</Text>
            <TextInput
              style={styles.modalInput}
              value={renameTitle}
              onChangeText={setRenameTitle}
              autoFocus
              placeholder="Project name"
              placeholderTextColor={Colors.warmGrayLight}
              onSubmitEditing={handleRenameSubmit}
            />
            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => setRenameId(null)}
                style={[styles.modalBtn, styles.modalBtnCancel]}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleRenameSubmit}
                style={[styles.modalBtn, styles.modalBtnSave]}
              >
                <Text style={styles.modalBtnSaveText}>Save</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  headerSpacer: {
    width: 36,
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
    marginBottom: 10,
  },
  agentBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
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
  projectAgent: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    marginTop: 1,
  },
  moreBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectSnippet: {
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
  projectMsgCount: {
    fontSize: 12,
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
    minWidth: 150,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: 'DMSans_700Bold',
    color: Colors.black,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: Colors.inputBg,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    color: Colors.black,
    borderWidth: 1,
    borderColor: Colors.divider,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalBtnCancel: {
    backgroundColor: Colors.inputBg,
  },
  modalBtnCancelText: {
    fontSize: 14,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.warmGray,
  },
  modalBtnSave: {
    backgroundColor: Colors.primary,
  },
  modalBtnSaveText: {
    fontSize: 14,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.white,
  },
});
