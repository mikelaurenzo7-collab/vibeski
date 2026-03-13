import React from 'react';
import { View, Text, Pressable, StyleSheet, GestureResponderEvent } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { getAgent } from '@/constants/agents';
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
  const agent = getAgent(conversation.agentId);

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
      <View style={[styles.agentIcon, { backgroundColor: agent.colorLight }]}>
        <Feather name={agent.icon} size={16} color={agent.color} />
      </View>
      <View style={styles.body}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>{conversation.title}</Text>
          <Text style={styles.time}>{formatTime(conversation.updatedAt)}</Text>
        </View>
        <Text style={styles.preview} numberOfLines={1}>
          {preview}
        </Text>
        <View style={styles.footer}>
          <View style={[styles.badge, { backgroundColor: agent.colorLight }]}>
            <Text style={[styles.badgeText, { color: agent.color }]}>{agent.name}</Text>
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
    alignItems: 'flex-start',
    backgroundColor: Colors.white,
    marginBottom: 1,
    overflow: 'hidden',
    paddingVertical: 14,
    paddingLeft: 16,
    paddingRight: 14,
    gap: 12,
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
  agentIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  body: {
    flex: 1,
    gap: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
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
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 19,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'DMSans_600SemiBold',
    letterSpacing: 0.2,
  },
  deleteBtn: {
    padding: 6,
  },
});
