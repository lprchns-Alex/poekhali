import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ROUTES, Route, formatDate } from '../model';
import { addPlace, expandedRoute, PLACES, budget, changeDays, clockLabel, COSTS, dayMinutes, fitPlan, newPlan, parsePlan, Plan } from '../planner';
import { useApp } from './AppProvider';
import { MapChoice, Button, Chip, Icon, IconButton, Info, Sheet, Title, Txt } from './primitives';
import { CalendarSheet } from './sheets';

function Amount({ value, label, onChange, max = 100000 }: { value: number | null; label: string; onChange: (n: number | null) => void; max?: number }) {
  const { colors } = useApp();
  const [draft, setDraft] = useState({ value, text: value === null ? '' : String(value) });
  const text = draft.value === value ? draft.text : value === null ? '' : String(value);
  return <TextInput accessibilityLabel={label} value={text} placeholder="Уточнить" placeholderTextColor={colors.muted} keyboardType="decimal-pad" inputMode="decimal" maxLength={9} onChangeText={v => {
    if (!/^\d{0,6}([.,]\d{0,2})?$/.test(v)) return;
    const n = v === '' ? null : Number(v.replace(',', '.'));
    if (n !== null && n > max) return;
    setDraft({ value: n, text: v }); onChange(n);
  }} onBlur={() => setDraft({ value, text: value === null ? '' : String(value) })} style={{ minHeight: 56, width: '100%', borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, paddingHorizontal: 18, fontSize: 22, fontWeight: '500', color: colors.text }} />;
}
export function PlannerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const route = ROUTES.find(r => r.id === id);
  if (!route) return <SafeAreaView><Title>Маршрут не найден</Title><Button onPress={() => router.replace('/')}>К маршрутам</Button></SafeAreaView>;
  return <Planner key={route.id} route={route} />;
}
function Planner({ route: baseRoute }: { route: Route }) {
  const { colors, date, saved, toggleSaved, storageReady } = useApp();
  const [plan, setPlan] = useState<Plan>(() => newPlan(baseRoute));
  const route = expandedRoute(baseRoute, plan);
  const [adding, setAdding] = useState(false);
  const [placeQuery, setPlaceQuery] = useState('');
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState('Загружаем черновик…');
  const [tab, setTab] = useState('План');
  const [map, setMap] = useState<string | null>(null);
  const [calendar, setCalendar] = useState(false);
  const [timingExpanded, setTimingExpanded] = useState(false);
  const [notice, setNotice] = useState('');
  const canSave = useRef(false);
  const writes = useRef<Promise<unknown>>(Promise.resolve());
  const key = `poekhali.plan.v1.${route.id}`;
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(key).then(raw => { if (active) { setPlan(parsePlan(raw, baseRoute)); canSave.current = true; setStatus('Черновик сохранён на устройстве'); } }).catch(() => { if (active) setStatus('Хранилище недоступно: изменения только в этой сессии'); }).finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, [key, baseRoute]);
  useEffect(() => {
    if (!ready || !canSave.current) return;
    writes.current = writes.current.catch(() => undefined).then(() => AsyncStorage.setItem(key, JSON.stringify(plan))).then(() => setStatus('Черновик сохранён на устройстве')).catch(() => setStatus('Не удалось сохранить черновик. Не закрывай приложение.'));
  }, [plan, key, ready]);
  const update = (patch: Partial<Plan>) => { setNotice(''); setPlan(p => ({ ...p, ...patch })); };
  const sum = budget(plan);
  const limit = Math.min(plan.hours, plan.deadline - plan.start) * 60;
  const selected = plan.selected.filter(Boolean).length;
  const row = { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 8 };
  const card = { backgroundColor: colors.surface, borderRadius: 28, padding: 20, gap: 14 };
  const darkCard = { ...card, backgroundColor: '#1C201C', padding: 24 };
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
    <View style={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <IconButton name="arrow-back" label="Назад к маршруту" onPress={() => router.replace({ pathname: '/route/[id]', params: { id: route.id } })} />
      <View style={{ flex: 1, gap: 3 }}><Title style={{ fontSize: 29, lineHeight: 34, fontWeight: '500' }}>Моя поездка</Title><Txt muted numberOfLines={1} style={{ fontSize: 12, lineHeight: 18 }}>{route.title}</Txt></View>
    </View>
    <View style={{ marginHorizontal: 20, marginBottom: 8, padding: 5, borderRadius: 999, backgroundColor: colors.surface, flexDirection: 'row', gap: 4 }}>
      {['План', 'Бюджет', 'Карты'].map(t => <Pressable key={t} accessibilityRole="tab" aria-selected={tab === t} accessibilityState={{ selected: tab === t }} onPress={() => setTab(t)} style={({ pressed }) => ({ flex: 1, minHeight: 48, borderRadius: 999, justifyContent: 'center', alignItems: 'center', backgroundColor: tab === t ? colors.accent : 'transparent', opacity: pressed ? 0.65 : 1 })}><Txt style={{ fontSize: 14, fontWeight: '600', color: tab === t ? '#1C201C' : colors.muted }}>{t}</Txt></Pressable>)}
    </View>
    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 20 }}>
      {!ready ? <Txt>Загружаем…</Txt> : <>
      {tab === 'План' && <>
        <View style={darkCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Txt style={{ color: '#B6BEB4', fontSize: 11, letterSpacing: 1.7, fontWeight: '600' }}>ТВОЙ МАРШРУТ</Txt><Icon name="compass-outline" color={colors.accent} size={26} /></View>
          <Title style={{ color: '#F7F9F3', fontSize: 29, lineHeight: 34, fontWeight: '400', letterSpacing: -0.8 }}>{route.title}</Title>
          <View style={{ flexDirection: 'row', gap: 24, paddingTop: 6, paddingBottom: 2 }}>
            <View style={{ flex: 1, gap: 2 }}><Txt style={{ color: colors.accent, fontSize: 38, lineHeight: 44, fontWeight: '400', letterSpacing: -1.5 }}>{String(plan.days).padStart(2, '0')}</Txt><Txt style={{ color: '#B6BEB4', fontSize: 12 }}>{plan.days === 1 ? 'день в пути' : 'дня в пути'}</Txt></View>
            <View style={{ width: 1, backgroundColor: '#42483F' }} />
            <View style={{ flex: 1, gap: 2 }}><Txt style={{ color: '#F7F9F3', fontSize: 38, lineHeight: 44, fontWeight: '400', letterSpacing: -1.5 }}>{String(selected).padStart(2, '0')}</Txt><Txt style={{ color: '#B6BEB4', fontSize: 12 }}>{selected === 1 ? 'место в плане' : selected > 1 && selected < 5 ? 'места в плане' : 'мест в плане'}</Txt></View>
          </View>
        </View>
        <Button secondary icon="calendar-outline" onPress={() => setCalendar(true)}>{formatDate(date, true)}</Button>
        <View style={card}>
          <Title style={{ fontSize: 25, lineHeight: 30, fontWeight: '500' }}>Под твой ритм</Title>
          <View style={row}>{[1, 2, 3].map(days => <Chip key={days} label={`${days} ${days === 1 ? 'день' : 'дня'}`} selected={plan.days === days} onPress={() => { setPlan(changeDays(plan, days)); setNotice('Распредели остановки по дням и проверь время дороги и ночлег.'); }} />)}</View>
          <Pressable accessibilityRole="button" accessibilityLabel="Настроить время поездки" accessibilityState={{ expanded: timingExpanded }} onPress={() => setTimingExpanded(v => !v)} style={({ pressed }) => ({ minHeight: 64, paddingTop: 14, borderTopWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 12, opacity: pressed ? 0.65 : 1 })}>
            <Icon name="time-outline" size={22} /><View style={{ flex: 1, gap: 1 }}><Txt style={{ fontSize: 14, fontWeight: '600' }}>Настроить время</Txt><Txt muted style={{ fontSize: 12, lineHeight: 18 }}>{plan.hours} ч в день · {plan.start}:00–{plan.deadline}:00</Txt></View><Icon name={timingExpanded ? 'chevron-up' : 'chevron-down'} size={18} />
          </Pressable>
          {timingExpanded && <View style={{ gap: 16 }}>
            <View style={{ gap: 8 }}><Txt muted style={{ fontSize: 13 }}>Сколько времени есть каждый день?</Txt><View style={row}>{[6, 8, 10, 12].map(hours => <Chip key={hours} label={`${hours} ч`} selected={plan.hours === hours} onPress={() => update({ hours })} />)}</View></View>
            <View style={{ gap: 8 }}><Txt muted style={{ fontSize: 13 }}>Выезд</Txt><View style={row}>{[6, 7, 8, 9, 10].map(start => <Chip key={start} label={`${start}:00`} selected={plan.start === start} onPress={() => update({ start })} />)}</View></View>
            <View style={{ gap: 8 }}><Txt muted style={{ fontSize: 13 }}>Закончить поездку до</Txt><View style={row}>{[16, 17, 18, 19, 20].map(deadline => <Chip key={deadline} label={`${deadline}:00`} selected={plan.deadline === deadline} onPress={() => update({ deadline })} />)}</View></View>
            <Txt muted style={{ fontSize: 12, lineHeight: 18 }}>Выбери срок с запасом до темноты. Закат и состояние горных дорог пока не учитываются автоматически.</Txt>
          </View>}
          <Button disabled={plan.road.some(v => v === null)} icon="sparkles-outline" onPress={() => { const next = fitPlan(route, plan); setPlan(next); setNotice(Array.from({ length: plan.days }, (_, i) => dayMinutes(route, next, i + 1)).some(v => v > limit) ? 'В лимит не помещается. Выезжай раньше, увеличь время или выбери более короткий маршрут. Обязательные места сохранены.' : 'Убрали необязательные остановки, где это требовалось. Проверь новый план ниже.'); }}>Подобрать под время</Button>
        </View>
        {!!notice && <Info>{notice}</Info>}
        {plan.road.some(v => v === null) && <Info warm>После изменения программы уточни дорогу каждого дня в картах и введи время ниже. Подбор заработает после этого.</Info>}
        <Button secondary icon="add" disabled={plan.extras.length >= 12} onPress={() => setAdding(true)}>Добавить место из каталога</Button>
        {Array.from({ length: plan.days }, (_, d) => d + 1).map(day => <View key={day} style={{ gap: 12, paddingTop: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 2, marginBottom: 4 }}><View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}><Txt style={{ color: '#1C201C', fontSize: 13, fontWeight: '600' }}>{String(day).padStart(2, '0')}</Txt></View><Title style={{ fontSize: 27, lineHeight: 32, fontWeight: '500' }}>День {day}</Title><View style={{ height: 1, backgroundColor: colors.border, flex: 1 }} /></View>
          {!plan.selected.some((v, i) => v && plan.stopDays[i] === day) && <Info>На этот день пока нет выбранных мест. Перенеси остановку из другого дня или добавь новую.</Info>}
          {day < plan.days && <Button secondary icon="bed-outline" onPress={() => setMap(`hotels ${route.stops.filter((_, i) => plan.selected[i] && plan.stopDays[i] === day).at(-1)?.mapSearchQuery ?? 'Georgia'}`)}>Выбрать ночлег на картах</Button>}
          <View style={card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><Icon name="time-outline" size={20} /><Txt style={{ fontSize: 14, fontWeight: '600' }}>Время на дорогу</Txt></View>
            <Txt muted style={{ fontSize: 13, lineHeight: 19 }}>Дорога за день, минут · с возвращением или до ночлега</Txt>
            <Amount key={`road-${day}-${plan.days}-${plan.extras.length}`} max={1440} label={`Дорога день ${day}, минут`} value={plan.road[day - 1]} onChange={value => update({ road: plan.road.map((v, i) => i === day - 1 ? value === null ? null : Math.min(1440, value) : v) })} />
            <Txt muted style={{ fontSize: 12, lineHeight: 18 }}>Время из навигатора, без прогулок и обеда. Исходные значения — оценка каталога.</Txt>
            <View style={{ paddingTop: 16, borderTopWidth: 1, borderColor: colors.border, gap: 6 }}><Txt style={{ fontSize: 23, lineHeight: 29, fontWeight: '500', letterSpacing: -0.5 }}>{plan.road[day - 1] === null ? 'Уточни время дороги' : `≈ ${clockLabel(dayMinutes(route, plan, day))} в пути и на местах`}</Txt>{plan.road[day - 1] !== null && <Txt muted style={{ fontSize: 13 }}>Завершение ≈ {clockLabel(plan.start * 60 + dayMinutes(route, plan, day))}</Txt>}{plan.road[day - 1] !== null && dayMinutes(route, plan, day) > limit && <Txt style={{ color: colors.amber, fontSize: 13 }}>Не помещается в выбранное время</Txt>}</View>
          </View>
          {route.stops.map((stop, i) => plan.stopDays[i] !== day ? null : <View key={i} style={{ ...card, borderWidth: 1, borderColor: plan.selected[i] ? colors.surface : colors.border }}>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}><View style={{ flex: 1, gap: 4 }}><Txt muted style={{ fontSize: 10, lineHeight: 14, letterSpacing: 1.5, fontWeight: '600' }}>ОСТАНОВКА {String(i + 1).padStart(2, '0')}</Txt><Txt style={{ fontSize: 21, lineHeight: 26, fontWeight: '500', letterSpacing: -0.4 }}>{stop.name}</Txt></View><IconButton name={plan.selected[i] ? 'checkmark' : 'add'} label={`${plan.selected[i] ? 'Убрать' : 'Добавить'} ${stop.name}`} active={plan.selected[i]} disabled={plan.required[i]} onPress={() => update({ selected: plan.selected.map((v, j) => i === j ? !v : v) })} /></View>
            <Txt muted style={{ fontSize: 14, lineHeight: 21 }}>{stop.text}</Txt>
            {plan.days > 1 && <View style={row}>{Array.from({ length: plan.days }, (_, d) => d + 1).map(d => <Chip key={d} small label={`День ${d}`} selected={plan.stopDays[i] === d} onPress={() => update({ stopDays: plan.stopDays.map((v, j) => i === j ? d : v), road: plan.stopDays[i] === d ? plan.road : plan.road.map(() => null) })} />)}</View>}
            <View style={row}><Chip label="Обязательно" icon={plan.required[i] ? 'star' : 'star-outline'} selected={plan.required[i]} onPress={() => update({ required: plan.required.map((v, j) => i === j ? !v : v), selected: plan.selected.map((v, j) => i === j ? true : v) })} /></View>
            {plan.selected[i] && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderColor: colors.border, paddingTop: 12 }}><IconButton name="remove" label={`Меньше времени: ${stop.name}`} disabled={plan.minutes[i] <= stop.durationMinutesEstimate} onPress={() => update({ minutes: plan.minutes.map((v, j) => i === j ? Math.max(stop.durationMinutesEstimate, v - 15) : v) })} /><View style={{ flex: 1, alignItems: 'center' }}><Txt style={{ fontSize: 19, fontWeight: '500' }}>{plan.minutes[i]} мин</Txt><Txt muted style={{ fontSize: 11, lineHeight: 16 }}>на месте</Txt></View><IconButton name="add" label={`Больше времени: ${stop.name}`} disabled={plan.minutes[i] >= 720} onPress={() => update({ minutes: plan.minutes.map((v, j) => i === j ? Math.min(720, v + 15) : v) })} /></View>}
          </View>)}
        </View>)}
        {selected === 0 && <Info warm>Выбери хотя бы одно место для поездки.</Info>}
        <Info>Расчёт включает указанное время дороги, час на еду и 30 минут запаса в день. {plan.days > 1 ? 'Исходное распределение дороги между днями приблизительное. ' : ''}Удаление остановок не сокращает оценку дороги. Время троп не уменьшаем ниже исходной оценки.</Info>
        <Button secondary onPress={() => setTab('Бюджет')}>Посчитать расходы</Button>
      </>}
      {tab === 'Бюджет' && <>
        <View style={darkCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Txt style={{ color: '#B6BEB4', fontSize: 11, letterSpacing: 1.7, fontWeight: '600' }}>БЮДЖЕТ ПОЕЗДКИ</Txt><Icon name="wallet-outline" color={colors.accent} size={24} /></View>
          <Txt style={{ color: colors.accent, fontSize: 46, lineHeight: 54, fontWeight: '400', letterSpacing: -2 }}>{Math.round(sum.total)} ₾</Txt>
          <Txt style={{ color: '#F7F9F3', fontSize: 14 }}>{sum.unknown ? 'Известная часть бюджета' : 'Всего на компанию'}</Txt>
          <View style={{ borderTopWidth: 1, borderColor: '#42483F', paddingTop: 14, gap: 6 }}><Txt style={{ color: '#F7F9F3', fontSize: 18 }}>{Math.round(sum.perPerson)} ₾ / чел.</Txt>{sum.unknown > 0 && <Txt style={{ color: '#B6BEB4', fontSize: 12, lineHeight: 18 }}>Ещё {sum.unknown} статей нужно уточнить</Txt>}</View>
        </View>
        <View style={{ ...card, flexDirection: 'row', alignItems: 'center' }}><IconButton name="remove" label="Меньше людей" disabled={plan.people <= 1} onPress={() => update({ people: plan.people - 1 })} /><View style={{ flex: 1, alignItems: 'center' }}><Txt style={{ fontSize: 22, lineHeight: 28, fontWeight: '500' }}>{plan.people} чел.</Txt><Txt muted style={{ fontSize: 12, lineHeight: 18 }}>в компании</Txt></View><IconButton name="add" label="Больше людей" disabled={plan.people >= 24} onPress={() => update({ people: plan.people + 1 })} /></View>
        <Title style={{ fontSize: 28, lineHeight: 33, fontWeight: '500' }}>Во сколько обойдётся?</Title><Info>Это твоя смета в лари, а не актуальные цены. Внеси суммы за выбранные места. После изменения остановок проверь билеты и еду заново.</Info>
        <View style={card}><View style={{ flexDirection: 'row', gap: 9, alignItems: 'center' }}><Icon name="flag-outline" size={19} /><Txt style={{ fontSize: 15, fontWeight: '600' }}>Мой лимит на компанию, ₾</Txt></View><Amount label="Лимит бюджета, лари" value={plan.ceiling} onChange={ceiling => update({ ceiling })} />{plan.ceiling !== null && <Txt muted style={{ fontSize: 13, lineHeight: 20 }}>{sum.total > plan.ceiling ? `Уже выше лимита на ${Math.ceil(sum.total - plan.ceiling)} ₾` : `До лимита ${Math.floor(plan.ceiling - sum.total)} ₾${sum.unknown ? ', но не все расходы известны' : ''}`}</Txt>}</View>
        {COSTS.map(([label, basis], i) => <View key={label} style={card}><View style={{ gap: 3 }}><Txt style={{ fontSize: 19, fontWeight: '500' }}>{label}</Txt><Txt muted style={{ fontSize: 12, lineHeight: 18 }}>{basis} · за всю поездку</Txt></View><Amount label={`${label}, лари`} value={plan.costs[i]} onChange={value => update({ costs: plan.costs.map((v, j) => i === j ? value : v) })} /></View>)}
        <Txt muted style={{ fontSize: 13, lineHeight: 20 }}>Пустое поле — расход неизвестен. Введи 0, если платить не нужно. Общий билет на несколько мест учитывай один раз.</Txt>
      </>}
      {tab === 'Карты' && <>
        <View style={darkCard}><View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}><Icon name="navigate-outline" color="#1C201C" size={25} /></View><Title style={{ color: '#F7F9F3', fontSize: 32, lineHeight: 38, fontWeight: '400' }}>Куда едем?</Title><Txt style={{ color: '#B6BEB4', fontSize: 14 }}>Все выбранные места — по порядку поездки.</Txt></View>
        <Info>Открывай выбранные места по порядку в Google или Яндекс Картах. Точки обозначают достопримечательности: подъезд и парковку уточни в навигаторе. Общий автомобильный маршрут пока не передаётся.</Info>
        {route.stops.map((stop, i) => ({ stop, i })).sort((a, b) => plan.stopDays[a.i] - plan.stopDays[b.i]).map(({ stop, i }) => !plan.selected[i] ? null : <View key={i} style={card}><View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}><Icon name="location-outline" size={17} color={colors.muted} /><Txt muted style={{ fontSize: 12 }}>День {plan.stopDays[i]}</Txt></View><Txt style={{ fontSize: 23, lineHeight: 29, fontWeight: '500', letterSpacing: -0.5 }}>{stop.name}</Txt><Button icon="navigate-outline" onPress={() => setMap(stop.mapSearchQuery)}>Открыть в картах</Button></View>)}
        <Button secondary icon="return-down-back-outline" onPress={() => setMap('Tbilisi, Georgia')}>Обратно в Тбилиси</Button>
      </>}
      <View style={{ borderTopWidth: 1, borderColor: colors.border, paddingTop: 20, gap: 14 }}><Button secondary icon="heart-outline" disabled={!storageReady || saved.includes(route.id)} onPress={() => toggleSaved(route.id)}>{saved.includes(route.id) ? 'Маршрут в сохранённом' : 'Добавить в сохранённое'}</Button><View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 2 }}><Icon name="save-outline" size={15} color={colors.muted} /><Txt muted style={{ flex: 1, fontSize: 11, lineHeight: 17 }}>{status}. Продолжить можно кнопкой «Собрать свою поездку» в этом маршруте.</Txt></View></View>
      </>}
    </ScrollView>
    <Sheet visible={adding} title="Ещё одно место" onClose={() => setAdding(false)}><View style={{ gap: 14 }}><View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', paddingHorizontal: 16, borderRadius: 999, backgroundColor: colors.surface }}><Icon name="search-outline" size={20} color={colors.muted} /><TextInput accessibilityLabel="Поиск места" placeholder="Место или маршрут" placeholderTextColor={colors.muted} value={placeQuery} onChangeText={setPlaceQuery} style={{ flex: 1, minHeight: 56, fontSize: 16, color: colors.text }} /></View><Txt muted style={{ fontSize: 13, lineHeight: 20 }}>Добавится в последний день. Новый заезд меняет дорогу — уточни её время в картах.</Txt>{PLACES.filter(p => !route.stops.some(s => s.mapSearchQuery === p.stop.mapSearchQuery) && `${p.stop.name} ${p.routeTitle}`.toLocaleLowerCase('ru').includes(placeQuery.toLocaleLowerCase('ru'))).map(p => <Button key={p.key} secondary onPress={() => { setPlan(addPlace(plan, p.key)); setAdding(false); setPlaceQuery(''); }}>{p.stop.name}</Button>)}</View></Sheet>
    <MapChoice query={map} onClose={() => setMap(null)} /><CalendarSheet visible={calendar} onClose={() => setCalendar(false)} tripDays={plan.days} />
  </SafeAreaView>;
}
