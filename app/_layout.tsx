import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import theme from '@/constants/theme';

const AUTH_KEY = '@fin_authed';

export default function RootLayout() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Auth session resets each cold launch for security
        await AsyncStorage.removeItem(AUTH_KEY);
        setTimeout(() => {
          router.replace('/auth');
          setChecking(false);
        }, 300);
      } catch {
        router.replace('/auth');
        setChecking(false);
      }
    })();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor={theme.navBg} translucent={false} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.bg }, animation: 'fade' }}>
        <Stack.Screen name="auth" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      {checking && (
        <View style={s.overlay}>
          <ActivityIndicator color={theme.gold} size="large" />
        </View>
      )}
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' },
});