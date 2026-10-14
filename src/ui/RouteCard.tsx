import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { getTripHours, Route, ROUTES } from '../model';
import { fetchRouteWeather, WeatherResult, weatherSummary } from '../services/weather';
import { useApp } from './AppProvider';
import { Icon, Photo, Txt } from './primitives';
import { DotWeather } from './InstrumentGraphics';
import { galleryPhotoSource, routeGallery } from '../photos';

export function useForecast(route: Route, date: string, short = false, retry = 0) {
  const requestKey = `${route.id}:${date}:${short}:${retry}`;
  const [response, setResponse] = useState<{ key: string; result: WeatherResult } | null>(null);
  useEffect(() => {
    let active = true;
    fetchRouteWeather(route, date, short, retry > 0).then(value => { if (active) setResponse({ key: requestKey, result: value }); }).catch(() => {
      if (active) setResponse({ key: requestKey, result: { status: 'unavailable', date, updatedAt: null, points: [], message: 'Не удалось загрузить прогноз. Попробуйте ещё раз.' } });
    });
    return () => { active = false; };
  }, [route, date, short, retry, requestKey]);
  return response?.key === requestKey ? response.result : null;
}

export function WeatherBadge({ route }: { route: Route }) {
  const { date, colors } = useApp();
  const result = useForecast(route, date);
  const point = result?.points[0];
  const valid = result?.status === 'ready' && point;
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
    <Icon name={valid && point.rainProbability !== null && point.rainProbability >= 45 ? 'rainy-outline' : valid ? 'partly-sunny-outline' : 'cloud-outline'} size={17} color={colors.muted} />
    <Txt muted style={{ fontSize: 13, lineHeight: 19 }}>{valid ? `${point.temperatureC === null ? '' : `${Math.round(point.temperatureC)}° · `}${weatherSummary(point)}` : !result ? 'Загружаем погоду' : result.status === 'out_of_range' ? 'Прогноз появится позже' : 'Прогноз недоступен'}</Txt>
  </View>;
}

export function RouteCard({ route, compact = false }: { route: Route; compact?: boolean }) {
  const { colors, saved, toggleSaved, storageReady, date, meal } = useApp();
  const favorite = saved.includes(route.id);
  const duration = getTripHours(route, meal);
  const result = useForecast(route, date);
  const point = result?.status === 'ready' ? result.points[0] : undefined;
  const photo = routeGallery(route)[0];
  const index = ROUTES.findIndex(item => item.id === route.id) + 1;
  const weatherText = point ? weatherSummary(point) : !result ? 'Загружаем погоду' : result.status === 'out_of_range' ? 'Прогноз позже' : 'Нет прогноза';
  return <View style={{ backgroundColor: colors.surface, borderRadius: 28, overflow: 'hidden', marginBottom: 16 }}>
    <Pressable accessibilityRole="button" accessibilityLabel={`Открыть маршрут: ${route.title}`} onPress={() => router.push(`/route/${route.id}`)} style={({ pressed }) => ({ opacity: pressed ? 0.76 : 1 })}>
      <View>
        <Photo source={galleryPhotoSource(photo)} caption={photo.caption} height={compact ? 130 : 174} />
        <View style={{ position: 'absolute', top: 14, left: 14, backgroundColor: '#C5F933', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}><Txt style={{ color: '#171A15', fontSize: 12, lineHeight: 18, fontWeight: '600' }}>{String(index).padStart(2, '0')} · {route.tags[0]}</Txt></View>
      </View>
      <View style={{ padding: 18, gap: 10 }}>
        <Txt style={{ color: colors.text, fontSize: 27, lineHeight: 30, fontWeight: '500', letterSpacing: -0.9 }}>{route.title}</Txt>
        <Txt muted style={{ fontSize: 13, lineHeight: 20 }}>{route.subtitle}</Txt>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
          <View style={{ flex: 1, gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Icon name="time-outline" size={17} /><Txt style={{ fontSize: 13, lineHeight: 19, fontWeight: '600' }}>{route.days === 2 ? '2 дня · 1 ночь' : `≈ ${duration.map(value => String(value).replace('.', ',')).join('–')} ч`}</Txt></View>
            <Txt muted style={{ fontSize: 11, lineHeight: 16 }}>{route.days === 2 ? `≈ ${duration.join('–')} ч всего` : 'С дорогой и обедом'}</Txt>
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><DotWeather code={point?.code ?? null} size={20} color={colors.text} /><Txt style={{ fontSize: 13, lineHeight: 19, fontWeight: '600' }}>{point?.temperatureC == null ? 'Погода' : `${Math.round(point.temperatureC)}°${route.days === 2 ? ' · день 1' : ''}`}</Txt></View>
            <Txt muted style={{ fontSize: 11, lineHeight: 16 }}>{weatherText}</Txt>
          </View>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' }}><Icon name="arrow-forward-outline" size={22} color={colors.text} /></View>
        </View>
      </View>
    </Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel={favorite ? `Удалить ${route.title} из сохранённого` : `Сохранить ${route.title}`} accessibilityState={{ selected: favorite, disabled: !storageReady }} disabled={!storageReady} onPress={() => toggleSaved(route.id)} style={({ pressed }) => ({ position: 'absolute', top: 10, right: 10, width: 48, height: 48, borderRadius: 24, backgroundColor: favorite ? colors.accent : '#FFFFFF', alignItems: 'center', justifyContent: 'center', opacity: !storageReady ? 0.4 : pressed ? 0.7 : 1 })}><Icon name={favorite ? 'heart' : 'heart-outline'} size={23} color="#171A15" /></Pressable>
  </View>;
}
