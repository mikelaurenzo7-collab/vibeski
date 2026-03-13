import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import Colors from '@/constants/colors';
import { useSubscription } from '@/lib/subscription-context';
import { getTierConfig } from '../shared/subscription';

export default function BillingScreen() {
  const insets = useSafeAreaInsets();
  const { status, openBillingPortal, refreshStatus } = useSubscription();
  const tierConfig = getTierConfig(status.tier);
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  const usagePercent = status.dailyGenerationsLimit === -1
    ? 0
    : Math.min((status.dailyGenerationsUsed / status.dailyGenerationsLimit) * 100, 100);

  const usageLabel = status.dailyGenerationsLimit === -1
    ? `${status.dailyGenerationsUsed} used today`
    : `${status.dailyGenerationsUsed} / ${status.dailyGenerationsLimit} today`;

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const handleManageBilling = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const url = await openBillingPortal();
    if (url) {
      await Linking.openURL(url);
    }
  };

  const handleUpgrade = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/pricing');
  };

  const handleRefresh = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await refreshStatus();
  };

  const tierColors: Record<string, string> = {
    free: Colors.warmGray,
    pro: Colors.accent,
    elite: '#8B5CF6',
  };

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
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Billing & Usage</Text>
        </View>
        <Pressable
          onPress={handleRefresh}
          hitSlop={12}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
        >
          <Feather name="refresh-cw" size={18} color="rgba(255,255,255,0.7)" />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.planCard}>
          <View style={styles.planHeader}>
            <View style={[styles.tierBadge, { backgroundColor: tierColors[status.tier] }]}>
              <Text style={styles.tierBadgeText}>{tierConfig.name.toUpperCase()}</Text>
            </View>
            <Text style={styles.planPrice}>
              {tierConfig.priceLabel}
              {tierConfig.price > 0 && <Text style={styles.planPriceUnit}>/mo</Text>}
            </Text>
          </View>
          <View style={styles.planFeatures}>
            {tierConfig.features.map((feature, i) => (
              <View key={i} style={styles.planFeatureRow}>
                <Feather name="check" size={13} color={Colors.success} />
                <Text style={styles.planFeatureText}>{feature}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.usageCard}>
          <Text style={styles.sectionTitle}>Daily Usage</Text>
          <View style={styles.usageBar}>
            <View style={[
              styles.usageFill,
              {
                width: `${status.dailyGenerationsLimit === -1 ? 5 : usagePercent}%` as any,
                backgroundColor: usagePercent >= 90 ? Colors.error : Colors.accent,
              },
            ]} />
          </View>
          <Text style={styles.usageLabel}>{usageLabel}</Text>
          {status.dailyGenerationsLimit === -1 && (
            <Text style={styles.unlimitedText}>Unlimited generations</Text>
          )}
        </View>

        <View style={styles.actionsCard}>
          {status.tier === 'free' ? (
            <Pressable
              style={({ pressed }) => [styles.actionButton, styles.upgradeButton, pressed && styles.actionPressed]}
              onPress={handleUpgrade}
            >
              <Feather name="zap" size={18} color={Colors.primary} />
              <Text style={styles.upgradeButtonText}>Upgrade Plan</Text>
              <Feather name="chevron-right" size={18} color={Colors.primary} />
            </Pressable>
          ) : (
            <>
              <Pressable
                style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}
                onPress={handleManageBilling}
              >
                <Feather name="credit-card" size={18} color={Colors.blackSoft} />
                <Text style={styles.actionButtonText}>Manage Subscription</Text>
                <Feather name="external-link" size={16} color={Colors.warmGrayLight} />
              </Pressable>
              <View style={styles.actionDivider} />
              <Pressable
                style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}
                onPress={handleUpgrade}
              >
                <Feather name="arrow-up-circle" size={18} color={Colors.blackSoft} />
                <Text style={styles.actionButtonText}>Change Plan</Text>
                <Feather name="chevron-right" size={16} color={Colors.warmGrayLight} />
              </Pressable>
            </>
          )}
        </View>
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.white,
    letterSpacing: -0.1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  planCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tierBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tierBadgeText: {
    fontSize: 11,
    fontFamily: 'DMSans_700Bold',
    color: Colors.white,
    letterSpacing: 1,
  },
  planPrice: {
    fontSize: 28,
    fontFamily: 'DMSans_700Bold',
    color: Colors.black,
    letterSpacing: -0.5,
  },
  planPriceUnit: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
  },
  planFeatures: {
    gap: 8,
  },
  planFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planFeatureText: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.blackSoft,
    flex: 1,
  },
  usageCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.black,
    marginBottom: 12,
    letterSpacing: -0.1,
  },
  usageBar: {
    height: 8,
    backgroundColor: Colors.creamDark,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  usageFill: {
    height: '100%',
    borderRadius: 4,
    minWidth: 4,
  },
  usageLabel: {
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
    color: Colors.warmGray,
  },
  unlimitedText: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.success,
    marginTop: 4,
  },
  actionsCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  upgradeButton: {
    backgroundColor: Colors.accentSubtle,
  },
  actionPressed: {
    backgroundColor: Colors.creamDark,
  },
  actionButtonText: {
    fontSize: 15,
    fontFamily: 'DMSans_500Medium',
    color: Colors.blackSoft,
    flex: 1,
  },
  upgradeButtonText: {
    fontSize: 15,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.primary,
    flex: 1,
  },
  actionDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginHorizontal: 20,
  },
});
