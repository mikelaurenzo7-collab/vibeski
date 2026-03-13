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
import { TIERS, type TierConfig } from '../shared/subscription';

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
              Upgrade to {tier.name}
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
          Unlock the full power of Field of Dreams
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

        <Text style={styles.disclaimer}>
          Cancel anytime. Subscriptions are billed monthly through Stripe.
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
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
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
    fontSize: 20,
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
    marginBottom: 16,
  },
  price: {
    fontSize: 36,
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
  featuresList: {
    gap: 10,
    marginBottom: 20,
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
  button: {
    paddingVertical: 14,
    borderRadius: 12,
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
  disclaimer: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGrayLight,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
});
