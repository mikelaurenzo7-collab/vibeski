import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import type { Conversation } from '@/lib/chat-context';

interface ConversationItemProps {
  conversation: Conversation;
  onPress: () => void;
  onDelete: () => void;
}

function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function ConversationItem({ conversation, onPress, onDelete }: ConversationItemProps) {
  const lastMessage = conversation.messages[conversation.messages.length - 1];
  const preview = lastMessage?.content.slice(0, 60) || 'No messages yet';
  const messageCount = conversation.messages.length;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      testID="conversation-item"
    >
      <View style={styles.iconContainer}>
        <Ionicons name="chatbubble-ellipses" size={20} color={Colors.accent} />
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>{conversation.title}</Text>
          <Text style={styles.time}>{formatTime(conversation.updatedAt)}</Text>
        </View>
        <Text style={styles.preview} numberOfLines={1}>
          {preview}
        </Text>
      </View>
      <Pressable
        onPress={onDelete}
        hitSlop={12}
        style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.5 }]}
        testID="delete-conversation"
      >
        <Ionicons name="trash-outline" size={18} color={Colors.warmGrayLight} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: Colors.white,
  },
  pressed: {
    backgroundColor: Colors.creamDark,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
    gap: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.black,
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGrayLight,
  },
  preview: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
  },
  deleteBtn: {
    padding: 8,
    marginLeft: 4,
  },
});
