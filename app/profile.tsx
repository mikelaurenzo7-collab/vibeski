import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import Colors from '@/constants/colors';
import { useAuth } from '@/lib/auth-context';
import { useChat } from '@/lib/chat-context';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, isLoggedIn, logout } = useAuth();
  const { conversations } = useChat();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      logout();
      router.replace('/');
      return;
    }
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/');
        },
      },
    ]);
  };

  const handleLogin = () => {
    router.push('/auth');
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
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoggedIn ? (
          <>
            <View style={styles.profileCard}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {user?.username?.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
              <Text style={styles.profileName}>{user?.username}</Text>
              {user?.email && (
                <Text style={styles.profileEmail}>{user.email}</Text>
              )}
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{conversations.length}</Text>
                <Text style={styles.statLabel}>Projects</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {conversations.reduce((sum, c) => sum + c.messages.length, 0)}
                </Text>
                <Text style={styles.statLabel}>Messages</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account</Text>
              <View style={styles.menuList}>
                <Pressable
                  onPress={() => router.push('/command-center')}
                  style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
                >
                  <View style={[styles.menuIcon, { backgroundColor: 'rgba(201, 162, 78, 0.08)' }]}>
                    <Feather name="terminal" size={16} color="#C9A24E" />
                  </View>
                  <Text style={styles.menuText}>Command Center</Text>
                  <Feather name="chevron-right" size={16} color={Colors.warmGrayLight} />
                </Pressable>
                <View style={styles.menuItemDivider} />
                <Pressable
                  onPress={() => router.push('/projects')}
                  style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
                >
                  <View style={[styles.menuIcon, { backgroundColor: 'rgba(26, 107, 74, 0.08)' }]}>
                    <Feather name="folder" size={16} color="#1A6B4A" />
                  </View>
                  <Text style={styles.menuText}>My Projects</Text>
                  <Feather name="chevron-right" size={16} color={Colors.warmGrayLight} />
                </Pressable>
                <View style={styles.menuItemDivider} />
                <Pressable
                  onPress={() => router.push('/billing')}
                  style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
                >
                  <View style={[styles.menuIcon, { backgroundColor: 'rgba(14, 165, 233, 0.08)' }]}>
                    <Feather name="credit-card" size={16} color="#0EA5E9" />
                  </View>
                  <Text style={styles.menuText}>Billing & Usage</Text>
                  <Feather name="chevron-right" size={16} color={Colors.warmGrayLight} />
                </Pressable>
              </View>
            </View>

            <Pressable
              onPress={handleLogout}
              style={({ pressed }) => [styles.logoutBtn, pressed && styles.logoutBtnPressed]}
            >
              <Feather name="log-out" size={16} color={Colors.error} />
              <Text style={styles.logoutText}>Sign Out</Text>
            </Pressable>
          </>
        ) : (
          <View style={styles.guestContainer}>
            <View style={styles.guestIcon}>
              <Feather name="user" size={32} color={Colors.warmGrayLight} />
            </View>
            <Text style={styles.guestTitle}>Guest Mode</Text>
            <Text style={styles.guestSubtitle}>
              Sign in to save your projects, sync across devices, and access all features.
            </Text>
            <Pressable
              onPress={handleLogin}
              style={({ pressed }) => [styles.guestBtn, pressed && { opacity: 0.8 }]}
            >
              <Text style={styles.guestBtnText}>Sign In or Sign Up</Text>
            </Pressable>
          </View>
        )}

        <Text style={styles.versionText}>Field of Dreams v1.0</Text>
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
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontFamily: 'DMSans_700Bold',
    color: Colors.white,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  headerSpacer: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.divider,
    marginBottom: 12,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 24,
    fontFamily: 'DMSans_700Bold',
    color: Colors.white,
  },
  profileName: {
    fontSize: 20,
    fontFamily: 'DMSans_700Bold',
    color: Colors.black,
    letterSpacing: -0.3,
  },
  profileEmail: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  statNumber: {
    fontSize: 22,
    fontFamily: 'DMSans_700Bold',
    color: Colors.black,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    marginTop: 2,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.warmGrayDark,
    marginBottom: 8,
    paddingHorizontal: 4,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  menuList: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.divider,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  menuItemPressed: {
    backgroundColor: Colors.creamDark,
  },
  menuItemDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginLeft: 58,
  },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'DMSans_500Medium',
    color: Colors.black,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.divider,
    marginTop: 8,
  },
  logoutBtnPressed: {
    backgroundColor: Colors.creamDark,
  },
  logoutText: {
    fontSize: 15,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.error,
  },
  guestContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  guestIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  guestTitle: {
    fontSize: 20,
    fontFamily: 'DMSans_700Bold',
    color: Colors.black,
    marginBottom: 8,
  },
  guestSubtitle: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  guestBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  guestBtnText: {
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
    color: Colors.white,
  },
  versionText: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGrayLight,
    textAlign: 'center',
    marginTop: 32,
  },
});
