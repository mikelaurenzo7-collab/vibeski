import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  Linking,
  Alert,
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

const COMPETITORS = [
  { name: 'Replit Agent', monthly: '$25–$100+', realCost: '$75–$250', agents: '1 general', note: 'Unpredictable overages' },
  { name: 'Bolt.new', monthly: '$20–$200', realCost: '$50–$300', agents: '1 general', note: 'Token burn surprises' },
  { name: 'Lovable', monthly: '$20–$100', realCost: '$40–$200', agents: '1 general', note: 'Limited free tier' },
  { name: 'Cursor AI', monthly: '$20–$40', realCost: '$40–$150', agents: '1 code-only', note: 'Desktop only' },
  { name: 'ChatGPT Pro', monthly: '$20–$200', realCost: '$20–$200', agents: 'GPT Store (user-made)', note: 'No app building' },
];

function PriceComparisonTable() {
  return (
    <View style={styles.compTable}>
      <View style={styles.compHeader}>
        <Feather name="bar-chart-2" size={16} color={Colors.accent} />
        <Text style={styles.compTitle}>Real Cost Comparison</Text>
      </View>
      <Text style={styles.compSubtitle}>What users actually pay monthly, based on real-world usage</Text>

      {COMPETITORS.map((comp, i) => (
        <View key={i} style={styles.compRow}>
          <View style={styles.compLeft}>
            <Text style={styles.compName}>{comp.name}</Text>
            <Text style={styles.compNote}>{comp.note}</Text>
          </View>
          <View style={styles.compRight}>
            <Text style={styles.compCost}>{comp.realCost}</Text>
            <Text style={styles.compAgents}>{comp.agents}</Text>
          </View>
        </View>
      ))}

      <View style={[styles.compRow, styles.compRowHighlight]}>
        <View style={styles.compLeft}>
          <Text style={[styles.compName, { color: Colors.accent }]}>Field of Dreams</Text>
          <Text style={[styles.compNote, { color: 'rgba(255,255,255,0.5)' }]}>No surprise bills. Ever.</Text>
        </View>
        <View style={styles.compRight}>
          <Text style={[styles.compCost, { color: Colors.accent }]}>$19–$49</Text>
          <Text style={[styles.compAgents, { color: 'rgba(255,255,255,0.6)' }]}>15 specialists</Text>
        </View>
      </View>
    </View>
  );
}

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
          <Text style={[styles.creditBadgeText, { color: Colors.premium }]}>3</Text>
        </View>
        <Text style={styles.creditAgents}>
          {premium.map(([name]) => displayName(name)).join(', ')}
        </Text>
      </View>
    </View>
  );
}

function BillingToggle({ isAnnual, onToggle }: { isAnnual: boolean; onToggle: () => void }) {
  return (
    <View style={styles.toggleContainer}>
      <Pressable
        onPress={() => { if (isAnnual) onToggle(); }}
        style={[styles.toggleOption, !isAnnual && styles.toggleOptionActive]}
      >
        <Text style={[styles.toggleText, !isAnnual && styles.toggleTextActive]}>Monthly</Text>
      </Pressable>
      <Pressable
        onPress={() => { if (!isAnnual) onToggle(); }}
        style={[styles.toggleOption, isAnnual && styles.toggleOptionActive]}
      >
        <Text style={[styles.toggleText, isAnnual && styles.toggleTextActive]}>Annual</Text>
        <View style={styles.saveBadge}>
          <Text style={styles.saveBadgeText}>SAVE 20%</Text>
        </View>
      </Pressable>
    </View>
  );
}

function TierCard({ tier, currentTier, onSelect, isLoading, isAnnual }: {
  tier: TierConfig;
  currentTier: string;
  onSelect: (tier: 'pro' | 'elite') => void;
  isLoading: boolean;
  isAnnual: boolean;
}) {
  const isCurrent = currentTier === tier.id;
  const isHighlighted = tier.highlight;
  const displayPrice = isAnnual && tier.price > 0 ? tier.annualMonthly : tier.priceLabel;
  const billingNote = isAnnual && tier.price > 0 ? `${tier.annualPriceLabel}/year` : tier.price > 0 ? 'billed monthly' : '';

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
          {displayPrice}
        </Text>
        {tier.price > 0 && (
          <Text style={[styles.priceUnit, isHighlighted && styles.priceUnitHighlighted]}>
            /month
          </Text>
        )}
      </View>
      {billingNote !== '' && (
        <Text style={[styles.billingNote, isHighlighted && { color: 'rgba(255,255,255,0.4)' }]}>
          {billingNote}
        </Text>
      )}

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
              Start {tier.name} — {displayPrice}/mo
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
  const [isAnnual, setIsAnnual] = useState(false);
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
      Alert.alert('Checkout Error', 'Unable to start checkout. Please try again.');
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
        <View style={styles.pledgeBox}>
          <Feather name="shield" size={18} color={Colors.accent} />
          <View style={{ flex: 1 }}>
            <Text style={styles.pledgeTitle}>No surprise bills. Ever.</Text>
            <Text style={styles.pledgeSub}>Transparent, credit-based pricing. You always know exactly what you&apos;ll pay.</Text>
          </View>
        </View>

        <BillingToggle isAnnual={isAnnual} onToggle={() => {
          if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setIsAnnual(!isAnnual);
        }} />

        {TIERS.map(tier => (
          <TierCard
            key={tier.id}
            tier={tier}
            currentTier={status.tier}
            onSelect={handleSelect}
            isLoading={loadingTier === tier.id}
            isAnnual={isAnnual}
          />
        ))}

        <PriceComparisonTable />

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
          Cancel anytime. Subscriptions billed through Stripe. Overage charges applied at end of billing cycle.{'\n'}Annual plans save 20% — billed as a single yearly payment.
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
  pledgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  pledgeTitle: {
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
    color: Colors.white,
    marginBottom: 2,
  },
  pledgeSub: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 18,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  toggleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  toggleOptionActive: {
    backgroundColor: Colors.primary,
  },
  toggleText: {
    fontSize: 14,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.warmGray,
  },
  toggleTextActive: {
    color: Colors.white,
  },
  saveBadge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  saveBadgeText: {
    fontSize: 9,
    fontFamily: 'DMSans_700Bold',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  billingNote: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGrayLight,
    marginTop: -4,
    marginBottom: 12,
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
  compTable: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  compHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  compTitle: {
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
    color: Colors.black,
    letterSpacing: -0.2,
  },
  compSubtitle: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    marginBottom: 16,
    lineHeight: 17,
  },
  compRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  compRowHighlight: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginTop: 8,
    borderBottomWidth: 0,
  },
  compLeft: {
    flex: 1,
  },
  compName: {
    fontSize: 14,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.black,
  },
  compNote: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGrayLight,
    marginTop: 1,
  },
  compRight: {
    alignItems: 'flex-end',
  },
  compCost: {
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
    color: Colors.error,
  },
  compAgents: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGrayLight,
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
    textAlign: 'center' as const,
    marginTop: 4,
    lineHeight: 18,
  },
});
