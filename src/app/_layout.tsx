import React from 'react';
import { Platform, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from '../ui/AppProvider';

export const unstable_settings = { initialRouteName: '(tabs)' };

function Navigation() {
  const { colors, isDark } = useApp();
  return <View style={{ flex: 1, backgroundColor: colors.page }}><StatusBar style={isDark ? 'light' : 'dark'} /><View style={{ flex: 1, width: '100%', maxWidth: Platform.OS === 'web' ? 520 : undefined, alignSelf: 'center', backgroundColor: colors.background }}><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background }, animation: 'slide_from_right' }}><Stack.Screen name="(tabs)" /><Stack.Screen name="route/[id]" /></Stack></View></View>;
}

export default function RootLayout() {
  return <SafeAreaProvider><AppProvider><Navigation /></AppProvider></SafeAreaProvider>;
}
