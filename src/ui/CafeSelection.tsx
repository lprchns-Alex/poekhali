import React, { useState } from 'react';
import { Linking, View } from 'react-native';
import { routeCafes, cafeMapsUrl } from '../cafes';
import { foodSearchUrl, Route } from '../model';
import { useApp } from './AppProvider';
import { Button, Icon, Txt } from './primitives';
import { PagedCarousel } from './PagedCarousel';

export function CafeSelection({ route, short }: { route: Route; short: boolean }) {
  const { colors } = useApp();
  const { places, note } = routeCafes(route);
  const [error, setError] = useState(false);
  const open = (url: string) => {
    setError(false);
    Linking.openURL(url).catch(() => setError(true));
  };
  return <View style={{ marginBottom: 32, gap: 14 }}>
    <Txt muted style={{ fontSize: 14, lineHeight: 21 }}>{note}</Txt>
    {places.length > 0 && <PagedCarousel items={places} label="Места для обеда" renderItem={(cafe, index, active) => <View style={{ flex: 1, backgroundColor: colors.surface, padding: 18, borderRadius: 12, gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1 }}><Txt muted style={{ fontSize: 11, lineHeight: 16, fontWeight: '700', letterSpacing: 1 }}>НАША ПОДБОРКА / 0{index + 1}</Txt><Txt style={{ fontWeight: '700', fontSize: 25, lineHeight: 29, letterSpacing: -0.8, marginTop: 7 }}>{cafe.name}</Txt></View>
        <Icon name="restaurant-outline" size={27} />
      </View>
      <Txt muted style={{ fontSize: 13, lineHeight: 19 }}>{cafe.locality}</Txt>
      <View style={{ alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 5, borderWidth: 1, borderColor: colors.border, borderRadius: 6 }}><Txt style={{ fontSize: 12, lineHeight: 18 }}>{cafe.tag}</Txt></View>
      <Txt style={{ fontSize: 15, lineHeight: 22, flexGrow: 1 }}>{cafe.description}</Txt>
      <Button secondary disabled={!active} icon="location-outline" accessibilityLabel={`Открыть ${cafe.name} на картах`} onPress={() => open(cafeMapsUrl(cafe))}>Это место на карте</Button>
    </View>} />}
    <Button icon="open-outline" onPress={() => open(foodSearchUrl(route, short))}>Найти кафе на картах</Button>
    <Txt muted style={{ fontSize: 12, lineHeight: 18 }}>Подборка по расположению и формату · проверена 8 октября 2026. Обед{route.days === 2 ? ' каждого дня' : ''} учтён в плане; дополнительные заезды — отдельно.</Txt>
    {error && <Txt accessibilityLiveRegion="polite" style={{ fontSize: 13 }}>Не удалось открыть карты. Попробуй ещё раз.</Txt>}
  </View>;
}
