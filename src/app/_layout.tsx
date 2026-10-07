import React, { useSyncExternalStore } from 'react';
import { ActivityIndicator, Platform, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from '../ui/AppProvider';

export const unstable_settings = { initialRouteName: '(tabs)' };
const subscribeToClient = () => () => {};

function Navigation() {
  const { colors, isDark } = useApp();
  return <View style={{ flex: 1, backgroundColor: colors.page }}><StatusBar style={isDark ? 'light' : 'dark'} /><View style={{ flex: 1, width: '100%', maxWidth: Platform.OS === 'web' ? 520 : undefined, alignSelf: 'center', backgroundColor: colors.background }}><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background }, animation: 'slide_from_right' }}><Stack.Screen name="(tabs)" /><Stack.Screen name="route/[id]" /></Stack></View></View>;
}

export default function RootLayout() {
  const ready = useSyncExternalStore(subscribeToClient, () => true, () => Platform.OS !== 'web');
  // Dates, preferences and the map origin belong to the visitor, not the static build.
  if (!ready) return <View style={{ flex: 1, backgroundColor: '#CECECA', justifyContent: 'center', alignItems: 'center', gap: 16 }}><ActivityIndicator color="#161713" /><Text style={{ fontSize: 24, fontWeight: '700', color: '#161713' }}>Поехали</Text></View>;
  return <SafeAreaProvider><AppProvider><Navigation /></AppProvider></SafeAreaProvider>;
}
