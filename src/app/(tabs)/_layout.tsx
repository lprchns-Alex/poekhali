import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../ui/AppProvider';
import { AppTabBar } from '../../ui/AppTabBar';

export default function TabLayout() {
  const { colors } = useApp();
  return <Tabs tabBar={props => <AppTabBar {...props} />} screenOptions={{ headerShown: false, tabBarActiveTintColor: '#171A15', tabBarActiveBackgroundColor: colors.accent, tabBarInactiveTintColor: colors.muted, tabBarLabelPosition: 'below-icon', sceneStyle: { backgroundColor: colors.background }, tabBarStyle: { height: 64, paddingTop: 8, paddingBottom: 8, borderTopWidth: 0, borderTopColor: colors.border, backgroundColor: 'transparent', elevation: 0 }, tabBarItemStyle: { minHeight: 48, borderRadius: 24, marginHorizontal: 2 }, tabBarLabelStyle: { fontSize: 10, lineHeight: 13, fontWeight: '600', letterSpacing: -0.2, marginTop: 2 } }}>
    <Tabs.Screen name="index" options={{ title: 'Маршруты', tabBarAccessibilityLabel: 'Маршруты', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'compass' : 'compass-outline'} color={color} size={21} /> }} />
    <Tabs.Screen name="map" options={{ title: 'Карта', tabBarAccessibilityLabel: 'Карта', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'map' : 'map-outline'} color={color} size={21} /> }} />
    <Tabs.Screen name="saved" options={{ title: 'Сохранено', tabBarAccessibilityLabel: 'Сохранено', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'heart' : 'heart-outline'} color={color} size={21} /> }} />
  </Tabs>;
}
