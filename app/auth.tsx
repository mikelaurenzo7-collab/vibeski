import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAuth } from '@/lib/auth-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ONBOARDING_SLIDES = [
  {
    icon: '🌾',
    title: '15 AI Agents',
    subtitle: 'Builder, Writer, Designer, SEO Pro, Branding, and 10 more specialists — all in one app.',
  },
  {
    icon: '⚡',
    title: 'Streaming AI',
    subtitle: 'Real-time responses with dual-model fallback. Watch your projects come alive instantly.',
  },
  {
    icon: '🎫',
    title: 'Credits System',
    subtitle: 'Start with 10 free credits daily. Upgrade for 500+ monthly credits with affordable overages.',
  },
];

function OnboardingDots({ activeIndex }: { activeIndex: number }) {
  return (
    <View style={styles.dotsRow}>
      {ONBOARDING_SLIDES.map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === activeIndex && styles.dotActive,
          ]}
        />
      ))}
    </View>
  );
}

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { login, signup } = useAuth();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  const [step, setStep] = useState<'onboarding' | 'auth'>('onboarding');
  const [slideIndex, setSlideIndex] = useState(0);
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const animateSlideTransition = useCallback((toIndex: number) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setSlideIndex(toIndex);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  }, [fadeAnim]);

  const handleNext = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (slideIndex < ONBOARDING_SLIDES.length - 1) {
      animateSlideTransition(slideIndex + 1);
    } else {
      setStep('auth');
    }
  };

  const handleSubmit = async () => {
    if (loading) return;
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (!isLogin && password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setLoading(true);
    try {
      if (isLogin) {
        await login(username.trim(), password);
      } else {
        await signup(username.trim(), password, email.trim() || undefined);
      }
      router.replace('/');
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.replace('/');
  };

  if (step === 'onboarding') {
    const slide = ONBOARDING_SLIDES[slideIndex];
    return (
      <View style={[styles.screen, styles.onboardingScreen]}>
        <StatusBar style="light" />
        <View style={[styles.onboardingTop, { paddingTop: (insets.top || webTopInset) + 20 }]}>
          <Pressable onPress={handleSkip} style={styles.skipOnboarding} hitSlop={16}>
            <Text style={styles.skipOnboardingText}>Skip</Text>
          </Pressable>

          <Animated.View style={[styles.slideContent, { opacity: fadeAnim }]}>
            <Text style={styles.slideIcon}>{slide.icon}</Text>
            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.slideSub}>{slide.subtitle}</Text>
          </Animated.View>

          <OnboardingDots activeIndex={slideIndex} />
        </View>

        <View style={[styles.onboardingBottom, { paddingBottom: (insets.bottom || webBottomInset) + 20 }]}>
          <Pressable
            onPress={handleNext}
            style={({ pressed }) => [styles.onboardingBtn, pressed && styles.onboardingBtnPressed]}
          >
            <Text style={styles.onboardingBtnText}>
              {slideIndex === ONBOARDING_SLIDES.length - 1 ? 'Get Started' : 'Next'}
            </Text>
            <Feather name="arrow-right" size={18} color={Colors.primary} />
          </Pressable>

          <Pressable
            onPress={() => setStep('auth')}
            style={styles.alreadyHaveBtn}
          >
            <Text style={styles.alreadyHaveText}>Already have an account? <Text style={styles.alreadyHaveBold}>Sign In</Text></Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: (insets.top || webTopInset) + 12 }]}>
        <Pressable
          onPress={() => setStep('onboarding')}
          hitSlop={12}
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.6 }]}
        >
          <Feather name="chevron-left" size={22} color="rgba(255,255,255,0.7)" />
        </Pressable>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerBrand}>🌾 FIELD OF DREAMS</Text>
          <Text style={styles.headerSubtitle}>
            {isLogin ? 'Welcome back' : 'Create your account'}
          </Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, { paddingBottom: (insets.bottom || webBottomInset) + 24 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.form}>
            {!isLogin && (
              <View style={styles.promoBox}>
                <Feather name="gift" size={14} color={Colors.accent} />
                <Text style={styles.promoText}>Get 10 free credits daily — no card required</Text>
              </View>
            )}

            {!!error && (
              <View style={styles.errorBox}>
                <Feather name="alert-circle" size={14} color={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <View style={styles.inputWrapper}>
                <Feather name="user" size={16} color={Colors.warmGrayLight} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="Enter username"
                  placeholderTextColor={Colors.warmGrayLight}
                  testID="username-input"
                />
              </View>
            </View>

            {!isLogin && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email <Text style={styles.labelOptional}>(optional)</Text></Text>
                <View style={styles.inputWrapper}>
                  <Feather name="mail" size={16} color={Colors.warmGrayLight} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    placeholder="you@example.com"
                    placeholderTextColor={Colors.warmGrayLight}
                    testID="email-input"
                  />
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Feather name="lock" size={16} color={Colors.warmGrayLight} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.inputPassword]}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholder={isLogin ? 'Enter password' : 'Min 6 characters'}
                  placeholderTextColor={Colors.warmGrayLight}
                  testID="password-input"
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={8}
                  style={styles.eyeBtn}
                >
                  <Feather name={showPassword ? 'eye-off' : 'eye'} size={16} color={Colors.warmGrayLight} />
                </Pressable>
              </View>
            </View>

            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              style={({ pressed }) => [
                styles.submitBtn,
                pressed && styles.submitBtnPressed,
                loading && styles.submitBtnDisabled,
              ]}
              testID="submit-button"
            >
              {loading ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.submitBtnText}>
                  {isLogin ? 'Sign In' : 'Create Account'}
                </Text>
              )}
            </Pressable>

            <Pressable
              onPress={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              style={styles.toggleBtn}
            >
              <Text style={styles.toggleText}>
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <Text style={styles.toggleTextBold}>
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </Text>
              </Text>
            </Pressable>
          </View>

          <Pressable onPress={handleSkip} style={styles.skipBtn}>
            <Text style={styles.skipText}>Continue as guest</Text>
            <Feather name="arrow-right" size={14} color={Colors.warmGrayLight} />
          </Pressable>

          {!isLogin && (
            <View style={styles.trustRow}>
              <View style={styles.trustItem}>
                <Feather name="shield" size={12} color={Colors.warmGrayLight} />
                <Text style={styles.trustText}>Secure auth</Text>
              </View>
              <View style={styles.trustItem}>
                <Feather name="zap" size={12} color={Colors.warmGrayLight} />
                <Text style={styles.trustText}>Instant access</Text>
              </View>
              <View style={styles.trustItem}>
                <Feather name="credit-card" size={12} color={Colors.warmGrayLight} />
                <Text style={styles.trustText}>No card needed</Text>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  flex: {
    flex: 1,
  },
  onboardingScreen: {
    backgroundColor: Colors.primary,
  },
  onboardingTop: {
    flex: 1,
    paddingHorizontal: 32,
  },
  skipOnboarding: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  skipOnboardingText: {
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
    color: 'rgba(255,255,255,0.4)',
  },
  slideContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideIcon: {
    fontSize: 56,
    marginBottom: 24,
  },
  slideTitle: {
    fontSize: 32,
    fontFamily: 'DMSans_700Bold',
    color: Colors.white,
    textAlign: 'center',
    letterSpacing: -0.8,
    marginBottom: 12,
  },
  slideSub: {
    fontSize: 16,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.accent,
  },
  onboardingBottom: {
    paddingHorizontal: 24,
  },
  onboardingBtn: {
    backgroundColor: Colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    borderRadius: 16,
    marginBottom: 16,
  },
  onboardingBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  onboardingBtnText: {
    fontSize: 17,
    fontFamily: 'DMSans_700Bold',
    color: Colors.primary,
    letterSpacing: 0.2,
  },
  alreadyHaveBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  alreadyHaveText: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255,255,255,0.45)',
  },
  alreadyHaveBold: {
    fontFamily: 'DMSans_700Bold',
    color: Colors.accent,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  headerTitleGroup: {
    flex: 1,
    alignItems: 'center',
  },
  headerBrand: {
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
    color: Colors.white,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255,255,255,0.45)',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  form: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  promoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(201, 162, 78, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 78, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 20,
  },
  promoText: {
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
    color: Colors.accent,
    flex: 1,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(184, 59, 59, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
    color: Colors.error,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.warmGrayDark,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  labelOptional: {
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGrayLight,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  inputIcon: {
    marginLeft: 14,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    color: Colors.black,
  },
  inputPassword: {
    paddingRight: 44,
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    padding: 4,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
    color: Colors.white,
    letterSpacing: 0.2,
  },
  toggleBtn: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 4,
  },
  toggleText: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
  },
  toggleTextBold: {
    fontFamily: 'DMSans_700Bold',
    color: Colors.primary,
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 24,
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
    color: Colors.warmGrayLight,
  },
  trustRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 16,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trustText: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGrayLight,
  },
});
