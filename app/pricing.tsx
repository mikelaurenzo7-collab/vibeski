import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import Colors from '@/constants/colors';
import { useSubscription } from '@/lib/subscription-context';
import { TIERS, CREDIT_COSTS, type TierConfig } from '../shared/subscription';

const AGENT_DISPLAY_NAMES: Record<string, string> = {
  builder: 'Builder',
  writer: 'Writer',
  strategist: 'Strategist',
  coder: 'Code',
  designer: 'Designer',
  analyst: 'Analyst',
  branding: 'Branding',
  'design-thinker': 'Thinker',
  seo: 'SEO Pro',
  'programmatic-seo': 'Page Gen',
  'content-machine': 'Content',
  'file-converter': 'Converter',
  'github-finder': 'GitHub',
  'seo-optimizer': 'Optimizer',
  'website-cloner': 'Cloner',
};

function CreditCostTable() {
  const entries = Object.entries(CREDIT_COSTS);
  const basic = entries.filter(([, c]) => c === 1);
  const standard = entries.filter(([, c]) => c === 2);
  const premium = entries.filter(([, c]) => c === 3);

  const displayName = (id: string) => AGENT_DISPLAY_NAMES[id] || id;

  return (
    <View style={styles.creditTable}>
      <Text style={styles.creditTableTitle}>Credit Costs by Agent</Text>
      <View style={styles.creditRow}>
        <View style={[styles.creditBadge, { backgroundColor: 'rgba(47,107,71,0.1)' }]}>
          <Text style={[styles.creditBadgeText, { color: Colors.success }]}>1</Text>
        </View>
        <Text style={styles.creditAgents}>
          {basic.map(([name]) => displayName(name)).join(', ')}
        </Text>
      </View>
      <View style={styles.creditRow}>
        <View style={[styles.creditBadge, { backgroundColor: 'rgba(201,162,78,0.1)' }]}>
          <Text style={[styles.creditBadgeText, { color: Colors.accent }]}>2</Text>
        </View>
        <Text style={styles.creditAgents}>
          {standard.map(([name]) => displayName(name)).join(', ')}
        </Text>
      </View>
      <View style={styles.creditRow}>
        <View style={[styles.creditBadge, { backgroundColor: 'rgba(139,92,246,0.1)' }]}>
          <Text style={[styles.creditBadgeText, { color: '#8B5CF6' }]}>3</Text>
        </View>
        <Text style={styles.creditAgents}>
          {premium.map(([name]) => displayName(name)).join(', ')}
        </Text>
      </View>
    </View>
  );
}

function TierCard({ tier, currentTier, onSelect, isLoading }: {
  tier: TierConfig;
  currentTier: string;
  onSelect: (tier: 'pro' | 'elite') => void;
  isLoading: boolean;
}) {
  const isCurrent = currentTier === tier.id;
  const isHighlighted = tier.highlight;

  return (
    <View style={[
      styles.card,
      isHighlighted && styles.cardHighlighted,
      isCurrent && styles.cardCurrent,
    ]}>
      {isHighlighted && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularText}>MOST POPULAR</Text>
        </View>
      )}
      <Text style={[styles.tierName, isHighlighted && styles.tierNameHighlighted]}>
        {tier.name}
      </Text>
      <View style={styles.priceRow}>
        <Text style={[styles.price, isHighlighted && styles.priceHighlighted]}>
          {tier.priceLabel}
        </Text>
        {tier.price > 0 && (
          <Text style={[styles.priceUnit, isHighlighted && styles.priceUnitHighlighted]}>
            /month
          </Text>
        )}
      </View>

      <View style={[styles.creditsBadge, isHighlighted && styles.creditsBadgeHighlighted]}>
        <Feather name="zap" size={14} color={Colors.accent} />
        <Text style={styles.creditsBadgeText}>
          {tier.id === 'free' ? '10 credits / day' :
           tier.id === 'pro' ? '500 credits / month' : '2,000 credits / month'}
        </Text>
      </View>

      <View style={styles.featuresList}>
        {tier.features.map((feature, i) => (
          <View key={i} style={styles.featureRow}>
            <Feather
              name="check"
              size={14}
              color={isHighlighted ? Colors.accent : Colors.success}
            />
            <Text style={[styles.featureText, isHighlighted && styles.featureTextHighlighted]}>
              {feature}
            </Text>
          </View>
        ))}
      </View>

      {tier.limits.overageRate > 0 && (
        <View style={[styles.overageBox, isHighlighted && styles.overageBoxHighlighted]}>
          <Feather name="info" size={12} color={isHighlighted ? 'rgba(255,255,255,0.4)' : Colors.warmGrayLight} />
          <Text style={[styles.overageText, isHighlighted && styles.overageTextHighlighted]}>
            ${(tier.limits.overageRate / 100).toFixed(2)}/credit overage — never locked out
          </Text>
        </View>
      )}

      {tier.id === 'free' && (
        <View style={styles.overageBox}>
          <Feather name="info" size={12} color={Colors.warmGrayLight} />
          <Text style={styles.overageText}>No overages — resets daily at midnight UTC</Text>
        </View>
      )}

      {isCurrent ? (
        <View style={[styles.button, styles.buttonCurrent]}>
          <Text style={styles.buttonCurrentText}>Current Plan</Text>
        </View>
      ) : tier.id === 'free' ? (
        <View style={[styles.button, styles.buttonFree]}>
          <Text style={styles.buttonFreeText}>Free Forever</Text>
        </View>
      ) : (
        <Pressable
          style={({ pressed }) => [
            styles.button,
            isHighlighted ? styles.buttonHighlighted : styles.buttonDefault,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => onSelect(tier.id as 'pro' | 'elite')}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={isHighlighted ? Colors.primary : Colors.white} size="small" />
          ) : (
            <Text style={[
              styles.buttonText,
              isHighlighted ? styles.buttonTextHighlighted : styles.buttonTextDefault,
            ]}>
              Start {tier.name} — {tier.priceLabel}/mo
            </Text>
          )}
        </Pressable>
      )}
    </View>
  );
}

export default function PricingScreen() {
  const insets = useSafeAreaInsets();
  const { status, startCheckout } = useSubscription();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  const handleSelect = async (tier: 'pro' | 'elite') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setLoadingTier(tier);
    try {
      const url = await startCheckout(tier);
      if (url) {
        await Linking.openURL(url);
      }
    } catch (e) {
      console.error('Checkout error:', e);
    } finally {
      setLoadingTier(null);
    }
  };

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
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
          <Text style={styles.headerTitle}>Choose Your Plan</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          Transparent, credit-based pricing. Start free. Scale as you grow.
        </Text>

        {TIERS.map(tier => (
          <TierCard
            key={tier.id}
            tier={tier}
            currentTier={status.tier}
            onSelect={handleSelect}
            isLoading={loadingTier === tier.id}
          />
        ))}

        <CreditCostTable />

        <View style={styles.guaranteeBox}>
          <Feather name="shield" size={16} color={Colors.success} />
          <View style={styles.guaranteeContent}>
            <Text style={styles.guaranteeTitle}>Never locked out</Text>
            <Text style={styles.guaranteeDesc}>
              Pro and Elite users can always keep working. Credits beyond your plan are billed at low overage rates — no surprises.
            </Text>
          </View>
        </View>

        <Text style={styles.disclaimer}>
          Cancel anytime. Subscriptions billed monthly through Stripe. Overage charges applied at end of billing cycle.
        </Text>
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
  headerSpacer: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  cardHighlighted: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryLight,
  },
  cardCurrent: {
    borderColor: Colors.accent,
    borderWidth: 2,
  },
  popularBadge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  popularText: {
    fontSize: 10,
    fontFamily: 'DMSans_700Bold',
    color: Colors.primary,
    letterSpacing: 1,
  },
  tierName: {
    fontSize: 22,
    fontFamily: 'DMSans_700Bold',
    color: Colors.black,
    letterSpacing: -0.3,
  },
  tierNameHighlighted: {
    color: Colors.white,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
    marginBottom: 12,
  },
  price: {
    fontSize: 40,
    fontFamily: 'DMSans_700Bold',
    color: Colors.black,
    letterSpacing: -1,
  },
  priceHighlighted: {
    color: Colors.white,
  },
  priceUnit: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    marginLeft: 4,
  },
  priceUnitHighlighted: {
    color: 'rgba(255,255,255,0.5)',
  },
  creditsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(201, 162, 78, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 78, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  creditsBadgeHighlighted: {
    backgroundColor: 'rgba(201, 162, 78, 0.12)',
    borderColor: 'rgba(201, 162, 78, 0.2)',
  },
  creditsBadgeText: {
    fontSize: 14,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.accent,
  },
  featuresList: {
    gap: 10,
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.blackSoft,
    flex: 1,
  },
  featureTextHighlighted: {
    color: 'rgba(255,255,255,0.85)',
  },
  overageBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingVertical: 4,
  },
  overageBoxHighlighted: {},
  overageText: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGrayLight,
    fontStyle: 'italic' as const,
    flex: 1,
  },
  overageTextHighlighted: {
    color: 'rgba(255,255,255,0.4)',
  },
  button: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonHighlighted: {
    backgroundColor: Colors.accent,
  },
  buttonDefault: {
    backgroundColor: Colors.primary,
  },
  buttonCurrent: {
    backgroundColor: Colors.accentSubtle,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  buttonFree: {
    backgroundColor: Colors.overlay,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    fontSize: 15,
    fontFamily: 'DMSans_600SemiBold',
    letterSpacing: -0.1,
  },
  buttonTextHighlighted: {
    color: Colors.primary,
  },
  buttonTextDefault: {
    color: Colors.white,
  },
  buttonCurrentText: {
    fontSize: 14,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.accent,
  },
  buttonFreeText: {
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
    color: Colors.warmGray,
  },
  creditTable: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  creditTableTitle: {
    fontSize: 15,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.black,
    marginBottom: 14,
    letterSpacing: -0.1,
  },
  creditRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  creditBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creditBadgeText: {
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
  },
  creditAgents: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    flex: 1,
    lineHeight: 20,
    marginTop: 3,
  },
  guaranteeBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(47, 107, 71, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(47, 107, 71, 0.12)',
    borderRadius: 14,
    padding: 16,
    gap: 12,
    marginBottom: 16,
  },
  guaranteeContent: {
    flex: 1,
  },
  guaranteeTitle: {
    fontSize: 14,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.success,
    marginBottom: 2,
  },
  guaranteeDesc: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 19,
  },
  disclaimer: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGrayLight,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
});
