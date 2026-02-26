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
import { Ionicons, Feather } from '@expo/vector-icons';
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
    Alert.alert('Delete Chat', 'Are you sure you want to delete this conversation?', [
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

  const renderItem = ({ item }: { item: Conversation }) => (
    <ConversationItem
      conversation={item}
      onPress={() => handleOpenChat(item.id)}
      onDelete={() => handleDelete(item.id)}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Ionicons name="leaf-outline" size={48} color={Colors.accent} />
      </View>
      <Text style={styles.emptyTitle}>Plant your first seed</Text>
      <Text style={styles.emptyText}>
        Start a conversation and watch your ideas grow
      </Text>
    </View>
  );

  const sortedConversations = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <View style={[styles.screen, { paddingBottom: webBottomInset }]}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: (insets.top || webTopInset) + 12 }]}>
        <View style={styles.headerContent}>
          <View style={styles.logoRow}>
            <View style={styles.logoIcon}>
              <Ionicons name="leaf" size={20} color={Colors.accent} />
            </View>
            <Text style={styles.headerTitle}>Field of Dreams</Text>
          </View>
          <Pressable
            onPress={handleNewChat}
            style={({ pressed }) => [styles.newChatBtn, pressed && styles.newChatPressed]}
            testID="new-chat-button"
          >
            <Feather name="edit" size={20} color={Colors.white} />
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
        ]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        scrollEnabled={!!sortedConversations.length}
        showsVerticalScrollIndicator={false}
      />

      {conversations.length > 0 && (
        <Pressable
          onPress={handleNewChat}
          style={({ pressed }) => [
            styles.fab,
            { bottom: (insets.bottom || webBottomInset) + 20 },
            pressed && styles.fabPressed,
          ]}
          testID="fab-new-chat"
        >
          <Ionicons name="add" size={28} color={Colors.white} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(212, 168, 83, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'DMSans_700Bold',
    color: Colors.white,
  },
  newChatBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
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
  separator: {
    height: 1,
    backgroundColor: Colors.divider,
    marginLeft: 74,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'DMSans_700Bold',
    color: Colors.black,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    textAlign: 'center',
    lineHeight: 22,
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.95 }],
  },
});
