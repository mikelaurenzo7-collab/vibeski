import React from 'react';
import { View, Text, Pressable, StyleSheet, GestureResponderEvent } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import type { Conversation } from '@/lib/chat-context';

interface ConversationItemProps {
  conversation: Conversation;
  onPress: () => void;
  onDelete: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function ConversationItem({ conversation, onPress, onDelete, isFirst, isLast }: ConversationItemProps) {
  const lastMessage = conversation.messages[conversation.messages.length - 1];
  const preview = lastMessage?.content.slice(0, 70) || 'No messages yet';
  const messageCount = conversation.messages.length;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        isFirst && styles.containerFirst,
        isLast && styles.containerLast,
        pressed && styles.pressed,
      ]}
      testID="conversation-item"
    >
      <View style={styles.accentLine} />
      <View style={styles.body}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>{conversation.title}</Text>
          <Text style={styles.time}>{formatTime(conversation.updatedAt)}</Text>
        </View>
        <Text style={styles.preview} numberOfLines={2}>
          {preview}
        </Text>
        <View style={styles.footer}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {messageCount} {messageCount === 1 ? 'message' : 'messages'}
            </Text>
          </View>
          <Pressable
            onPress={(e: GestureResponderEvent) => {
              e.stopPropagation();
              onDelete();
            }}
            hitSlop={12}
            style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.4 }]}
            testID="delete-conversation"
          >
            <Feather name="trash-2" size={14} color={Colors.warmGrayLight} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    marginBottom: 1,
    overflow: 'hidden',
  },
  containerFirst: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  containerLast: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    marginBottom: 0,
  },
  pressed: {
    backgroundColor: Colors.creamDark,
  },
  accentLine: {
    width: 3,
    backgroundColor: Colors.accent,
    borderRadius: 2,
    marginVertical: 14,
    marginLeft: 2,
  },
  body: {
    flex: 1,
    paddingVertical: 14,
    paddingLeft: 14,
    paddingRight: 18,
    gap: 6,
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
    marginRight: 12,
    letterSpacing: -0.2,
  },
  time: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGrayLight,
    letterSpacing: 0.1,
  },
  preview: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  badge: {
    backgroundColor: Colors.cream,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'DMSans_500Medium',
    color: Colors.warmGray,
    letterSpacing: 0.2,
  },
  deleteBtn: {
    padding: 6,
  },
});
