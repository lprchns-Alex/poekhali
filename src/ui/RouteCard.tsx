import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { getTripHours, Route, ROUTES } from '../model';
import { fetchRouteWeather, WeatherResult, weatherSummary } from '../services/weather';
import { useApp } from './AppProvider';
import { Icon, Txt } from './primitives';
import { DotWeather } from './InstrumentGraphics';
import { routePanel } from './theme';

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
  const { saved, toggleSaved, storageReady, date, meal } = useApp();
  const favorite = saved.includes(route.id);
  const duration = getTripHours(route, meal);
  const panel = routePanel(route.id);
  const result = useForecast(route, date);
  const point = result?.status === 'ready' ? result.points[0] : undefined;
  const index = ROUTES.findIndex(item => item.id === route.id) + 1;
  const weatherText = point ? weatherSummary(point) : !result ? 'Загружаем' : result.status === 'out_of_range' ? 'Прогноз позже' : 'Нет прогноза';
  return <View style={{ backgroundColor: panel.background, borderRadius: 13, overflow: 'hidden', marginBottom: 8 }}>
    <Pressable accessibilityRole="button" accessibilityLabel={`Открыть маршрут: ${route.title}`} onPress={() => router.push(`/route/${route.id}`)} style={({ pressed }) => ({ padding: 18, paddingTop: 16, minHeight: compact ? 210 : 244, opacity: pressed ? 0.72 : 1 })}>
      <Txt style={{ color: panel.ink, fontSize: 11, lineHeight: 16, fontWeight: '700', letterSpacing: 0.8, marginBottom: 18, paddingRight: 42 }}>{String(index).padStart(2, '0')} / {route.tags[0].toLocaleUpperCase('ru-RU')}</Txt>
      <Txt style={{ color: panel.ink, fontSize: compact ? 29 : 33, lineHeight: compact ? 31 : 35, fontWeight: '600', letterSpacing: -1.3, marginBottom: 7 }}>{route.title}</Txt>
      <Txt style={{ color: panel.muted, fontSize: 12, lineHeight: 17 }}>{route.subtitle}</Txt>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginTop: 25 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 5 }}><Txt numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={{ color: panel.ink, fontSize: route.days === 2 ? 46 : 40, lineHeight: 49, letterSpacing: -2, fontWeight: '400' }}>{route.days === 2 ? '2' : duration.map(value => String(value).replace('.', ',')).join('–')}</Txt><Txt style={{ color: panel.ink, fontSize: 17 }}>{route.days === 2 ? 'дня' : 'ч'}</Txt></View>
          <Txt style={{ color: panel.muted, fontSize: 11, lineHeight: 17 }}>{route.days === 2 ? `1 ночь · ≈ ${duration.join('–')} ч всего` : `≈ с дорогой и обедом`}</Txt>
        </View>
        <View style={{ alignItems: 'flex-end', maxWidth: '47%' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}><DotWeather code={point?.code ?? null} color={panel.ink} size={42} /><Txt style={{ color: panel.ink, fontSize: 31, lineHeight: 38, letterSpacing: -1.5 }}>{point?.temperatureC == null ? '—' : `${Math.round(point.temperatureC)}°`}</Txt></View>
          <Txt style={{ color: panel.muted, fontSize: 11, lineHeight: 17, textAlign: 'right' }}>{route.days === 2 ? 'День 1 · ' : ''}{weatherText}</Txt>
        </View>
      </View>
    </Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel={favorite ? `Удалить ${route.title} из сохранённого` : `Сохранить ${route.title}`} accessibilityState={{ selected: favorite, disabled: !storageReady }} disabled={!storageReady} onPress={() => toggleSaved(route.id)} style={({ pressed }) => ({ position: 'absolute', right: 8, top: 2, width: 48, height: 48, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.5 : 1 })}><Icon name={favorite ? 'heart' : 'heart-outline'} color={panel.ink} size={23} /></Pressable>
  </View>;
}
