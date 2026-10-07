import React, { useState } from 'react';
import { Keyboard, Pressable, ScrollView, TextInput, useWindowDimensions, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addDays, DEFAULT_FILTERS, filterRoutes, formatDate, getTripHours, MOODS, ROUTES } from '../model';
import { RouteMap } from '../services/RouteMap';
import { useApp } from './AppProvider';
import { Button, Chip, Icon, IconButton, Info, Title, Txt } from './primitives';
import { Compass } from './InstrumentGraphics';
import { CalendarSheet, FiltersSheet } from './sheets';
import { RouteCard } from './RouteCard';
import { routePanel } from './theme';
import { EventsSection } from './EventsSection';

export function AppHeader() {
  const { colors, isDark, toggleTheme } = useApp();
  return <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 2, paddingBottom: 4 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}><Icon name="navigate" size={22} color={colors.text} /><Txt style={{ fontSize: 20, lineHeight: 26, letterSpacing: -0.8, fontWeight: '700' }}>поехали.</Txt></View>
    <IconButton name={isDark ? 'sunny-outline' : 'moon-outline'} label={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'} onPress={toggleTheme} />
  </View>;
}

function DateButton({ onPress, departureOnly = false }: { onPress: () => void; departureOnly?: boolean }) {
  const { date, colors, filters } = useApp();
  return <Pressable accessibilityRole="button" accessibilityLabel={`${departureOnly ? 'Дата выезда' : 'Дата поездки'}: ${formatDate(date, true)}. Изменить дату`} onPress={onPress} style={({ pressed }) => ({ flex: 1, minHeight: 52, borderBottomWidth: 1, borderColor: colors.border, paddingVertical: 10, paddingRight: 8, flexDirection: 'row', alignItems: 'center', gap: 8, opacity: pressed ? 0.6 : 1 })}><Txt style={{ color: colors.text, fontSize: !departureOnly && filters.days === 2 ? 18 : 23, lineHeight: 28, letterSpacing: -0.8, flex: 1 }}>{formatDate(date)}{!departureOnly && filters.days === 2 ? ` — ${formatDate(addDays(date, 1))}` : ''}</Txt><Icon name="chevron-down" size={18} color={colors.text} /></Pressable>;
}

export function ExploreScreen() {
  const { colors, query, setQuery, category, setCategory, filters, setFilters, storageError, meal } = useApp();
  const [sheet, setSheet] = useState<'calendar' | 'filters' | null>(null);
  const [focused, setFocused] = useState(false);
  const [content, setContent] = useState<'routes' | 'events'>('routes');
  const { width } = useWindowDimensions();
  const compact = width < 360;
  const routes = filterRoutes(filters, query, meal);
  const activeCount = Number(filters.maxHours < (filters.days === 2 ? 48 : 12)) + Number(filters.easyOnly) + Number(filters.mood !== 'Все');
  return <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.background }}>
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={{ paddingBottom: 24 }}>
      <AppHeader />
      <View style={{ paddingHorizontal: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 9, paddingBottom: 8 }}>
          <View style={{ flex: 1 }}><Title style={{ fontSize: compact || filters.days === 2 ? 30 : 39, lineHeight: compact || filters.days === 2 ? 33 : 39, letterSpacing: -1.8 }}>За город.{ '\n' }{filters.days === 2 ? 'На два дня.' : 'На день.'}</Title><Txt muted style={{ fontSize: 12, lineHeight: 18, marginTop: 12 }}>Грузия / из Тбилиси</Txt></View>
          <Compass size={compact ? 104 : 132} color={colors.text} mutedColor={colors.border} />
        </View>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 12 }}>
          {([1, 2] as const).map(days => <Chip key={days} label={days === 1 ? '1 день' : '2 дня'} selected={filters.days === days} onPress={() => setFilters({ ...filters, days, maxHours: days === 1 ? 12 : 48 })} />)}
          <Chip label="До 6 часов" selected={filters.days === 1 && filters.maxHours === 6} onPress={() => setFilters({ ...filters, days: 1, maxHours: 6 })} />
        </View>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 9, marginBottom: 8 }}>
          <DateButton onPress={() => { Keyboard.dismiss(); setSheet('calendar'); }} />
          <Pressable accessibilityRole="button" accessibilityLabel={`Открыть фильтры${activeCount ? `, активно ${activeCount}` : ''}`} onPress={() => { Keyboard.dismiss(); setSheet('filters'); }} style={({ pressed }) => ({ minHeight: 52, minWidth: 52, borderRadius: 8, backgroundColor: activeCount ? colors.accent : colors.surface, paddingHorizontal: compact ? 14 : 15, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}><Icon name="options-outline" size={22} color={activeCount ? '#171813' : colors.text} />{(!compact || activeCount > 0) && <Txt style={{ color: activeCount ? '#171813' : colors.text, fontSize: 14, fontWeight: '600' }}>{compact ? activeCount : `Фильтры${activeCount ? ` · ${activeCount}` : ''}`}</Txt>}</Pressable>
        </View>
        {content === 'routes' && <View style={{ minHeight: 52, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: focused ? colors.text : colors.border, backgroundColor: focused ? colors.surface : 'transparent', paddingLeft: 1 }}>
          <Icon name="search-outline" size={21} color={colors.text} />
          <TextInput accessibilityLabel="Поиск места или маршрута" placeholder="Найти место или маршрут" placeholderTextColor={colors.muted} value={query} onChangeText={setQuery} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onSubmitEditing={Keyboard.dismiss} returnKeyType="search" autoCorrect={false} style={{ flex: 1, minWidth: 0, minHeight: 52, paddingVertical: 13, paddingHorizontal: 10, fontSize: 16, color: colors.text }} />
          {query.length > 0 && <IconButton name="close" label="Очистить поиск" onPress={() => setQuery('')} />}
        </View>}
        <View style={{ flexDirection: 'row', gap: 24, marginTop: 10 }}>{([{ key: 'routes', label: 'Маршруты' }, { key: 'events', label: 'События и занятия' }] as const).map(item => <Pressable key={item.key} accessibilityRole="button" accessibilityState={{ selected: content === item.key }} onPress={() => setContent(item.key)} style={{ minHeight: 48, justifyContent: 'center', borderBottomWidth: 2, borderColor: content === item.key ? colors.text : 'transparent' }}><Txt style={{ fontWeight: content === item.key ? '700' : '400', fontSize: 15 }}>{item.label}</Txt></Pressable>)}</View>
      </View>
      {content === 'routes' ? <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 23, paddingTop: 5, paddingBottom: 2 }}>{MOODS.map(mood => <Pressable key={mood} accessibilityRole="button" accessibilityState={{ selected: category === mood }} onPress={() => setCategory(mood)} style={({ pressed }) => ({ minHeight: 48, justifyContent: 'center', borderBottomWidth: 2, borderColor: category === mood ? colors.text : 'transparent', opacity: pressed ? 0.6 : 1 })}><Txt style={{ fontSize: 14, fontWeight: category === mood ? '700' : '500', color: category === mood ? colors.text : colors.muted }}>{mood}</Txt></Pressable>)}</ScrollView>
      <View style={{ paddingHorizontal: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 8, paddingTop: 14, paddingBottom: 12 }}><Txt style={{ fontSize: 11, lineHeight: 15, fontWeight: '600', letterSpacing: 1 }}>{filters.days === 2 ? 'ДВА ДНЯ / ОДНА НОЧЬ' : filters.maxHours < 12 ? `ВСЯ ПОЕЗДКА / ДО ${filters.maxHours} ЧАСОВ` : 'НА МАШИНЕ / НА ОДИН ДЕНЬ'}</Txt><Txt muted style={{ fontSize: 12 }}>{String(routes.length).padStart(2, '0')} / {String(ROUTES.filter(route => route.days === filters.days).length).padStart(2, '0')}</Txt></View>
        {storageError && <View style={{ marginBottom: 12 }}><Info warm>{storageError}</Info></View>}
        {routes.map(route => <RouteCard key={route.id} route={route} />)}
        {routes.length === 0 && <View style={{ padding: 16, paddingVertical: 28, gap: 15 }}><Title>Такого маршрута{ '\n' }пока нет.</Title><Txt muted>Попробуй другое название или дай поездке чуть больше времени.</Txt><Button onPress={() => { setFilters(DEFAULT_FILTERS); setQuery(''); }}>Показать все маршруты</Button></View>}
        {routes.length > 0 && <Txt muted style={{ fontSize: 11, lineHeight: 17, paddingHorizontal: 8, paddingTop: 12 }}>Время и расстояния — ориентиры.{ '\n' }Подробности и источники — внутри маршрута.</Txt>}
      </View>
      </> : <View style={{ padding: 16 }}><EventsSection /></View>}
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
    <View style={{ paddingHorizontal: 16, paddingTop: 23, paddingBottom: 26 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginBottom: 18 }}><View style={{ flex: 1 }}><Title style={{ fontSize: 32, lineHeight: 35, letterSpacing: -1.4 }}>Мои планы.</Title><Txt muted style={{ fontSize: 13, marginTop: 9 }}>Идеи на следующий выходной</Txt></View><Txt style={{ fontSize: 58, lineHeight: 62, letterSpacing: -3, color: colors.muted }}>{String(routes.length).padStart(2, '0')}</Txt></View>
      {routes.length > 0 && <><Txt muted style={{ fontSize: 12, marginTop: 4 }}>ДАТА ВЫЕЗДА</Txt><DateButton departureOnly onPress={() => setCalendar(true)} /></>}
    </View>
    <View style={{ paddingHorizontal: 8 }}>
      {storageError && <View style={{ marginBottom: 12 }}><Info warm>{storageError}</Info></View>}
      {!storageReady ? <Txt muted>Читаем сохранённое…</Txt> : routes.length ? routes.map(route => <RouteCard key={route.id} route={route} />) : <View style={{ backgroundColor: colors.accent, padding: 22, borderRadius: 12, gap: 18, minHeight: 285 }}><Icon name="heart-outline" size={42} color="#171813" /><Title style={{ fontSize: 32, lineHeight: 34, color: '#171813' }}>Хорошие планы{ '\n' }не теряются.</Title><Txt style={{ color: '#51491D', fontSize: 15 }}>Нажми на сердечко у маршрута — и он останется здесь.</Txt><Button onPress={() => router.navigate('/')}>Выбрать маршрут</Button></View>}
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
    <View style={{ paddingHorizontal: 16, paddingTop: 22, paddingBottom: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><View><Title style={{ fontSize: 34, lineHeight: 36, letterSpacing: -1.4 }}>Карта поездок.</Title><Txt muted style={{ fontSize: 12, marginTop: 7 }}>ГРУЗИЯ / {String(ROUTES.length).padStart(2, '0')} МАРШРУТОВ</Txt></View></View>
    <View onLayout={event => setMapHeight(event.nativeEvent.layout.height)} style={{ flex: 1, minHeight: 200, overflow: 'hidden', marginHorizontal: 8, borderRadius: 12 }}><RouteMap routes={mapRoutes} selectedRouteId={selectedId} onSelectRoute={setSelectedId} dark={isDark} height={mapHeight} /></View>
    <View style={{ padding: 8, paddingTop: 12 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingBottom: 10 }}>{ROUTES.map((route, index) => <Chip key={route.id} label={`${String(index + 1).padStart(2, '0')} ${route.overnight?.location ?? route.stops[0].name}`} selected={route.id === selectedId} onPress={() => setSelectedId(route.id)} small />)}</ScrollView>
      <Pressable accessibilityRole="button" accessibilityLabel={`Открыть ${selected.title}`} onPress={() => router.push({ pathname: '/route/[id]', params: { id: selected.id, short } })} style={({ pressed }) => ({ backgroundColor: panel.background, borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, opacity: pressed ? 0.7 : 1 })}>
        <View style={{ flex: 1, gap: 7 }}><Txt style={{ fontSize: 23, lineHeight: 26, fontWeight: '600', letterSpacing: -0.6, color: panel.ink }}>{selected.title}</Txt><Txt style={{ color: panel.muted, fontSize: 12, lineHeight: 17 }}>{selected.days === 2 ? '2 дня · ' : ''}≈ {selected.durationHours.join('–')} ч · {selected.stops.length} {selected.stops.length === 1 ? 'остановка' : 'остановки'}</Txt></View><Icon name="arrow-forward" size={27} color={panel.ink} />
      </Pressable>
    </View>
  </SafeAreaView>;
}
