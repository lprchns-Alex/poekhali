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

  return <View style={{ flexDirection: 'row', backgroundColor: colors.background, paddingLeft: props.insets.left, paddingRight: props.insets.right }}>
    <View style={{ flex: 3 }}><BottomTabBar {...props} insets={{ ...props.insets, left: 0, right: 0 }} /></View>
    <View style={{ flex: 1, paddingTop: 7, paddingBottom: Math.max(props.insets.bottom, 8) }}>
      <Pressable accessibilityRole="button" accessibilityLabel={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'} onPress={toggleTheme} style={({ pressed }) => ({ flex: 1, minHeight: 52, padding: 5, alignItems: 'center', opacity: pressed ? 0.6 : 1 })}>
        <View style={{ width: 31, height: 28, justifyContent: 'center', alignItems: 'center' }}><Icon name={isDark ? 'sunny-outline' : 'moon-outline'} size={21} color={colors.muted} /></View>
        <Txt style={{ color: colors.muted, fontSize: 12, lineHeight: 14, fontWeight: '600', letterSpacing: -0.2, marginTop: 2 }}>{isDark ? 'День' : 'Ночь'}</Txt>
      </Pressable>
    </View>
  </View>;
}
