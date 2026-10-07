import React, { useEffect, useState } from 'react';
import { Keyboard, Platform, Pressable, View } from 'react-native';
import { BottomTabBar, type BottomTabBarProps } from 'expo-router/js-tabs';
import { useApp } from './AppProvider';
import { Icon, Txt } from './primitives';

export function AppTabBar(props: BottomTabBarProps) {
  const { colors, isDark, toggleTheme } = useApp();
  const [keyboardVisible, setKeyboardVisible] = useState(() => Keyboard.isVisible());
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  if (keyboardVisible) return null;

  return <View style={{ flexDirection: 'row', backgroundColor: colors.background, paddingRight: props.insets.right }}>
    <View style={{ flex: 1 }}><BottomTabBar {...props} insets={{ ...props.insets, right: 0 }} /></View>
    <View style={{ width: 72, paddingTop: 7, paddingBottom: Math.max(props.insets.bottom, 8), alignItems: 'center' }}>
      <Pressable accessibilityRole="button" accessibilityLabel={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'} onPress={toggleTheme} style={({ pressed }) => ({ minWidth: 60, minHeight: 52, justifyContent: 'center', alignItems: 'center', gap: 4, borderRadius: 10, backgroundColor: colors.surface, opacity: pressed ? 0.6 : 1 })}>
        <Icon name={isDark ? 'sunny-outline' : 'moon-outline'} size={21} color={colors.text} />
        <Txt style={{ fontSize: 12, lineHeight: 15, fontWeight: '600', letterSpacing: -0.2 }}>{isDark ? 'День' : 'Ночь'}</Txt>
      </Pressable>
    </View>
  </View>;
}
