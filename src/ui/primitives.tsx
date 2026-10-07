import React, { useState } from 'react';
import { ActivityIndicator, Image, ImageSourcePropType, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StyleProp, StyleSheet, Text, TextProps, TextStyle, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from './AppProvider';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];
export function Icon({ name, size = 22, color }: { name: IconName; size?: number; color?: string }) {
  const { colors } = useApp(); return <Ionicons name={name} size={size} color={color ?? colors.text} />;
}
export function Txt({ style, muted, ...props }: TextProps & { muted?: boolean }) {
  const { colors } = useApp(); return <Text {...props} style={[{ fontSize: 16, lineHeight: 24, color: muted ? colors.muted : colors.text, flexShrink: 1 }, style]} />;
}
export function Title({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Txt accessibilityRole="header" style={[{ fontSize: 27, lineHeight: 33, fontWeight: '700', letterSpacing: -0.7 }, style]}>{children}</Txt>;
}
export function IconButton({ name, label, onPress, active, inverse, disabled }: { name: IconName; label: string; onPress: () => void; active?: boolean; inverse?: boolean; disabled?: boolean }) {
  const { colors } = useApp();
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: active, disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: inverse ? 'rgba(255,255,255,0.96)' : active ? colors.soft : colors.surface, opacity: pressed || disabled ? 0.65 : 1 }]}><Icon name={name} color={inverse ? '#183A2D' : active ? colors.primary : colors.text} /></Pressable>;
}
export function Button({ children, onPress, icon, secondary, disabled, style, accessibilityLabel }: { children: React.ReactNode; onPress: () => void; icon?: IconName; secondary?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle>; accessibilityLabel?: string }) {
  const { colors } = useApp();
  return <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={accessibilityLabel} accessibilityState={{ disabled }} style={({ pressed }) => [{ minHeight: 54, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 13, flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: secondary ? colors.soft : colors.primary, opacity: pressed || disabled ? 0.65 : 1 }, style]}>
    {icon && <Icon name={icon} color={secondary ? colors.text : colors.onPrimary} size={20} />}
    <Txt style={{ fontWeight: '600', color: secondary ? colors.text : colors.onPrimary, textAlign: 'center' }}>{children}</Txt>
  </Pressable>;
}
export function Chip({ label, selected, onPress, icon, small }: { label: string; selected?: boolean; onPress: () => void; icon?: IconName; small?: boolean }) {
  const { colors } = useApp();
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={({ pressed }) => [{ minHeight: 48, borderRadius: 24, paddingHorizontal: small ? 14 : 18, paddingVertical: 10, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? colors.primary : colors.surface, opacity: pressed ? 0.7 : 1 }]}>{icon && <Icon name={icon} size={18} color={selected ? colors.onPrimary : colors.muted} />}<Txt style={{ fontWeight: selected ? '600' : '500', color: selected ? colors.onPrimary : colors.text }}>{label}</Txt></Pressable>;
}
export function Info({ children, icon = 'information-circle-outline', warm = false }: { children: React.ReactNode; icon?: IconName; warm?: boolean }) {
  const { colors } = useApp();
  return <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 16, borderRadius: 16, backgroundColor: warm ? colors.amberSoft : colors.surface }}><Icon name={icon} color={warm ? colors.amber : colors.muted} size={21} /><Txt style={{ flex: 1, fontSize: 14, lineHeight: 21, color: warm ? colors.amber : colors.muted }}>{children}</Txt></View>;
}
type PhotoProps = { uri?: string; source?: ImageSourcePropType; caption: string; height?: number; style?: StyleProp<ViewStyle> };
export function Photo(props: PhotoProps) { return <PhotoContent key={JSON.stringify(props.source ?? props.uri)} {...props} />; }
function PhotoContent({ uri, source, caption, height = 215, style }: PhotoProps) {
  const { colors } = useApp();
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  return <View style={[{ height, backgroundColor: colors.soft, overflow: 'hidden' }, style]}>
    <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', gap: 10, padding: 24 }]}>
      <Icon name="image-outline" size={30} color={colors.muted} />
      {failed && <Txt muted style={{ textAlign: 'center', fontSize: 14 }}>Фото не загрузилось{ '\n' }{caption}</Txt>}
      {loading && !failed && <ActivityIndicator color={colors.primary} size="small" />}
    </View>
    {!failed && (source || uri) && <Image source={source ?? { uri }} accessibilityLabel={caption} resizeMode="cover" onLoad={() => setLoading(false)} onError={() => { setFailed(true); setLoading(false); }} style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} />}
  </View>;
}
export function ExternalLink({ url, children }: { url: string; children: React.ReactNode }) {
  const { colors } = useApp();
  const [failed, setFailed] = useState(false);
  return <View><Pressable accessibilityRole="link" onPress={() => { setFailed(false); Linking.openURL(url).catch(() => setFailed(true)); }} style={({ pressed }) => ({ minHeight: 48, paddingVertical: 12, opacity: pressed ? 0.6 : 1, flexDirection: 'row', gap: 8, alignItems: 'center' })}><Txt style={{ color: colors.primary, fontSize: 14, lineHeight: 20, fontWeight: '500', flex: 1 }}>{children}</Txt><Icon name="open-outline" size={16} color={colors.primary} /></Pressable>{failed && <Txt muted style={{ fontSize: 13 }}>Не удалось открыть ссылку. Проверьте подключение.</Txt>}</View>;
}
export function Sheet({ visible, title, onClose, children, footer }: { visible: boolean; title: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode }) {
  const { colors } = useApp();
  const insets = useSafeAreaInsets();
  return <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(9,25,18,0.45)' }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Закрыть панель" onPress={onClose} style={StyleSheet.absoluteFill} />
      <View accessibilityViewIsModal style={{ maxHeight: '91%', backgroundColor: colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, width: '100%', maxWidth: 520, alignSelf: 'center', paddingBottom: Math.max(insets.bottom, 16) }}>
        <View style={{ width: 36, height: 4, borderRadius: 4, backgroundColor: colors.border, alignSelf: 'center', marginTop: 10 }} />
        <View style={{ paddingHorizontal: 22, paddingTop: 12, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}><Title style={{ flex: 1, fontSize: 24 }}>{title}</Title><IconButton name="close" label="Закрыть" onPress={onClose} /></View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 14 }}>{children}</ScrollView>
        {footer && <View style={{ paddingHorizontal: 22, paddingTop: 10, borderTopWidth: 1, borderColor: colors.border }}>{footer}</View>}
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}
