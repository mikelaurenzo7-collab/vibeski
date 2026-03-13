import React from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  Platform,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useSubscription } from '@/lib/subscription-context';

interface UpgradeModalProps {
  visible: boolean;
  onDismiss: () => void;
  reason: 'limit_reached' | 'agent_locked';
  agentName?: string;
}

export function UpgradeModal({ visible, onDismiss, reason, agentName }: UpgradeModalProps) {
  const { startCheckout } = useSubscription();

  const handleUpgrade = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onDismiss();
    router.push('/pricing');
  };

  const handleQuickUpgrade = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    const url = await startCheckout('pro');
    if (url) {
      onDismiss();
      await Linking.openURL(url);
    }
  };

  const title = reason === 'limit_reached'
    ? "You've hit your limit"
    : `${agentName || 'This agent'} is a Pro feature`;

  const description = reason === 'limit_reached'
    ? "You've used all your free generations for today. Upgrade to Pro for 100 daily generations, or go Elite for unlimited."
    : `${agentName || 'This agent'} is only available on Pro and Elite plans. Upgrade to unlock all 6 specialized agents.`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Pressable onPress={onDismiss} style={styles.closeBtn} hitSlop={12}>
            <Feather name="x" size={20} color={Colors.warmGray} />
          </Pressable>

          <View style={styles.iconContainer}>
            <Feather
              name={reason === 'limit_reached' ? 'zap' : 'lock'}
              size={28}
              color={Colors.accent}
            />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>

          <Pressable
            style={({ pressed }) => [styles.upgradeBtn, pressed && styles.upgradeBtnPressed]}
            onPress={handleQuickUpgrade}
          >
            <Text style={styles.upgradeBtnText}>Upgrade to Pro — $19/mo</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.viewPlansBtn, pressed && { opacity: 0.7 }]}
            onPress={handleUpgrade}
          >
            <Text style={styles.viewPlansText}>View all plans</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accentSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: 'DMSans_700Bold',
    color: Colors.black,
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  upgradeBtn: {
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  upgradeBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  upgradeBtnText: {
    fontSize: 15,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.primary,
  },
  viewPlansBtn: {
    paddingVertical: 12,
  },
  viewPlansText: {
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
    color: Colors.warmGray,
  },
});
