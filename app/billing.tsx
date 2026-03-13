import React, { useEffect } from 'react';
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
import { useAuth } from '@/lib/auth-context';
import { getTierConfig } from '../shared/subscription';

export default function BillingScreen() {
  const insets = useSafeAreaInsets();
  const { status, openBillingPortal, refreshStatus } = useSubscription();
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const tierConfig = getTierConfig(status.tier);
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.replace('/auth');
    }
  }, [authLoading, isLoggedIn]);

  const isPaid = status.tier !== 'free';

  const dailyPercent = status.dailyGenerationsLimit === -1
    ? 0
    : Math.min((status.dailyGenerationsUsed / status.dailyGenerationsLimit) * 100, 100);

  const monthlyPercent = status.monthlyCreditsLimit > 0
    ? Math.min((status.monthlyCreditsUsed / status.monthlyCreditsLimit) * 100, 100)
    : 0;

  const dailyLabel = status.dailyGenerationsLimit === -1
    ? `${status.dailyGenerationsUsed} used today`
    : `${status.dailyGenerationsUsed} / ${status.dailyGenerationsLimit} today`;

  const monthlyLabel = status.monthlyCreditsLimit > 0
    ? `${status.monthlyCreditsUsed} / ${status.monthlyCreditsLimit} credits`
    : `${status.dailyGenerationsUsed} / 10 daily credits`;

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
    elite: Colors.premium,
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
          <Text style={styles.sectionTitle}>Credit Usage</Text>

          {isPaid ? (
            <>
              <Text style={styles.usageSubtitle}>Monthly Credits</Text>
              <View style={styles.usageBar}>
                <View style={[
                  styles.usageFill,
                  {
                    width: `${Math.max(monthlyPercent, 2)}%` as any,
                    backgroundColor: monthlyPercent >= 100 ? Colors.error : monthlyPercent >= 80 ? Colors.accent : Colors.success,
                  },
                ]} />
              </View>
              <Text style={styles.usageLabel}>{monthlyLabel}</Text>

              {status.billingCycleStart && status.billingCycleEnd && (
                <Text style={styles.cycleText}>
                  Cycle: {status.billingCycleStart} — {status.billingCycleEnd}
                </Text>
              )}
            </>
          ) : (
            <>
              <Text style={styles.usageSubtitle}>Daily Credits</Text>
              <View style={styles.usageBar}>
                <View style={[
                  styles.usageFill,
                  {
                    width: `${Math.max(dailyPercent, 2)}%` as any,
                    backgroundColor: dailyPercent >= 90 ? Colors.error : dailyPercent >= 70 ? Colors.accent : Colors.success,
                  },
                ]} />
              </View>
              <Text style={styles.usageLabel}>{dailyLabel}</Text>
              <Text style={styles.cycleText}>Resets daily at midnight UTC</Text>
            </>
          )}
        </View>

        {isPaid && (
          <View style={styles.overageCard}>
            <View style={styles.overageHeader}>
              <Feather name="trending-up" size={16} color={status.overageCredits > 0 ? Colors.accent : Colors.warmGrayLight} />
              <Text style={styles.sectionTitle}>Overage</Text>
            </View>
            {status.overageCredits > 0 ? (
              <>
                <View style={styles.overageStatRow}>
                  <View style={styles.overageStat}>
                    <Text style={styles.overageStatValue}>{status.overageCredits}</Text>
                    <Text style={styles.overageStatLabel}>Extra Credits</Text>
                  </View>
                  <View style={styles.overageStatDivider} />
                  <View style={styles.overageStat}>
                    <Text style={styles.overageStatValue}>${(status.overageCost / 100).toFixed(2)}</Text>
                    <Text style={styles.overageStatLabel}>Overage Cost</Text>
                  </View>
                  <View style={styles.overageStatDivider} />
                  <View style={styles.overageStat}>
                    <Text style={styles.overageStatValue}>${(status.overageRate / 100).toFixed(2)}</Text>
                    <Text style={styles.overageStatLabel}>Per Credit</Text>
                  </View>
                </View>
                <Text style={styles.overageNote}>
                  Overage charges are applied at the end of your billing cycle.
                </Text>
              </>
            ) : (
              <View style={styles.noOverageBox}>
                <Feather name="check-circle" size={14} color={Colors.success} />
                <Text style={styles.noOverageText}>No overage this cycle</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.actionsCard}>
          {status.tier === 'free' ? (
            <Pressable
              style={({ pressed }) => [styles.actionButton, styles.upgradeButton, pressed && styles.actionPressed]}
              onPress={handleUpgrade}
            >
              <Feather name="zap" size={18} color={Colors.primary} />
              <View style={styles.actionTextGroup}>
                <Text style={styles.upgradeButtonText}>Upgrade Plan</Text>
                <Text style={styles.actionSubtext}>Get 500+ credits/month</Text>
              </View>
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
  usageSubtitle: {
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    color: Colors.warmGray,
    marginBottom: 8,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  usageBar: {
    height: 10,
    backgroundColor: Colors.creamDark,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  usageFill: {
    height: '100%',
    borderRadius: 5,
    minWidth: 4,
  },
  usageLabel: {
    fontSize: 14,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.black,
  },
  cycleText: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGrayLight,
    marginTop: 4,
  },
  overageCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  overageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  overageStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  overageStat: {
    flex: 1,
    alignItems: 'center',
  },
  overageStatValue: {
    fontSize: 20,
    fontFamily: 'DMSans_700Bold',
    color: Colors.black,
    letterSpacing: -0.3,
  },
  overageStatLabel: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGrayLight,
    marginTop: 2,
  },
  overageStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.divider,
  },
  overageNote: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGrayLight,
    marginTop: 12,
    textAlign: 'center',
    fontStyle: 'italic' as const,
  },
  noOverageBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(47,107,71,0.06)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  noOverageText: {
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
    color: Colors.success,
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
  actionTextGroup: {
    flex: 1,
  },
  upgradeButtonText: {
    fontSize: 15,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.primary,
  },
  actionSubtext: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    marginTop: 1,
  },
  actionDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginHorizontal: 20,
  },
});
