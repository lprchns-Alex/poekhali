import React, { useState } from 'react';
import { View } from 'react-native';
import { routeCafes, cafeMapsUrl } from '../cafes';
import { foodSearchUrl, Route } from '../model';
import { useApp } from './AppProvider';
import { MapChoice, Button, Icon, Txt } from './primitives';
import { mapQuery } from '../maps';
import { PagedCarousel } from './PagedCarousel';

export function CafeSelection({ route, short }: { route: Route; short: boolean }) {
  const { colors } = useApp();
  const { places, note } = routeCafes(route);
  const [query, setQuery] = useState<string | null>(null);
  const open = (url: string) => setQuery(mapQuery(url));
  return <View style={{ marginBottom: 36, gap: 16 }}>
    <Txt muted style={{ fontSize: 14, lineHeight: 21 }}>{note}</Txt>
    {places.length > 0 && <PagedCarousel items={places} label="Места для обеда" renderItem={(cafe, index, active) => <View style={{ flex: 1, backgroundColor: colors.surface, padding: 22, borderRadius: 28, gap: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 5 }}>
        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}><Icon name="restaurant-outline" size={22} color="#18200C" /></View>
        <Txt muted style={{ flex: 1, textAlign: 'right', fontSize: 10, lineHeight: 16, fontWeight: '500', letterSpacing: 1.2 }}>НАША ПОДБОРКА{ '\n' }{String(index + 1).padStart(2, '0')}</Txt>
      </View>
      <Txt style={{ fontWeight: '400', fontSize: 28, lineHeight: 32, letterSpacing: -0.9 }}>{cafe.name}</Txt>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Icon name="location-outline" size={14} color={colors.muted} /><Txt muted style={{ flex: 1, fontSize: 13, lineHeight: 19 }}>{cafe.locality}</Txt></View>
      <View style={{ alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.soft, borderRadius: 999 }}><Txt style={{ fontSize: 12, lineHeight: 18 }}>{cafe.tag}</Txt></View>
      <Txt style={{ fontSize: 15, lineHeight: 22, flexGrow: 1 }}>{cafe.description}</Txt>
      <Button secondary style={{ backgroundColor: colors.soft, marginTop: 6 }} disabled={!active} icon="open-outline" accessibilityLabel={`Открыть ${cafe.name} на картах`} onPress={() => open(cafeMapsUrl(cafe))}>Это место на карте</Button>
    </View>} />}
    <Button secondary icon="search-outline" onPress={() => open(foodSearchUrl(route, short))}>Найти кафе на картах</Button>
    <Txt muted style={{ fontSize: 12, lineHeight: 18 }}>Подборка по расположению и формату · проверена 8 октября 2026. Обед{route.days === 2 ? ' каждого дня' : ''} учтён в плане; дополнительные заезды — отдельно.</Txt>
    <MapChoice query={query} onClose={() => setQuery(null)} />
  </View>;
}
