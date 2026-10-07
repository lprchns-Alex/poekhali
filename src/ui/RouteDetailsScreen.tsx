import React, { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { foodSearchUrl, formatDate, getStopDate, getTripEndDate, getTripHours, hoursLabel, placeSearchUrl, ROUTES } from '../model';
import { routePhoto } from '../photos';
import { weatherAdvice, weatherSummary } from '../services/weather';
import { useApp } from './AppProvider';
import { DotWeather } from './InstrumentGraphics';
import { Button, Chip, ExternalLink, Icon, IconButton, IconName, Info, Photo, Title, Txt } from './primitives';
import { CalendarSheet } from './sheets';
import { useForecast } from './RouteCard';
import { routePanel } from './theme';
import { EventsSection } from './EventsSection';

const weatherInk = '#151610';
const weatherMuted = '#53513B';

function SectionLabel({ children }: { children: React.ReactNode }) {
  const { colors } = useApp();
  return <Txt style={{ color: colors.muted, fontSize: 12, lineHeight: 18, letterSpacing: 1.2, fontWeight: '700', marginBottom: 12 }}>{children}</Txt>;
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  const { colors } = useApp();
  return <View style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: colors.surface, minWidth: 0 }}>
    <Txt muted style={{ fontSize: 12, lineHeight: 18, marginBottom: 14 }}>{label}</Txt>
    <Txt numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65} style={{ fontSize: 38, lineHeight: 44, letterSpacing: -1.8, fontWeight: '400', fontVariant: ['tabular-nums'] }}>{value}</Txt>
    <Txt muted style={{ fontSize: 12, lineHeight: 18, marginTop: 5 }}>{note}</Txt>
  </View>;
}

function TimelineStep({ icon, title, subtitle, body, last = false, link }: { icon: IconName; title: string; subtitle?: string; body?: string; last?: boolean; link?: string }) {
  const { colors } = useApp();
  return <View style={{ flexDirection: 'row', gap: 13 }}>
    <View style={{ width: 28, alignItems: 'center' }}>
      <View style={{ height: 30, justifyContent: 'center' }}><Icon name={icon} size={21} /></View>
      {!last && <View style={{ flex: 1, width: 1, backgroundColor: colors.text, opacity: 0.25, minHeight: 20, marginVertical: 6 }} />}
    </View>
    <View style={{ flex: 1, paddingBottom: 22, paddingTop: 3 }}>
      <Txt style={{ fontWeight: '700', fontSize: 18, lineHeight: 22, letterSpacing: -0.4 }}>{title}</Txt>
      {subtitle && <Txt muted style={{ fontSize: 13, lineHeight: 19, marginTop: 4 }}>{subtitle}</Txt>}
      {body && <Txt style={{ fontSize: 15, lineHeight: 22, marginTop: 9 }}>{body}</Txt>}
      {link && <ExternalLink url={link}>Найти место в картах</ExternalLink>}
    </View>
  </View>;
}

function ForecastPanel({ result, onCalendar, onRetry, endDate }: { endDate: string; result: ReturnType<typeof useForecast>; onCalendar: () => void; onRetry: () => void }) {
  const { date } = useApp();
  const primary = result?.status === 'ready' ? result.points[0] : null;
  const advice = result ? weatherAdvice(result) : null;
  return <View style={{ marginBottom: 28 }}>
    <View style={{ backgroundColor: '#FFDF55', padding: 18, borderRadius: 12 }}>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
        <View style={{ flex: 1, paddingTop: 3 }}>
          <Title style={{ color: weatherInk, fontSize: 26, lineHeight: 29, letterSpacing: -0.8 }}>Погода{ '\n' }по пути</Title>
          <Txt style={{ color: weatherMuted, fontSize: 14, lineHeight: 20, marginTop: 5 }}>{formatDate(date, true)}{endDate !== date ? ` — ${formatDate(endDate, true)}` : ''}</Txt>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Изменить дату поездки" onPress={onCalendar} style={({ pressed }) => ({ width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: 'rgba(21,22,16,0.07)', opacity: pressed ? 0.55 : 1 })}><Icon name="calendar-outline" color={weatherInk} size={22} /></Pressable>
      </View>
      {!result ? <View style={{ minHeight: 190, alignItems: 'center', justifyContent: 'center', gap: 12 }}><ActivityIndicator color={weatherInk} /><Txt style={{ color: weatherMuted, fontSize: 14 }}>Узнаём прогноз по остановкам…</Txt></View> : primary ? <>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 24, marginBottom: 14 }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Txt numberOfLines={1} adjustsFontSizeToFit style={{ color: weatherInk, fontSize: 76, lineHeight: 82, fontWeight: '400', letterSpacing: -5, fontVariant: ['tabular-nums'] }}>{primary.temperatureC === null ? '—' : `${Math.round(primary.temperatureC)}°`}</Txt>
            <Txt style={{ color: weatherInk, fontSize: 16, lineHeight: 21, fontWeight: '600', marginTop: 2 }}>{primary.stopName}</Txt>
            <Txt style={{ color: weatherMuted, fontSize: 12, lineHeight: 18, marginTop: 4 }}>{formatDate(primary.date)} · {String(primary.hour).padStart(2, '0')}:00</Txt>
          </View>
          <DotWeather code={primary.code} size={112} color={weatherInk} />
        </View>
        <Txt style={{ color: weatherInk, fontSize: 15, lineHeight: 21, marginBottom: 17 }}>{weatherSummary(primary)}</Txt>
        <View style={{ flexDirection: 'row', gap: 16, paddingTop: 14, paddingBottom: 17, borderTopWidth: 1, borderTopColor: 'rgba(21,22,16,0.25)' }}>
          <View style={{ flex: 1, gap: 4 }}><Icon name="water-outline" color={weatherInk} size={19} /><Txt style={{ color: weatherInk, fontWeight: '700', fontSize: 18, lineHeight: 23 }}>{primary.rainProbability === null ? '—' : `${Math.round(primary.rainProbability)}%`}</Txt><Txt style={{ color: weatherMuted, fontSize: 12, lineHeight: 18 }}>{primary.rainProbability === null ? 'Нет данных о дожде' : 'Вероятность дождя'}</Txt></View>
          <View style={{ flex: 1, gap: 4 }}><Icon name="flag-outline" color={weatherInk} size={19} /><Txt style={{ color: weatherInk, fontWeight: '700', fontSize: 18, lineHeight: 23 }}>{primary.windKmh === null ? '—' : `${Math.round(primary.windKmh)} км/ч`}</Txt><Txt style={{ color: weatherMuted, fontSize: 12, lineHeight: 18 }}>{primary.windKmh === null ? 'Нет данных о ветре' : 'Скорость ветра'}</Txt></View>
        </View>
        {result.points.slice(1).map((point, index) => <View key={`${point.stopName}-${index}`} style={{ paddingTop: 15, paddingBottom: 8, borderTopWidth: 1, borderTopColor: 'rgba(21,22,16,0.25)' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ flex: 1 }}><Txt style={{ color: weatherInk, fontSize: 16, lineHeight: 21, fontWeight: '600' }}>{point.stopName}</Txt><Txt style={{ color: weatherMuted, fontSize: 12, lineHeight: 18, marginTop: 3 }}>{formatDate(point.date)} · {String(point.hour).padStart(2, '0')}:00 · {weatherSummary(point)}</Txt></View>
            <DotWeather code={point.code} size={42} color={weatherInk} />
            <Txt style={{ color: weatherInk, fontSize: 34, lineHeight: 39, letterSpacing: -1.5, fontVariant: ['tabular-nums'] }}>{point.temperatureC === null ? '—' : `${Math.round(point.temperatureC)}°`}</Txt>
          </View>
          <Txt style={{ color: weatherMuted, fontSize: 12, lineHeight: 19, marginTop: 8 }}>{point.rainProbability === null ? 'Дождь: нет данных' : `Дождь ${Math.round(point.rainProbability)}%`} · {point.windKmh === null ? 'Ветер: нет данных' : `Ветер ${Math.round(point.windKmh)} км/ч`}</Txt>
        </View>)}
        {result.message && <Txt style={{ color: weatherMuted, fontSize: 13, lineHeight: 19, marginTop: 12 }}>{result.message}</Txt>}
      </> : <View style={{ paddingVertical: 22, gap: 18 }}>
        <Txt style={{ color: weatherInk, fontSize: 16, lineHeight: 23 }}>{result.message ?? 'Прогноз пока недоступен.'}</Txt>
        {result.status === 'unavailable' && <Pressable accessibilityRole="button" onPress={onRetry} style={({ pressed }) => ({ minHeight: 48, borderWidth: 1, borderColor: weatherInk, borderRadius: 10, padding: 12, flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}><Icon name="refresh-outline" color={weatherInk} size={19} /><Txt style={{ color: weatherInk, fontSize: 16, fontWeight: '600' }}>Попробовать ещё раз</Txt></Pressable>}
      </View>}
    </View>
    {advice && <View style={{ marginTop: 10 }}><Info warm icon="rainy-outline">{advice}</Info></View>}
    <Txt muted style={{ fontSize: 12, lineHeight: 18, marginTop: 12 }}>Время остановок — ориентир для прогноза.{result?.updatedAt ? ` Обновлён в ${new Date(result.updatedAt).toLocaleTimeString('ru-RU', { timeZone: 'Asia/Tbilisi', hour: '2-digit', minute: '2-digit' })}.` : ''}</Txt>
    <ExternalLink url="https://open-meteo.com/">Погода — Open-Meteo</ExternalLink>
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
  const stops = short ? route.stops.slice(0, 1) : route.stops;
  const favorite = saved.includes(route.id);
  const duration = getTripHours(route, meal, short);
  const panel = routePanel(route.id);
  const number = String(ROUTES.findIndex(item => item.id === route.id) + 1).padStart(2, '0');
  const durationValue = duration.map(value => String(value).replace('.', ',')).join('–');
  const foodTitle = meal === 'picnic' ? (short ? 'Перерыв с едой с собой' : route.preferredMeal === 'picnic' ? route.mealLabel : 'Обед с собой') : route.preferredMeal === 'cafe' ? route.mealLabel : 'Обед в кафе по пути';
  const openCafe = () => {
    setLinkError(false);
    const url = short ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('restaurants Sabaduri Georgia')}` : foodSearchUrl(route);
    Linking.openURL(url).catch(() => setLinkError(true));
  };
  return <View style={{ flex: 1, backgroundColor: colors.background }}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: Math.max(insets.top, 8), paddingHorizontal: 14, paddingBottom: 22 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <IconButton name="arrow-back" label="Назад к маршрутам" onPress={() => router.canGoBack() ? router.back() : router.replace('/')} />
        <Txt style={{ fontSize: 13, fontWeight: '700', letterSpacing: 1 }}>ПОЕХАЛИ / {number}</Txt>
        <IconButton name={favorite ? 'heart' : 'heart-outline'} label={favorite ? 'Удалить из сохранённого' : 'Сохранить маршрут'} active={favorite} disabled={!storageReady} onPress={() => toggleSaved(route.id)} />
      </View>
      <View style={{ backgroundColor: panel.background, borderRadius: 12, padding: 18, paddingTop: 21, paddingBottom: 22 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 32 }}><Txt style={{ color: panel.muted, fontSize: 12, lineHeight: 18, fontWeight: '600', letterSpacing: 1 }}>{route.days === 2 ? 'ДВА ДНЯ / ОДНА НОЧЬ' : 'ОДИН ДЕНЬ В ГРУЗИИ'}</Txt></View>
        <Title style={{ color: panel.ink, fontSize: 38, lineHeight: 40, letterSpacing: -1.6, marginBottom: 15 }}>{short ? 'День в Сабадурском лесу' : route.title}</Title>
        <Txt style={{ color: panel.muted, fontSize: 16, lineHeight: 22 }}>{short ? 'Сабадури · только лес' : route.subtitle}</Txt>
        <View style={{ marginTop: 24, paddingTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(21,22,16,0.27)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}><Txt style={{ color: panel.ink, fontSize: 14, lineHeight: 20 }}>Старт из Тбилиси</Txt><Txt style={{ color: panel.ink, fontSize: 14, lineHeight: 20 }}>{stops.length} {stops.length === 1 ? 'остановка' : stops.length < 5 ? 'остановки' : 'остановок'}</Txt></View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, marginBottom: 21 }}><Stat value={durationValue} label="ПРИМЕРНО ЧАСОВ" note={route.days === 2 ? 'включая ночёвку и еду' : 'с дорогой и обедом'} /><Stat value={short ? 'Меньше' : `${route.walkingKm.join('–')} км`} label="ПЕШКОМ" note={short ? 'короткая прогулка' : route.difficulty.toLowerCase()} /></View>
      <View style={{ paddingHorizontal: 4 }}>
        <Txt style={{ fontSize: 16, lineHeight: 24, marginBottom: 23 }}>{short ? 'Прогуляться среди буков и вернуться в город пораньше.' : route.description}</Txt>
        {route.shortVariant && <View style={{ marginBottom: 25 }}><SectionLabel>ТВОЙ ТЕМП</SectionLabel><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}><Chip label="Лес + озеро" selected={!short} onPress={() => setShort(false)} /><Chip label="Только лес" selected={short} onPress={() => setShort(true)} /></View>{short && <Txt muted style={{ fontSize: 14, lineHeight: 21, marginTop: 10 }}>{route.shortVariant.description}</Txt>}</View>}
      </View>
      <ForecastPanel endDate={getTripEndDate(date, route)} result={result} onCalendar={() => setCalendar(true)} onRetry={() => setRetry(value => value + 1)} />
      <View style={{ marginBottom: 28 }}><Photo source={routePhoto(route)} caption={route.days === 2 ? (route.id === 'kakheti-weekend' ? 'Сигнахи' : 'Ананури') : route.subtitle} height={150} style={{ borderRadius: 12 }} /><Txt muted style={{ fontSize: 12, lineHeight: 18, marginTop: 7, paddingHorizontal: 4 }}>{short ? 'На фото — Сиони, часть полного маршрута.' : route.days === 2 ? (route.id === 'kakheti-weekend' ? 'На фото — Сигнахи, второй день поездки.' : 'На фото — Ананури, первый день поездки.') : route.subtitle}</Txt></View>
      <View style={{ paddingHorizontal: 4 }}>
        <SectionLabel>ПЕРЕРЫВ НА ОБЕД</SectionLabel>
        <Title style={{ fontSize: 29, lineHeight: 33, marginBottom: 15 }}>Где поедим?</Title>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}><Chip label="В кафе" icon="restaurant-outline" selected={meal === 'cafe'} onPress={() => setMeal('cafe')} /><Chip label="Еда с собой" icon="basket-outline" selected={meal === 'picnic'} onPress={() => setMeal('picnic')} /></View>
        <View style={{ backgroundColor: colors.surface, padding: 16, borderRadius: 12, marginBottom: 32 }}>
          <Txt style={{ fontWeight: '700', fontSize: 20, lineHeight: 24, letterSpacing: -0.5, marginBottom: 10 }}>{foodTitle}</Txt>
          <Txt style={{ fontSize: 15, lineHeight: 22, marginBottom: 16 }}>{meal === 'cafe' ? `Заложим около часа на обед${route.days === 2 ? ' каждый день' : ''}. Выбери кафе на карте — там можно проверить меню и часы работы перед выездом.` : 'Заложим около 30–45 минут на перерыв. Возьми воду и перекус, а место для обеда выбери по условиям на месте.'}</Txt>
          {meal === 'cafe' ? <Button icon="open-outline" onPress={openCafe}>Найти кафе в картах</Button> : <View style={{ flexDirection: 'row', gap: 7, alignItems: 'center' }}><Icon name="checkmark" size={18} /><Txt style={{ fontSize: 13, lineHeight: 19, flex: 1 }}>{route.days === 2 ? 'Обед каждого дня включён в расчёт времени' : 'Перерыв уже включён в план дня'}</Txt></View>}
          {linkError && <Txt muted style={{ fontSize: 13, marginTop: 10 }}>Не удалось открыть карты. Попробуй ещё раз.</Txt>}
        </View>
        <SectionLabel>ПЛАН ПОЕЗДКИ</SectionLabel>
        <Title style={{ fontSize: 29, lineHeight: 33, marginBottom: 10 }}>{route.days === 2 ? 'Два дня без спешки' : 'Как пройдёт день'}</Title>
        <Txt muted style={{ fontSize: 14, lineHeight: 21, marginBottom: 24 }}>Порядок остановок можно взять за основу. Время — примерное, подстрой его под себя.</Txt>
        <TimelineStep icon="car-outline" title="Выезжаем из Тбилиси" subtitle="Утром, в удобное время" body={short ? 'Выбирай точку входа в лес и проверь подъезд перед поездкой.' : `Всего за рулём туда и обратно — примерно ${route.driveMinutes.map(value => (value / 60).toFixed(1).replace('.0', '').replace('.', ',')).join('–')} ч.`} />
        {([1, 2] as const).filter(day => day <= route.days).map(day => {
          const dayStops = stops.filter(stop => stop.day === day);
          const mealIndex = meal === 'picnic' && dayStops.some(stop => stop.kind === 'lake') ? dayStops.length - 1 : 0;
          return <React.Fragment key={day}>
            {route.days === 2 && <SectionLabel>ДЕНЬ {day} / {formatDate(getStopDate(date, { day })).toLocaleUpperCase('ru-RU')}</SectionLabel>}
            {dayStops.map((stop, index) => <React.Fragment key={`${stop.name}-${index}`}>
              <TimelineStep icon={stop.kind === 'lake' ? 'water-outline' : stop.kind === 'forest' ? 'leaf-outline' : stop.kind === 'town' ? 'business-outline' : 'location-outline'} title={stop.name} subtitle={`≈ ${stop.durationMinutesEstimate} мин на остановку`} body={stop.text} link={placeSearchUrl(stop)} />
              {index === mealIndex && <TimelineStep icon={meal === 'cafe' ? 'restaurant-outline' : 'basket-outline'} title={route.days === 2 ? (meal === 'cafe' ? 'Обед в кафе' : 'Обед с собой') : foodTitle} subtitle={meal === 'cafe' ? '≈ 1 час' : '≈ 30–45 мин'} body={meal === 'cafe' ? 'Конкретное заведение выбираем в картах. Заезд и часы работы стоит проверить заранее.' : 'Неспешный перерыв с едой и водой, которые взяли с собой.'} />}
            </React.Fragment>)}
            {day === 1 && route.overnight && <TimelineStep icon="bed-outline" title={`Ночуем: ${route.overnight.location}`} subtitle="1 ночь · жильё бронируется отдельно" body={route.overnight.note} link={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`hotels ${route.overnight.location} Georgia`)}`} />}
          </React.Fragment>;
        })}
        <TimelineStep icon="home-outline" title="Возвращаемся домой" subtitle={`${hoursLabel(duration)} на всю поездку`} last />
        <Info icon="trail-sign-outline">Точки показывают места в целом. Парковки и входы ещё требуют проверки — открываем поиск места, чтобы выбрать подходящий подъезд.</Info>
        <View style={{ marginTop: 28 }}><EventsSection route={route} /></View>
        <View style={{ marginTop: 28 }}>
          <SectionLabel>ПЕРЕД ПОЕЗДКОЙ</SectionLabel>
          <Txt style={{ fontSize: 15, lineHeight: 23, marginBottom: 20 }}>{route.weatherNote}</Txt>
          <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 17 }}>
            <Txt muted style={{ fontSize: 12, lineHeight: 18 }}>БАЗОВЫЙ БЮДЖЕТ / ЧЕЛОВЕК</Txt>
            <Txt style={{ fontSize: 37, lineHeight: 44, letterSpacing: -1.5, marginVertical: 8 }}>≈ {route.budgetGel.join('–')} ₾</Txt>
            <Txt muted style={{ fontSize: 13, lineHeight: 20 }}>{route.budgetBasis} Это редакционная оценка; выбранное кафе может изменить сумму.</Txt>
          </View>
        </View>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: credits }} onPress={() => setCredits(value => !value)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 58, paddingVertical: 18, marginTop: 23, borderTopWidth: 1, borderTopColor: colors.border }}><Txt style={{ flex: 1, fontSize: 14, fontWeight: '600' }}>Источники и фотографии</Txt><Icon name={credits ? 'remove' : 'add'} size={20} /></Pressable>
        {credits && <View style={{ paddingBottom: 10 }}><Txt muted style={{ fontSize: 13, lineHeight: 20 }}>Идея поездки собрана по открытым источникам. Остановки не проверены на месте. Источники просмотрены {route.verifiedAt}.</Txt>{route.sources.map(source => <ExternalLink key={source.source} url={source.source}>{source.text}</ExternalLink>)}<View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 14, marginTop: 8 }}><Txt muted style={{ fontSize: 13, lineHeight: 20 }}>{route.photo.credit}. Фото кадрируется для отображения; условия лицензии распространяются на изображение.</Txt><ExternalLink url={route.photo.sourceUrl}>Оригинал на Wikimedia Commons</ExternalLink><ExternalLink url={route.photo.licenseUrl}>Лицензия {route.photo.license}</ExternalLink></View></View>}
      </View>
    </ScrollView>
    <View style={{ paddingHorizontal: 14, paddingTop: 10, paddingBottom: Math.max(insets.bottom, 10), borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
      <Button secondary icon={favorite ? 'heart' : 'heart-outline'} style={{ width: 54, paddingHorizontal: 12 }} accessibilityLabel={favorite ? 'Удалить из сохранённого' : 'Сохранить маршрут'} disabled={!storageReady} onPress={() => toggleSaved(route.id)}>{null}</Button>
      <Button icon="map-outline" style={{ flex: 1 }} accessibilityLabel="Посмотреть маршрут на карте" onPress={() => router.push({ pathname: '/map', params: { route: route.id, short: short ? '1' : undefined } })}>Открыть карту</Button>
    </View>
    <CalendarSheet tripDays={route.days} visible={calendar} onClose={() => setCalendar(false)} />
  </View>;
}
