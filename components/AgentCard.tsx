import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import type { Agent } from '@/constants/agents';

interface AgentCardProps {
  agent: Agent;
  onPress: () => void;
}

export function AgentCard({ agent, onPress }: AgentCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      testID={`agent-${agent.id}`}
    >
      <View style={[styles.iconWrap, { backgroundColor: agent.colorLight }]}>
        <Feather name={agent.icon} size={18} color={agent.color} />
      </View>
      <Text style={styles.name} numberOfLines={1}>{agent.name}</Text>
      <Text style={styles.tagline} numberOfLines={2}>{agent.tagline}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 110,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.divider,
    gap: 6,
  },
  cardPressed: {
    backgroundColor: Colors.creamDark,
    transform: [{ scale: 0.97 }],
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  name: {
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
    color: Colors.black,
    letterSpacing: -0.1,
  },
  tagline: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 15,
  },
});
