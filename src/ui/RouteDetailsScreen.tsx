import React, { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { foodSearchUrl, formatDate, getTripHours, hoursLabel, placeSearchUrl, ROUTES } from '../model';
import { routePhoto } from '../photos';
import { weatherAdvice, weatherSummary } from '../services/weather';
import { useApp } from './AppProvider';
import { Button, Chip, ExternalLink, Icon, IconButton, IconName, Info, Photo, Title, Txt } from './primitives';
import { CalendarSheet } from './sheets';
import { useForecast } from './RouteCard';

function Stat({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  const { colors } = useApp();
  return <View style={{ flex: 1, minWidth: 115, padding: 15, borderRadius: 17, backgroundColor: colors.surface, gap: 5 }}><Icon name={icon} size={19} color={colors.primary} /><Txt style={{ fontWeight: '700', fontSize: 17, marginTop: 4 }}>{value}</Txt><Txt muted style={{ fontSize: 12, lineHeight: 17 }}>{label}</Txt></View>;
}

function TimelineStep({ icon, title, subtitle, body, last = false, link }: { icon: IconName; title: string; subtitle?: string; body?: string; last?: boolean; link?: string }) {
  const { colors } = useApp();
  return <View style={{ flexDirection: 'row', gap: 14 }}>
    <View style={{ width: 38, alignItems: 'center' }}><View style={{ width: 38, height: 38, borderRadius: 14, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={19} color={colors.primary} /></View>{!last && <View style={{ flex: 1, width: 1.5, backgroundColor: colors.border, minHeight: 24, marginVertical: 5 }} />}</View>
    <View style={{ flex: 1, paddingBottom: 23, paddingTop: 2 }}><Txt style={{ fontWeight: '700', fontSize: 17 }}>{title}</Txt>{subtitle && <Txt style={{ color: colors.primary, fontSize: 13, marginTop: 2 }}>{subtitle}</Txt>}{body && <Txt muted style={{ fontSize: 14, lineHeight: 21, marginTop: 7 }}>{body}</Txt>}{link && <ExternalLink url={link}>Найти место в картах</ExternalLink>}</View>
  </View>;
}

export function RouteDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const route = ROUTES.find(item => item.id === id);
  if (!route) return <MissingRoute />;
  return <RouteDetails key={route.id} route={route} />;
}

function MissingRoute() {
  const { colors } = useApp();
  return <SafeAreaView style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: colors.background, gap: 20 }}><Title>Маршрут не найден</Title><Txt muted>Возможно, ссылка устарела. В каталоге есть другие идеи.</Txt><Button onPress={() => router.replace('/')}>Открыть маршруты</Button></SafeAreaView>;
}

function RouteDetails({ route }: { route: (typeof ROUTES)[number] }) {
  const { colors, date, meal, setMeal, saved, toggleSaved, storageReady } = useApp();
  const insets = useSafeAreaInsets();
  const [calendar, setCalendar] = useState(false);
  const { short: shortParam } = useLocalSearchParams<{ short?: string }>();
  const [short, setShort] = useState(shortParam === '1' && Boolean(route.shortVariant));
  const [credits, setCredits] = useState(false);
  const [retry, setRetry] = useState(0);
  const [linkError, setLinkError] = useState(false);
  const result = useForecast(route, date, short, retry);
  const advice = result ? weatherAdvice(result) : null;
  const stops = short ? route.stops.slice(0, 1) : route.stops;
  const favorite = saved.includes(route.id);
  const duration = getTripHours(route, meal, short);
  const foodTitle = meal === 'picnic' ? (short ? 'Перерыв с едой с собой' : route.preferredMeal === 'picnic' ? route.mealLabel : 'Обед с собой') : route.preferredMeal === 'cafe' ? route.mealLabel : 'Обед в кафе по пути';
  const openCafe = () => {
    setLinkError(false);
    const url = short ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('restaurants Sabaduri Georgia')}` : foodSearchUrl(route);
    Linking.openURL(url).catch(() => setLinkError(true));
  };
  return <View style={{ flex: 1, backgroundColor: colors.background }}>
    <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
      <View>
        <Photo source={routePhoto(route)} caption={route.subtitle} height={300 + insets.top} />
        <View style={{ position: 'absolute', top: Math.max(insets.top, 12), left: 18, right: 18, flexDirection: 'row', justifyContent: 'space-between' }}><IconButton name="arrow-back" label="Назад к маршрутам" inverse onPress={() => router.canGoBack() ? router.back() : router.replace('/')} /><IconButton name={favorite ? 'heart' : 'heart-outline'} label={favorite ? 'Удалить из сохранённого' : 'Сохранить маршрут'} inverse active={favorite} disabled={!storageReady} onPress={() => toggleSaved(route.id)} /></View>
        <View style={{ position: 'absolute', bottom: 16, left: 22, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 30, paddingHorizontal: 12, paddingVertical: 7 }}><Txt style={{ color: '#18533F', fontSize: 12, lineHeight: 18, fontWeight: '600' }}>{short ? 'НА ФОТО — СИОНИ, ПОЛНЫЙ МАРШРУТ' : 'ОДИН ДЕНЬ В ГРУЗИИ'}</Txt></View>
      </View>
      <View style={{ paddingHorizontal: 22, paddingTop: 25 }}>
        <Txt style={{ color: colors.primary, fontSize: 12, letterSpacing: 0.7, textTransform: 'uppercase', marginBottom: 9 }}>{short ? 'Сабадури · только лес' : route.subtitle}</Txt>
        <Title style={{ fontSize: 35, lineHeight: 39, letterSpacing: -1.1, marginBottom: 12 }}>{short ? 'День в Сабадурском лесу' : route.title}</Title>
        <Txt muted style={{ fontSize: 16, lineHeight: 24, marginBottom: 22 }}>{short ? 'Прогуляться среди буков и вернуться в город пораньше.' : route.description}</Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 }}><Stat icon="time-outline" value={hoursLabel(duration)} label="на весь день с дорогой" /><Stat icon="walk-outline" value={short ? 'Короткая прогулка' : `≈ ${route.walkingKm.join('–')} км`} label={route.difficulty.toLowerCase()} /></View>
        {route.shortVariant && <View style={{ marginBottom: 28 }}><Title style={{ fontSize: 22, marginBottom: 11 }}>Твой темп</Title><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}><Chip label="Лес + озеро" selected={!short} onPress={() => setShort(false)} icon="water-outline" /><Chip label="Только лес" selected={short} onPress={() => setShort(true)} icon="leaf-outline" /></View>{short && <Txt muted style={{ fontSize: 14, lineHeight: 21, marginTop: 10 }}>{route.shortVariant.description}</Txt>}</View>}

        <View style={{ backgroundColor: colors.surface, padding: 18, borderRadius: 22, marginBottom: 28 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><View style={{ flex: 1 }}><Title style={{ fontSize: 22 }}>Погода по пути</Title><Txt muted style={{ fontSize: 13 }}>{formatDate(date, true)}</Txt></View><IconButton name="calendar-outline" label="Изменить дату поездки" onPress={() => setCalendar(true)} /></View>
          {!result ? <View style={{ paddingVertical: 30, flexDirection: 'row', alignItems: 'center', gap: 10 }}><ActivityIndicator color={colors.primary} /><Txt muted style={{ fontSize: 14 }}>Узнаём прогноз по остановкам…</Txt></View> : result.status === 'ready' ? <View style={{ gap: 10, marginTop: 16 }}>
            {result.points.map((point, index) => <View key={`${point.stopName}-${index}`} style={{ padding: 14, borderRadius: 16, backgroundColor: colors.elevated }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><View style={{ flex: 1 }}><Txt style={{ fontWeight: '600', fontSize: 14, lineHeight: 20 }}>{point.stopName}</Txt><Txt muted style={{ fontSize: 12 }}>В {String(point.hour).padStart(2, '0')}:00 · время Грузии</Txt></View><Icon name={point.rainProbability !== null && point.rainProbability >= 45 ? 'rainy-outline' : 'partly-sunny-outline'} size={25} color={colors.primary} /><Txt style={{ fontSize: 26, lineHeight: 31, fontWeight: '600' }}>{point.temperatureC === null ? '—' : `${Math.round(point.temperatureC)}°`}</Txt></View>
              <Txt muted style={{ fontSize: 13, marginTop: 6 }}>{weatherSummary(point)}</Txt>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 6 }}><View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}><Icon name="water-outline" size={14} color={colors.muted} /><Txt muted style={{ fontSize: 12 }}>{point.rainProbability === null ? 'Нет данных' : `Дождь ${Math.round(point.rainProbability)}%`}</Txt></View><View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}><Icon name="flag-outline" size={14} color={colors.muted} /><Txt muted style={{ fontSize: 12 }}>{point.windKmh === null ? 'Нет данных' : `Ветер ${Math.round(point.windKmh)} км/ч`}</Txt></View></View>
            </View>)}
            {advice && <Info warm icon="rainy-outline">{advice}</Info>}
            {result.message && <Txt muted style={{ fontSize: 13 }}>{result.message}</Txt>}
          </View> : <View style={{ paddingTop: 16, gap: 12 }}><Txt muted style={{ fontSize: 14, lineHeight: 21 }}>{result.message ?? 'Прогноз пока недоступен.'}</Txt>{result.status === 'unavailable' && <Button secondary icon="refresh-outline" onPress={() => setRetry(value => value + 1)}>Попробовать ещё раз</Button>}</View>}
          <View style={{ marginTop: 12 }}><Txt muted style={{ fontSize: 12, lineHeight: 18 }}>Время остановок — ориентир для прогноза.{result?.updatedAt ? ` Обновлён в ${new Date(result.updatedAt).toLocaleTimeString('ru-RU', { timeZone: 'Asia/Tbilisi', hour: '2-digit', minute: '2-digit' })}.` : ''}</Txt><ExternalLink url="https://open-meteo.com/">Погода — Open-Meteo</ExternalLink></View>
        </View>

        <Title style={{ fontSize: 24, marginBottom: 12 }}>А где поедим?</Title>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}><Chip label="В кафе" icon="restaurant-outline" selected={meal === 'cafe'} onPress={() => setMeal('cafe')} /><Chip label="Еда с собой" icon="basket-outline" selected={meal === 'picnic'} onPress={() => setMeal('picnic')} /></View>
        <View style={{ borderWidth: 1, borderColor: colors.border, padding: 18, borderRadius: 20, marginBottom: 30 }}><View style={{ flexDirection: 'row', gap: 11, alignItems: 'center', marginBottom: 8 }}><Icon name={meal === 'cafe' ? 'restaurant-outline' : 'basket-outline'} color={colors.primary} /><Txt style={{ fontWeight: '700', fontSize: 18, flex: 1 }}>{foodTitle}</Txt></View>
          <Txt muted style={{ fontSize: 14, lineHeight: 21, marginBottom: 14 }}>{meal === 'cafe' ? 'Заложим около часа на обед. Выбери кафе на карте — там можно проверить меню и часы работы перед выездом.' : 'Заложим около 30–45 минут на перерыв. Возьми воду и перекус, а место для обеда выбери по условиям на месте.'}</Txt>
          {meal === 'cafe' ? <Button secondary icon="open-outline" onPress={openCafe}>Найти кафе в картах</Button> : <View style={{ flexDirection: 'row', gap: 7, alignItems: 'center' }}><Icon name="checkmark-circle-outline" size={18} color={colors.primary} /><Txt style={{ color: colors.primary, fontSize: 13 }}>Перерыв уже включён в план дня</Txt></View>}
          {linkError && <Txt muted style={{ fontSize: 13, marginTop: 10 }}>Не удалось открыть карты. Попробуй ещё раз.</Txt>}
        </View>

        <Title style={{ fontSize: 24, marginBottom: 8 }}>Как пройдёт день</Title>
        <Txt muted style={{ fontSize: 14, lineHeight: 21, marginBottom: 22 }}>Порядок остановок можно взять за основу.{ '\n' }Время — примерное, подстрой его под себя.</Txt>
        <TimelineStep icon="car-outline" title="Выезжаем из Тбилиси" subtitle="Утром, в удобное время" body={short ? 'Выбирай точку входа в лес и проверь подъезд перед поездкой.' : `Всего за рулём туда и обратно — примерно ${route.driveMinutes.map(value => (value / 60).toFixed(1).replace('.0', '').replace('.', ',')).join('–')} ч.`} />
        {stops.map((stop, index) => <React.Fragment key={`${stop.name}-${index}`}><TimelineStep icon={stop.kind === 'lake' ? 'water-outline' : stop.kind === 'forest' ? 'leaf-outline' : stop.kind === 'town' ? 'business-outline' : 'location-outline'} title={stop.name} subtitle={`≈ ${stop.durationMinutesEstimate} мин на остановку`} body={stop.text} link={placeSearchUrl(stop)} />{index === (meal === 'picnic' && stops.some(item => item.kind === 'lake') ? stops.length - 1 : 0) && <TimelineStep icon={meal === 'cafe' ? 'restaurant-outline' : 'basket-outline'} title={foodTitle} subtitle={meal === 'cafe' ? '≈ 1 час' : '≈ 30–45 мин'} body={meal === 'cafe' ? 'Конкретное заведение выбираем в картах. Заезд и часы работы стоит проверить заранее.' : 'Неспешный перерыв с едой и водой, которые взяли с собой.'} />}</React.Fragment>)}
        <TimelineStep icon="home-outline" title="Возвращаемся домой" subtitle={`${hoursLabel(duration)} на всю поездку`} last />

        <Info icon="trail-sign-outline">Точки показывают места в целом. Парковки и входы ещё требуют проверки — открываем поиск места, чтобы выбрать подходящий подъезд.</Info>
        <View style={{ marginTop: 24, gap: 9 }}><Title style={{ fontSize: 22 }}>Перед поездкой</Title><Txt muted style={{ fontSize: 14, lineHeight: 22 }}>{route.weatherNote}</Txt><Txt style={{ fontSize: 15, fontWeight: '600', marginTop: 3 }}>Базовый бюджет: ≈ {route.budgetGel.join('–')} ₾ / человек</Txt><Txt muted style={{ fontSize: 13, lineHeight: 20 }}>{route.budgetBasis} Это редакционная оценка; выбранное кафе может изменить сумму.</Txt></View>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: credits }} onPress={() => setCredits(value => !value)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 20, marginTop: 16, borderTopWidth: 1, borderTopColor: colors.border }}><Icon name="information-circle-outline" size={21} color={colors.muted} /><Txt style={{ flex: 1, fontSize: 14, fontWeight: '500' }}>Источники и фотографии</Txt><Icon name={credits ? 'chevron-up' : 'chevron-down'} size={17} color={colors.muted} /></Pressable>
        {credits && <View style={{ paddingBottom: 10 }}><Txt muted style={{ fontSize: 13, lineHeight: 20 }}>Идея поездки собрана по открытым источникам. Остановки не проверены на месте. Источники просмотрены {route.verifiedAt}.</Txt>{route.sources.map(source => <ExternalLink key={source.source} url={source.source}>{source.text}</ExternalLink>)}<View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 14, marginTop: 8 }}><Txt muted style={{ fontSize: 13, lineHeight: 20 }}>{route.photo.credit}. Фото кадрируется для отображения; условия лицензии распространяются на изображение.</Txt><ExternalLink url={route.photo.sourceUrl}>Оригинал на Wikimedia Commons</ExternalLink><ExternalLink url={route.photo.licenseUrl}>Лицензия {route.photo.license}</ExternalLink></View></View>}
      </View>
    </ScrollView>
    <View style={{ paddingHorizontal: 18, paddingTop: 12, paddingBottom: Math.max(insets.bottom, 12), borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
      <Button secondary icon={favorite ? 'heart' : 'heart-outline'} style={{ width: 58, paddingHorizontal: 12 }} accessibilityLabel={favorite ? 'Удалить из сохранённого' : 'Сохранить маршрут'} disabled={!storageReady} onPress={() => toggleSaved(route.id)}>{null}</Button>
      <Button icon="map-outline" style={{ flex: 1 }} onPress={() => router.push({ pathname: '/map', params: { route: route.id, short: short ? '1' : undefined } })}>Посмотреть карту</Button>
    </View>
    <CalendarSheet visible={calendar} onClose={() => setCalendar(false)} />
  </View>;
}
