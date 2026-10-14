import React, { useState } from 'react';
import { Keyboard, Pressable, ScrollView, TextInput, useWindowDimensions, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addDays, DEFAULT_FILTERS, filterRoutes, formatDate, getTripHours, MOODS, ROUTES } from '../model';
import { RouteMap } from '../services/RouteMap';
import { useApp } from './AppProvider';
import { Button, Chip, Icon, Info, Title, Txt } from './primitives';
import { CalendarSheet, FiltersSheet } from './sheets';
import { RouteCard } from './RouteCard';
import { routePanel } from './theme';
import { EventsSection } from './EventsSection';

export function AppHeader() {
  const { colors } = useApp();
  return <View style={{ minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}><View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}><Icon name="navigate" size={18} color="#171A15" /></View><Txt style={{ fontSize: 23, lineHeight: 30, letterSpacing: -1.1, fontWeight: '600' }}>поехали.</Txt></View>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.surface, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 99 }}><Icon name="location-outline" size={14} color={colors.muted} /><Txt muted style={{ fontSize: 12, lineHeight: 18 }}>Тбилиси</Txt></View>
  </View>;
}

function DateButton({ onPress, departureOnly = false, inverse = false }: { onPress: () => void; departureOnly?: boolean; inverse?: boolean }) {
  const { date, colors, filters } = useApp();
  return <Pressable accessibilityRole="button" accessibilityLabel={`${departureOnly ? 'Дата выезда' : 'Дата поездки'}: ${formatDate(date, true)}. Изменить дату`} onPress={onPress} style={({ pressed }) => ({ flex: 1, minWidth: 0, minHeight: 52, borderRadius: 20, backgroundColor: inverse ? '#2B3325' : colors.surface, paddingVertical: 10, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 8, opacity: pressed ? 0.6 : 1 })}><Icon name="calendar-outline" size={18} color={inverse ? '#C5F933' : colors.text} /><Txt style={{ color: inverse ? '#F5F7EF' : colors.text, fontSize: 13, lineHeight: 19, flex: 1 }}>{formatDate(date)}{!departureOnly && filters.days === 2 ? ` — ${formatDate(addDays(date, 1))}` : ''}</Txt><Icon name="chevron-down" size={14} color={inverse ? '#B8C2AE' : colors.muted} /></Pressable>;
}

export function ExploreScreen() {
  const { colors, query, setQuery, category, setCategory, filters, setFilters, storageError, meal } = useApp();
  const [sheet, setSheet] = useState<'calendar' | 'filters' | null>(null);
  const [focused, setFocused] = useState(false);
  const [content, setContent] = useState<'routes' | 'events'>('routes');
  const { width } = useWindowDimensions();
  const compact = width < 360;
  const routes = filterRoutes(filters, query, meal);
  const activeCount = Number(filters.days !== DEFAULT_FILTERS.days) + Number(filters.maxHours < (filters.days === 2 ? 48 : 12)) + Number(filters.easyOnly) + Number(filters.mood !== 'Все');
  const moodIcons = ['apps-outline', 'leaf-outline', 'water-outline', 'trail-sign-outline', 'business-outline'] as const;
  return <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.background }}>
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={{ paddingBottom: 24 }}>
      <AppHeader />
      <View style={{ paddingHorizontal: 20 }}>
        <View style={{ paddingTop: 23, paddingBottom: 24 }}>
          <Txt muted style={{ fontSize: 11, lineHeight: 17, letterSpacing: 1.4, fontWeight: '600', marginBottom: 10 }}>МАЛЕНЬКОЕ ПУТЕШЕСТВИЕ</Txt>
          <Title style={{ fontSize: compact ? 47 : 54, lineHeight: compact ? 49 : 55, fontWeight: '400', letterSpacing: -2.5 }}>Куда{ '\n' }поедем?</Title>
          <Txt muted style={{ fontSize: 14, lineHeight: 21, marginTop: 13 }}>{filters.days === 2 ? 'Два дня, одна ночь. И целая Грузия рядом.' : 'Из Тбилиси — за новыми впечатлениями.'}</Txt>
        </View>
        <View style={{ backgroundColor: '#171C15', borderRadius: 28, padding: 14, gap: 12 }}>
          <View style={{ minHeight: 54, flexDirection: 'row', alignItems: 'center', borderRadius: 20, borderWidth: 1, borderColor: focused ? '#C5F933' : '#3D4634', paddingLeft: 13 }}>
            <Icon name="search-outline" size={21} color="#C5F933" />
            <TextInput accessibilityLabel={content === 'events' ? 'Поиск события или занятия' : 'Поиск места или маршрута'} placeholder={content === 'events' ? 'Событие или занятие' : 'Куда хочется поехать?'} placeholderTextColor="#B8C2AE" value={query} onChangeText={setQuery} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onSubmitEditing={Keyboard.dismiss} returnKeyType="search" autoCorrect={false} style={{ flex: 1, minWidth: 0, minHeight: 54, paddingVertical: 13, paddingHorizontal: 10, fontSize: 15, color: '#F7FAF1' }} />
            {query.length > 0 && <Pressable accessibilityRole="button" accessibilityLabel="Очистить поиск" onPress={() => setQuery('')} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}><Icon name="close" color="#F7FAF1" size={20} /></Pressable>}
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <DateButton inverse onPress={() => { Keyboard.dismiss(); setSheet('calendar'); }} />
            <Pressable accessibilityRole="button" accessibilityLabel={`Открыть фильтры${activeCount ? `, активно ${activeCount}` : ''}`} onPress={() => { Keyboard.dismiss(); setSheet('filters'); }} style={({ pressed }) => ({ minHeight: 52, minWidth: 52, borderRadius: 20, backgroundColor: colors.accent, paddingHorizontal: 13, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}><Icon name="options-outline" size={22} color="#171A15" />{activeCount > 0 && <Txt style={{ color: '#171A15', fontSize: 13, fontWeight: '600' }}>{activeCount}</Txt>}</Pressable>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 4, padding: 4, borderRadius: 999, backgroundColor: colors.soft, marginTop: 22 }}>{([{ key: 'routes', label: 'Маршруты' }, { key: 'events', label: 'События и занятия' }] as const).map(item => <Pressable key={item.key} accessibilityRole="button" accessibilityState={{ selected: content === item.key }} onPress={() => setContent(item.key)} style={({ pressed }) => ({ flex: item.key === 'events' ? 1.35 : 1, minHeight: 48, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 9, borderRadius: 999, backgroundColor: content === item.key ? colors.surface : 'transparent', opacity: pressed ? 0.7 : 1 })}><Txt style={{ color: content === item.key ? colors.text : colors.muted, fontWeight: '600', fontSize: 13, lineHeight: 18, textAlign: 'center' }}>{item.label}</Txt></Pressable>)}</View>
      </View>
      {content === 'routes' ? <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingTop: 18, paddingBottom: 4 }}>{MOODS.map((mood, index) => <Chip key={mood} label={mood} selected={category === mood} icon={moodIcons[index]} onPress={() => setCategory(mood)} small />)}</ScrollView>
      <View style={{ paddingHorizontal: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingTop: 22, paddingBottom: 14 }}><Title style={{ flex: 1, fontSize: 23, lineHeight: 28, letterSpacing: -0.7 }}>{filters.days === 2 ? 'На два дня' : filters.maxHours < 12 ? `До ${filters.maxHours} часов` : 'Идеи на день'}</Title><View style={{ borderRadius: 99, backgroundColor: colors.soft, minWidth: 34, paddingHorizontal: 10, paddingVertical: 4 }}><Txt muted style={{ fontSize: 12, textAlign: 'center' }}>{routes.length}</Txt></View></View>
        {storageError && <View style={{ marginBottom: 12 }}><Info warm>{storageError}</Info></View>}
        {routes.map(route => <RouteCard key={route.id} route={route} />)}
        {routes.length === 0 && <View style={{ padding: 20, backgroundColor: colors.surface, borderRadius: 28, paddingVertical: 28, gap: 15 }}><Title>Пока не нашлось</Title><Txt muted>Попробуй другое название или дай поездке чуть больше времени.</Txt><Button onPress={() => { setFilters(DEFAULT_FILTERS); setQuery(''); }}>Все маршруты</Button></View>}
        {routes.length > 0 && <Txt muted style={{ fontSize: 11, lineHeight: 17, paddingTop: 4 }}>Время и расстояния — ориентиры.{ '\n' }Подробности и источники — внутри маршрута.</Txt>}
      </View>
      </> : <View style={{ padding: 20 }}><EventsSection /></View>}
    </ScrollView>
    <FiltersSheet visible={sheet === 'filters'} onClose={() => setSheet(null)} />
    <CalendarSheet visible={sheet === 'calendar'} onClose={() => setSheet(null)} />
  </SafeAreaView>;
}

export function SavedScreen() {
  const { colors, saved, storageReady, storageError } = useApp();
  const routes = ROUTES.filter(route => saved.includes(route.id));
  const [calendar, setCalendar] = useState(false);
  return <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.background }}><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
    <AppHeader />
    <View style={{ paddingHorizontal: 20, paddingTop: 23, paddingBottom: 26 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginBottom: 18 }}><View style={{ flex: 1 }}><Title style={{ fontSize: 40, lineHeight: 43, fontWeight: '400', letterSpacing: -1.6 }}>Мои планы.</Title><Txt muted style={{ fontSize: 13, marginTop: 9 }}>Идеи на следующий выходной</Txt></View><Txt style={{ fontSize: 58, lineHeight: 62, letterSpacing: -3, color: colors.muted }}>{String(routes.length).padStart(2, '0')}</Txt></View>
      {routes.length > 0 && <><Txt muted style={{ fontSize: 12, marginTop: 4 }}>ДАТА ВЫЕЗДА</Txt><DateButton departureOnly onPress={() => setCalendar(true)} /></>}
    </View>
    <View style={{ paddingHorizontal: 20 }}>
      {storageError && <View style={{ marginBottom: 12 }}><Info warm>{storageError}</Info></View>}
      {!storageReady ? <Txt muted>Читаем сохранённое…</Txt> : routes.length ? routes.map(route => <RouteCard key={route.id} route={route} />) : <View style={{ backgroundColor: colors.accent, padding: 22, borderRadius: 28, gap: 18, minHeight: 285 }}><Icon name="heart-outline" size={42} color="#171813" /><Title style={{ fontSize: 32, lineHeight: 34, color: '#171813' }}>Хорошие планы{ '\n' }не теряются.</Title><Txt style={{ color: '#51491D', fontSize: 15 }}>Нажми на сердечко у маршрута — и он останется здесь.</Txt><Button onPress={() => router.navigate('/')}>Выбрать маршрут</Button></View>}
    </View>
  </ScrollView><CalendarSheet tripDays={1} visible={calendar} onClose={() => setCalendar(false)} /></SafeAreaView>;
}

export function MapScreen() {
  const { colors, isDark, meal } = useApp();
  const [mapHeight, setMapHeight] = useState(260);
  const { route: selectedRoute, short } = useLocalSearchParams<{ route?: string; short?: string }>();
  const selectedId = selectedRoute && ROUTES.some(route => route.id === selectedRoute) ? selectedRoute : ROUTES[0].id;
  const setSelectedId = (id: string) => router.setParams({ route: id, short: id === selectedId ? short : undefined });
  const mapRoutes = ROUTES.map(route => short === '1' && route.id === selectedId && route.shortVariant ? { ...route, title: 'День в Сабадурском лесу', subtitle: 'Сабадури · только лес', stops: route.stops.slice(0, 1), durationHours: getTripHours(route, meal, true) } : { ...route, durationHours: getTripHours(route, meal) });
  const selected = mapRoutes.find(route => route.id === selectedId) ?? mapRoutes[0];
  const panel = routePanel(selected.id);
  return <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.background }}>
    <View style={{ paddingHorizontal: 20, paddingTop: 22, paddingBottom: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><View><Title style={{ fontSize: 36, lineHeight: 39, fontWeight: '400', letterSpacing: -1.4 }}>Карта поездок.</Title><Txt muted style={{ fontSize: 12, marginTop: 7 }}>ГРУЗИЯ / {String(ROUTES.length).padStart(2, '0')} МАРШРУТОВ</Txt></View></View>
    <View onLayout={event => setMapHeight(event.nativeEvent.layout.height)} style={{ flex: 1, minHeight: 200, overflow: 'hidden', marginHorizontal: 20, borderRadius: 28 }}><RouteMap routes={mapRoutes} selectedRouteId={selectedId} onSelectRoute={setSelectedId} dark={isDark} height={mapHeight} /></View>
    <View style={{ padding: 20, paddingTop: 12 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingBottom: 10 }}>{ROUTES.map((route, index) => <Chip key={route.id} label={`${String(index + 1).padStart(2, '0')} ${route.overnight?.location ?? route.stops[0].name}`} selected={route.id === selectedId} onPress={() => setSelectedId(route.id)} small />)}</ScrollView>
      <Pressable accessibilityRole="button" accessibilityLabel={`Открыть ${selected.title}`} onPress={() => router.push({ pathname: '/route/[id]', params: { id: selected.id, short } })} style={({ pressed }) => ({ backgroundColor: panel.background, borderRadius: 28, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, opacity: pressed ? 0.7 : 1 })}>
        <View style={{ flex: 1, gap: 7 }}><Txt style={{ fontSize: 23, lineHeight: 26, fontWeight: '600', letterSpacing: -0.6, color: panel.ink }}>{selected.title}</Txt><Txt style={{ color: panel.muted, fontSize: 12, lineHeight: 17 }}>{selected.days === 2 ? '2 дня · ' : ''}≈ {selected.durationHours.join('–')} ч · {selected.stops.length} {selected.stops.length === 1 ? 'остановка' : 'остановки'}</Txt></View><Icon name="arrow-forward" size={27} color={panel.ink} />
      </Pressable>
    </View>
  </SafeAreaView>;
}
