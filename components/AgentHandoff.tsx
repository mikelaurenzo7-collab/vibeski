import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import { getAgent } from '@/constants/agents';
import type { AgentHandoff as AgentHandoffType } from '@/constants/agents';
import { useChat } from '@/lib/chat-context';

interface AgentHandoffProps {
  agentId: string;
  lastMessage: string;
}

export function AgentHandoff({ agentId, lastMessage }: AgentHandoffProps) {
  const currentAgent = getAgent(agentId);
  const { createConversation } = useChat();
  const handoffs = currentAgent.handoffs;

  if (!handoffs || handoffs.length === 0) return null;

  const handleHandoff = async (handoff: AgentHandoffType) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    try {
      const summary = lastMessage.length > 200 ? lastMessage.substring(0, 200) + '...' : lastMessage;
      const convo = await createConversation(handoff.agentId);
      router.push({
        pathname: '/chat/[id]',
        params: { id: convo.id, initialPrompt: summary },
      });
    } catch (e) {
      console.error('Failed to create handoff conversation:', e);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Continue with</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {handoffs.map((handoff) => {
          const targetAgent = getAgent(handoff.agentId);
          return (
            <Pressable
              key={handoff.agentId}
              onPress={() => handleHandoff(handoff)}
              style={({ pressed }) => [
                styles.chip,
                pressed && styles.chipPressed,
              ]}
            >
              <View style={[styles.iconContainer, { backgroundColor: targetAgent.colorLight }]}>
                <Feather name={targetAgent.icon} size={14} color={targetAgent.color} />
              </View>
              <View style={styles.chipText}>
                <Text style={styles.chipLabel} numberOfLines={1}>{handoff.label}</Text>
                <Text style={styles.chipDesc} numberOfLines={1}>{handoff.description}</Text>
              </View>
              <Feather name="arrow-right" size={12} color={Colors.warmGrayLight} />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingLeft: 16,
  },
  title: {
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    color: Colors.warmGray,
    letterSpacing: 0.2,
    marginBottom: 8,
    textTransform: 'uppercase' as const,
  },
  scrollContent: {
    gap: 10,
    paddingRight: 16,
  },
  chip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.divider,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    minWidth: 180,
    maxWidth: 240,
    ...Platform.select({
      web: {
        boxShadow: '0px 1px 3px rgba(22, 46, 35, 0.06)',
      },
      default: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
        elevation: 1,
      },
    }),
  },
  chipPressed: {
    backgroundColor: Colors.creamDark,
    transform: [{ scale: 0.97 }],
  },
  iconContainer: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  chipText: {
    flex: 1,
    gap: 1,
  },
  chipLabel: {
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.black,
    letterSpacing: -0.1,
  },
  chipDesc: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
  },
});
