import React, { useState } from 'react';
import { Keyboard, Pressable, ScrollView, TextInput, useWindowDimensions, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DEFAULT_FILTERS, filterRoutes, formatDate, getTripHours, MOODS, ROUTES } from '../model';
import { RouteMap } from '../services/RouteMap';
import { routePhoto } from '../photos';
import { useApp } from './AppProvider';
import { Button, Chip, Icon, IconButton, Info, Photo, Title, Txt } from './primitives';
import { CalendarSheet, FiltersSheet } from './sheets';
import { RouteCard } from './RouteCard';

export function AppHeader() {
  const { colors, isDark, toggleTheme } = useApp();
  return <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 8, paddingBottom: 10 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '-8deg' }] }}><Icon name="navigate" size={18} color={colors.onPrimary} /></View><Txt style={{ fontSize: 24, lineHeight: 30, letterSpacing: -0.8, fontWeight: '800' }}>поехали.</Txt></View>
    <IconButton name={isDark ? 'sunny-outline' : 'moon-outline'} label={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'} onPress={toggleTheme} />
  </View>;
}

function DateButton({ onPress }: { onPress: () => void }) {
  const { date, colors } = useApp();
  return <Pressable accessibilityRole="button" accessibilityLabel={`Дата поездки: ${formatDate(date, true)}. Изменить дату`} onPress={onPress} style={({ pressed }) => ({ flex: 1, minHeight: 52, borderRadius: 14, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 9, opacity: pressed ? 0.65 : 1 })}><Icon name="calendar-outline" color={colors.primary} size={19} /><Txt style={{ fontWeight: '500', flex: 1 }}>{formatDate(date)}</Txt><Icon name="chevron-down" size={16} color={colors.muted} /></Pressable>;
}

export function ExploreScreen() {
  const { colors, query, setQuery, category, setCategory, filters, setFilters, storageError } = useApp();
  const [sheet, setSheet] = useState<'calendar' | 'filters' | null>(null);
  const [focused, setFocused] = useState(false);
  const { width } = useWindowDimensions();
  const compactFilters = width < 360;
  const routes = filterRoutes(filters, query);
  const activeCount = Number(filters.maxHours < 12) + Number(filters.easyOnly);
  return <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.background }}>
    <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={{ paddingBottom: 24 }}>
      <AppHeader />
      <View style={{ paddingHorizontal: 22, paddingTop: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 12 }}><Icon name="location-outline" size={15} color={colors.primary} /><Txt style={{ color: colors.primary, fontSize: 13, fontWeight: '500' }}>Из Тбилиси · на машине</Txt></View>
        <Title style={{ fontSize: 34, lineHeight: 40, letterSpacing: -1.1, marginBottom: 8 }}>Куда поедем?</Title>
        <Txt muted style={{ marginBottom: 22, fontSize: 15, lineHeight: 22 }}>На день из Тбилиси — к новым местам.</Txt>
        <View style={{ minHeight: 54, flexDirection: 'row', alignItems: 'center', borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: focused ? colors.primary : colors.surface, paddingLeft: 14, marginBottom: 10 }}>
          <Icon name="search-outline" size={21} color={colors.muted} />
          <TextInput accessibilityLabel="Поиск места или маршрута" placeholder="Лес, озеро или название места" placeholderTextColor={colors.muted} value={query} onChangeText={setQuery} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onSubmitEditing={Keyboard.dismiss} returnKeyType="search" autoCorrect={false} style={{ flex: 1, minWidth: 0, minHeight: 52, paddingVertical: 13, paddingHorizontal: 10, fontSize: 16, color: colors.text }} />
          {query.length > 0 && <IconButton name="close" label="Очистить поиск" onPress={() => setQuery('')} />}
        </View>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
          <DateButton onPress={() => { Keyboard.dismiss(); setSheet('calendar'); }} />
          <Pressable accessibilityRole="button" accessibilityLabel={`Открыть фильтры${activeCount ? `, активно ${activeCount}` : ''}`} onPress={() => { Keyboard.dismiss(); setSheet('filters'); }} style={({ pressed }) => ({ minHeight: 52, minWidth: compactFilters ? (activeCount ? 64 : 52) : undefined, borderRadius: 14, backgroundColor: activeCount ? colors.soft : colors.surface, paddingHorizontal: compactFilters ? 12 : 16, flexDirection: 'row', gap: compactFilters ? 5 : 8, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.65 : 1 })}><Icon name="options-outline" size={21} color={colors.primary} />{compactFilters ? (activeCount > 0 && <Txt style={{ fontWeight: '600', fontSize: 13 }}>{activeCount}</Txt>) : <Txt style={{ fontWeight: '500' }}>Фильтры{activeCount ? ` · ${activeCount}` : ''}</Txt>}</Pressable>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 22, gap: 8, paddingBottom: 18 }}>{MOODS.map(mood => <Chip key={mood} label={mood} selected={category === mood} onPress={() => setCategory(mood)} />)}</ScrollView>
      <View style={{ paddingHorizontal: 22 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 15 }}><Title style={{ fontSize: 22, lineHeight: 29 }}>Есть идея для дня</Title><Txt muted style={{ fontSize: 13 }}>{routes.length} из {ROUTES.length}</Txt></View>
        {storageError && <View style={{ marginBottom: 16 }}><Info warm>{storageError}</Info></View>}
        {routes.map(route => <RouteCard key={route.id} route={route} />)}
        {routes.length === 0 && <View style={{ paddingVertical: 28, gap: 15 }}><Icon name="search-outline" size={36} color={colors.muted} /><Title>Пока не нашли такой маршрут</Title><Txt muted>Попробуй другое название или дай поездке чуть больше времени.</Txt><Button secondary onPress={() => { setFilters(DEFAULT_FILTERS); setQuery(''); }}>Показать все маршруты</Button></View>}
        {routes.length > 0 && <Txt muted style={{ fontSize: 12, lineHeight: 18, textAlign: 'center', paddingTop: 5 }}>Время в пути и прогулки — примерные.{ '\n' }Источники и детали — внутри каждого маршрута.</Txt>}
      </View>
    </ScrollView>
    <FiltersSheet visible={sheet === 'filters'} onClose={() => setSheet(null)} />
    <CalendarSheet visible={sheet === 'calendar'} onClose={() => setSheet(null)} />
  </SafeAreaView>;
}

export function SavedScreen() {
  const { colors, saved, storageReady, storageError } = useApp();
  const routes = ROUTES.filter(route => saved.includes(route.id));
  const [calendar, setCalendar] = useState(false);
  return <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.background }}><ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
    <AppHeader />
    <View style={{ padding: 22, paddingTop: 12 }}>
      <Title style={{ fontSize: 32, lineHeight: 38, marginBottom: 10 }}>Сохранённое</Title>
      <Txt muted style={{ marginBottom: 20 }}>Твои идеи для следующего свободного дня.</Txt>
      {storageError && <View style={{ marginBottom: 18 }}><Info warm>{storageError}</Info></View>}
      {routes.length > 0 && <View style={{ marginBottom: 22 }}><DateButton onPress={() => setCalendar(true)} /></View>}
      {!storageReady ? <Txt muted>Читаем сохранённые маршруты…</Txt> : routes.length ? routes.map(route => <RouteCard key={route.id} route={route} />) : <View style={{ backgroundColor: colors.surface, padding: 26, borderRadius: 24, alignItems: 'center', marginTop: 16, gap: 16 }}><View style={{ backgroundColor: colors.soft, borderRadius: 40, padding: 18 }}><Icon name="heart-outline" size={32} color={colors.primary} /></View><Title style={{ textAlign: 'center', fontSize: 23 }}>Собери свои планы</Title><Txt muted style={{ textAlign: 'center' }}>Нажми на сердечко у маршрута. Он останется здесь и после закрытия приложения.</Txt><Button style={{ alignSelf: 'stretch', marginTop: 6 }} onPress={() => router.navigate('/')}>Найти приключение</Button></View>}
    </View>
  </ScrollView><CalendarSheet visible={calendar} onClose={() => setCalendar(false)} /></SafeAreaView>;
}

export function MapScreen() {
  const { colors, isDark, meal } = useApp();
  const [mapHeight, setMapHeight] = useState(260);
  const { route: selectedRoute, short } = useLocalSearchParams<{ route?: string; short?: string }>();
  const selectedId = selectedRoute && ROUTES.some(route => route.id === selectedRoute) ? selectedRoute : ROUTES[0].id;
  const setSelectedId = (id: string) => router.setParams({ route: id, short: id === selectedId ? short : undefined });
  const mapRoutes = ROUTES.map(route => short === '1' && route.id === selectedId && route.shortVariant ? { ...route, title: 'День в Сабадурском лесу', subtitle: 'Сабадури · только лес', stops: route.stops.slice(0, 1), durationHours: getTripHours(route, meal, true) } : route);
  const selected = mapRoutes.find(route => route.id === selectedId) ?? mapRoutes[0];
  return <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.background }}>
    <View style={{ paddingHorizontal: 22, paddingTop: 22, paddingBottom: 14 }}><Title style={{ fontSize: 30 }}>Куда ведёт дорога</Title><Txt muted style={{ fontSize: 14, marginTop: 4 }}>Шесть идей вокруг Тбилиси</Txt></View>
    <View onLayout={event => setMapHeight(event.nativeEvent.layout.height)} style={{ flex: 1, minHeight: 220, overflow: 'hidden' }}><RouteMap routes={mapRoutes} selectedRouteId={selectedId} onSelectRoute={setSelectedId} dark={isDark} height={mapHeight} /></View>
    <View style={{ padding: 16, paddingTop: 12 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 12 }}>{ROUTES.map((route, index) => <Chip key={route.id} label={`${index + 1}. ${route.stops[0].name}`} selected={route.id === selectedId} onPress={() => setSelectedId(route.id)} small />)}</ScrollView>
      <Pressable accessibilityRole="button" accessibilityLabel={`Открыть ${selected.title}`} onPress={() => router.push({ pathname: '/route/[id]', params: { id: selected.id, short } })} style={({ pressed }) => ({ backgroundColor: colors.surface, borderRadius: 18, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', opacity: pressed ? 0.7 : 1 })}>
        <Photo source={routePhoto(selected)} caption={selected.title} height={100} style={{ width: 100 }} />
        <View style={{ flex: 1, paddingHorizontal: 14, paddingVertical: 12, gap: 6 }}><Txt style={{ fontSize: 18, lineHeight: 23, fontWeight: '700' }}>{selected.title}</Txt><Txt muted style={{ fontSize: 13, lineHeight: 19 }}>≈ {selected.durationHours.join('–')} ч · {selected.stops.length} {selected.stops.length === 1 ? 'остановка' : 'остановки'}</Txt></View><View style={{ paddingRight: 12 }}><Icon name="arrow-forward" size={22} color={colors.primary} /></View>
      </Pressable>
    </View>
  </SafeAreaView>;
}
