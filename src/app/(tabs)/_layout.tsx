import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../ui/AppProvider';
import { AppTabBar } from '../../ui/AppTabBar';

export default function TabLayout() {
  const { colors } = useApp();
  const insets = useSafeAreaInsets();
  return <Tabs tabBar={props => <AppTabBar {...props} />} screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.muted, tabBarLabelPosition: 'below-icon', sceneStyle: { backgroundColor: colors.background }, tabBarStyle: { height: 62 + Math.max(insets.bottom, 8), paddingTop: 7, paddingBottom: Math.max(insets.bottom, 8), borderTopWidth: 0, borderTopColor: colors.border, backgroundColor: colors.background, elevation: 0 }, tabBarItemStyle: { minHeight: 52 }, tabBarLabelStyle: { fontSize: 12, lineHeight: 14, fontWeight: '600', letterSpacing: -0.2, marginTop: 2 } }}>
    <Tabs.Screen name="index" options={{ title: 'Маршруты', tabBarAccessibilityLabel: 'Маршруты', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'compass' : 'compass-outline'} color={color} size={21} /> }} />
    <Tabs.Screen name="map" options={{ title: 'Карта', tabBarAccessibilityLabel: 'Карта', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'map' : 'map-outline'} color={color} size={21} /> }} />
    <Tabs.Screen name="saved" options={{ title: 'Сохранено', tabBarAccessibilityLabel: 'Сохранено', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'heart' : 'heart-outline'} color={color} size={21} /> }} />
  </Tabs>;
}
