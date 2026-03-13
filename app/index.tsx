import React from 'react';
import {
  View,
  Text,
  FlatList,
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
import { useChat, type Conversation } from '@/lib/chat-context';
import { ConversationItem } from '@/components/ConversationItem';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { conversations, createConversation, deleteConversation, isLoading } = useChat();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  const handleNewChat = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const convo = createConversation();
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

  const renderItem = ({ item, index }: { item: Conversation; index: number }) => (
    <ConversationItem
      conversation={item}
      onPress={() => handleOpenChat(item.id)}
      onDelete={() => handleDelete(item.id)}
      isFirst={index === 0}
      isLast={index === sortedConversations.length - 1}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconRing}>
        <View style={styles.emptyIconInner}>
          <Feather name="message-circle" size={28} color={Colors.accent} />
        </View>
      </View>
      <Text style={styles.emptyTitle}>Start a conversation</Text>
      <Text style={styles.emptyText}>
        Your conversations will appear here
      </Text>
      <Pressable
        onPress={handleNewChat}
        style={({ pressed }) => [styles.emptyButton, pressed && styles.emptyButtonPressed]}
      >
        <Text style={styles.emptyButtonText}>New Conversation</Text>
        <Feather name="arrow-right" size={16} color={Colors.white} />
      </Pressable>
    </View>
  );

  const sortedConversations = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <View style={[styles.screen, { paddingBottom: webBottomInset }]}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: (insets.top || webTopInset) + 16 }]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerLabel}>Field of Dreams</Text>
            <Text style={styles.headerSubtitle}>
              {sortedConversations.length > 0
                ? `${sortedConversations.length} conversation${sortedConversations.length !== 1 ? 's' : ''}`
                : 'AI Assistant'}
            </Text>
          </View>
          <Pressable
            onPress={handleNewChat}
            style={({ pressed }) => [styles.newChatBtn, pressed && styles.newChatPressed]}
            testID="new-chat-button"
          >
            <Feather name="plus" size={20} color={Colors.white} />
          </Pressable>
        </View>
      </View>

      <FlatList
        data={sortedConversations}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          sortedConversations.length === 0 && styles.listEmpty,
          sortedConversations.length > 0 && styles.listPadded,
        ]}
        scrollEnabled={!!sortedConversations.length}
        showsVerticalScrollIndicator={false}
      />

      {conversations.length > 0 && (
        <Pressable
          onPress={handleNewChat}
          style={({ pressed }) => [
            styles.fab,
            { bottom: (insets.bottom || webBottomInset) + 24 },
            pressed && styles.fabPressed,
          ]}
          testID="fab-new-chat"
        >
          <Feather name="plus" size={22} color={Colors.white} />
        </Pressable>
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
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  newChatBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newChatPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  listContent: {
    flexGrow: 1,
  },
  listEmpty: {
    justifyContent: 'center',
  },
  listPadded: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 48,
    gap: 12,
  },
  emptyIconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: Colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyIconInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accentSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.black,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    marginTop: 8,
  },
  emptyButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  emptyButtonText: {
    fontSize: 15,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.white,
    letterSpacing: 0.1,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  fabPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.93 }],
  },
});
