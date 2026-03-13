import React, { useState } from 'react';
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
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import Colors from '@/constants/colors';
import { useAuth } from '@/lib/auth-context';

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { login, signup } = useAuth();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: (insets.top || webTopInset) + 16 }]}>
        <Text style={styles.headerLabel}>Field of Dreams</Text>
        <Text style={styles.headerSubtitle}>
          {isLogin ? 'Welcome back' : 'Create your account'}
        </Text>
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
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <Feather name={isLogin ? 'log-in' : 'user-plus'} size={28} color={Colors.primary} />
              </View>
            </View>

            <Text style={styles.formTitle}>
              {isLogin ? 'Sign In' : 'Sign Up'}
            </Text>

            {!!error && (
              <View style={styles.errorBox}>
                <Feather name="alert-circle" size={14} color={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
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

            {!isLogin && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  placeholder="Enter email"
                  placeholderTextColor={Colors.warmGrayLight}
                  testID="email-input"
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder={isLogin ? 'Enter password' : 'Min 6 characters'}
                placeholderTextColor={Colors.warmGrayLight}
                testID="password-input"
              />
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
  content: {
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  form: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formTitle: {
    fontSize: 20,
    fontFamily: 'DMSans_700Bold',
    color: Colors.black,
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: -0.3,
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
  input: {
    backgroundColor: Colors.inputBg,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    color: Colors.black,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
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
    fontSize: 15,
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
});
