import React, { useEffect, useState } from 'react';
import { Keyboard, Platform, Pressable, View } from 'react-native';
import { type BottomTabBarProps } from 'expo-router/js-tabs';
import { useApp } from './AppProvider';
import { Icon, IconName, Txt } from './primitives';

export function AppTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const { colors, isDark, toggleTheme } = useApp();
  const [keyboardVisible, setKeyboardVisible] = useState(() => Keyboard.isVisible());
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);
  if (keyboardVisible) return null;
  const icons: Record<string, IconName> = { index: 'compass-outline', map: 'map-outline', saved: 'heart-outline' };
  return <View style={{ backgroundColor: colors.background, paddingHorizontal: 12, paddingTop: 8, paddingBottom: Math.max(insets.bottom, 10), paddingLeft: Math.max(insets.left, 12), paddingRight: Math.max(insets.right, 12) }}>
    <View style={{ flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 32, padding: 6, gap: 3 }}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const options = descriptors[route.key].options;
        const ink = focused ? '#171A15' : colors.muted;
        return <Pressable key={route.key} accessibilityRole="tab" aria-selected={focused} accessibilityState={{ selected: focused }} accessibilityLabel={options.tabBarAccessibilityLabel ?? options.title ?? route.name}
          onPress={() => { const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true }); if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params); }}
          onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
          style={({ pressed }) => ({ flex: 1, minWidth: 0, minHeight: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', gap: 3, backgroundColor: focused ? colors.accent : 'transparent', opacity: pressed ? 0.65 : 1 })}>
          <Icon name={icons[route.name] ?? 'ellipse-outline'} size={22} color={ink} /><Txt style={{ color: ink, fontSize: 10, lineHeight: 13, fontWeight: '600' }}>{options.title ?? route.name}</Txt>
        </Pressable>;
      })}
      <Pressable accessibilityRole="button" accessibilityLabel={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'} onPress={toggleTheme} style={({ pressed }) => ({ flex: 1, minWidth: 0, minHeight: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', gap: 3, opacity: pressed ? 0.65 : 1 })}>
        <Icon name={isDark ? 'sunny-outline' : 'moon-outline'} size={22} color={colors.muted} /><Txt style={{ color: colors.muted, fontSize: 10, lineHeight: 13, fontWeight: '600' }}>{isDark ? 'День' : 'Ночь'}</Txt>
      </Pressable>
    </View>
  </View>;
}
