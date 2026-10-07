import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { hoursLabel, Route } from '../model';
import { routePhoto } from '../photos';
import { fetchRouteWeather, WeatherResult, weatherSummary } from '../services/weather';
import { useApp } from './AppProvider';
import { Icon, IconButton, Photo, Txt } from './primitives';

export function useForecast(route: Route, date: string, short = false, retry = 0) {
  const requestKey = `${route.id}:${date}:${short}:${retry}`;
  const [response, setResponse] = useState<{ key: string; result: WeatherResult } | null>(null);
  useEffect(() => {
    let active = true;
    fetchRouteWeather(route, date, short).then(value => { if (active) setResponse({ key: requestKey, result: value }); }).catch(() => {
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
  const { colors, saved, toggleSaved, storageReady } = useApp();
  const favorite = saved.includes(route.id);
  return <View style={{ backgroundColor: colors.elevated, borderRadius: 22, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginBottom: 20 }}>
    <Pressable accessibilityRole="button" accessibilityLabel={`Открыть маршрут: ${route.title}`} onPress={() => router.push(`/route/${route.id}`)} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
      <Photo source={routePhoto(route)} caption={route.subtitle} height={compact ? 155 : 208} />
      <View style={{ position: 'absolute', top: 14, left: 14, maxWidth: '72%', backgroundColor: '#FFFFFF', borderRadius: 30, paddingVertical: 6, paddingHorizontal: 12, flexDirection: 'row', gap: 5, alignItems: 'center' }}><Icon name={route.easy ? 'leaf-outline' : 'trail-sign-outline'} size={14} color="#18533F" /><Txt style={{ color: '#18533F', fontSize: 12, lineHeight: 18, fontWeight: '600' }}>{route.easy ? 'Легко выбраться' : 'Чуть больше приключений'}</Txt></View>
      <View style={{ padding: 18, gap: 8 }}>
        <Txt muted style={{ fontSize: 12, lineHeight: 18, letterSpacing: 0.6, textTransform: 'uppercase' }}>{route.subtitle}</Txt>
        <Txt style={{ fontSize: 24, lineHeight: 29, fontWeight: '700', letterSpacing: -0.45 }}>{route.title}</Txt>
        {!compact && <Txt muted style={{ fontSize: 14, lineHeight: 21 }}>{route.description}</Txt>}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 14, marginTop: 5 }}>
          <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}><Icon name="time-outline" size={17} color={colors.muted} /><Txt style={{ fontSize: 13 }}>{hoursLabel(route.durationHours)}</Txt></View>
          <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}><Icon name="walk-outline" size={17} color={colors.muted} /><Txt style={{ fontSize: 13 }}>≈ {route.walkingKm.join('–')} км</Txt></View>
          <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}><Icon name="car-outline" size={17} color={colors.muted} /><Txt style={{ fontSize: 13 }}>Из Тбилиси</Txt></View>
        </View>
        <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 11, marginTop: 5 }}><WeatherBadge route={route} /></View>
      </View>
    </Pressable>
    <View style={{ position: 'absolute', right: 12, top: 10 }}><IconButton name={favorite ? 'heart' : 'heart-outline'} label={favorite ? `Удалить ${route.title} из сохранённого` : `Сохранить ${route.title}`} inverse active={favorite} disabled={!storageReady} onPress={() => toggleSaved(route.id)} /></View>
  </View>;
}
