import React from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
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
import { AGENTS } from '@/constants/agents';
import { useChat, type Conversation } from '@/lib/chat-context';
import { ConversationItem } from '@/components/ConversationItem';
import { AgentCard } from '@/components/AgentCard';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { conversations, createConversation, deleteConversation } = useChat();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  const handleNewChat = (agentId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const convo = createConversation(agentId);
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

  const sortedConversations = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);

  const renderConversation = ({ item, index }: { item: Conversation; index: number }) => (
    <ConversationItem
      conversation={item}
      onPress={() => handleOpenChat(item.id)}
      onDelete={() => handleDelete(item.id)}
      isFirst={index === 0}
      isLast={index === sortedConversations.length - 1}
    />
  );

  return (
    <View style={[styles.screen, { paddingBottom: webBottomInset }]}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: (insets.top || webTopInset) + 16 }]}>
        <Text style={styles.headerLabel}>FIELD OF DREAMS</Text>
        <Text style={styles.headerSubtitle}>
          {sortedConversations.length > 0
            ? `${sortedConversations.length} conversation${sortedConversations.length !== 1 ? 's' : ''}`
            : 'AI Agents'}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Agents</Text>
          <Text style={styles.sectionSub}>{AGENTS.length} specialists</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.agentsRow}
        >
          {AGENTS.map(agent => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onPress={() => handleNewChat(agent.id)}
            />
          ))}
        </ScrollView>

        {sortedConversations.length > 0 && (
          <View style={styles.conversationsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent</Text>
              <Text style={styles.sectionSub}>{sortedConversations.length}</Text>
            </View>
            <View style={styles.conversationsList}>
              {sortedConversations.map((item, index) => (
                <ConversationItem
                  key={item.id}
                  conversation={item}
                  onPress={() => handleOpenChat(item.id)}
                  onDelete={() => handleDelete(item.id)}
                  isFirst={index === 0}
                  isLast={index === sortedConversations.length - 1}
                />
              ))}
            </View>
          </View>
        )}

        {sortedConversations.length === 0 && (
          <View style={styles.emptyHint}>
            <Feather name="arrow-up" size={14} color={Colors.warmGrayLight} />
            <Text style={styles.emptyHintText}>
              Pick an agent to start a conversation
            </Text>
          </View>
        )}
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'DMSans_700Bold',
    color: Colors.black,
    letterSpacing: -0.2,
  },
  sectionSub: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGrayLight,
  },
  agentsRow: {
    paddingHorizontal: 16,
    gap: 10,
  },
  conversationsSection: {
    marginTop: 4,
  },
  conversationsList: {
    marginHorizontal: 16,
  },
  emptyHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 40,
  },
  emptyHintText: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGrayLight,
  },
});
