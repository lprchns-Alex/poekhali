import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ROUTES, Route, formatDate } from '../model';
import { addPlace, expandedRoute, PLACES, budget, changeDays, clockLabel, COSTS, dayMinutes, fitPlan, newPlan, parsePlan, Plan } from '../planner';
import { useApp } from './AppProvider';
import { MapChoice, Button, Chip, IconButton, Info, Sheet, Title, Txt } from './primitives';
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
  }} onBlur={() => setDraft({ value, text: value === null ? '' : String(value) })} style={{ minHeight: 50, width: '100%', borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, paddingHorizontal: 14, fontSize: 18, color: colors.text }} />;
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
  const card = { backgroundColor: colors.surface, borderRadius: 12, padding: 18, gap: 12 };
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
    <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}><IconButton name="arrow-back" label="Назад к маршруту" onPress={() => router.replace({ pathname: '/route/[id]', params: { id: route.id } })} /><View style={{ flex: 1 }}><Title style={{ fontSize: 27, lineHeight: 30 }}>Моя поездка</Title><Txt muted style={{ fontSize: 12 }}>{`${plan.days} ${plan.days === 1 ? 'день' : 'дня'}`} · {selected} {selected === 1 ? 'место' : selected < 5 ? 'места' : 'мест'}</Txt></View></View>
    <View style={{ paddingHorizontal: 16, paddingBottom: 12, ...row }}>{['План', 'Бюджет', 'Карты'].map(t => <Chip key={t} label={t} selected={tab === t} onPress={() => setTab(t)} />)}</View>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 18 }}>
      <Txt muted>{route.title}</Txt>
      {!ready ? <Txt>Загружаем…</Txt> : <>
      {tab === 'План' && <>
        <Button secondary icon="calendar-outline" onPress={() => setCalendar(true)}>{formatDate(date, true)}</Button>
        <Title>Под твой ритм</Title>
        <View style={row}>{[1, 2, 3].map(days => <Chip key={days} label={`${days} ${days === 1 ? 'день' : 'дня'}`} selected={plan.days === days} onPress={() => { setPlan(changeDays(plan, days)); setNotice('Распредели остановки по дням и проверь время дороги и ночлег.'); }} />)}</View>
        <Txt muted>Сколько времени есть каждый день?</Txt><View style={row}>{[6, 8, 10, 12].map(hours => <Chip key={hours} label={`${hours} ч`} selected={plan.hours === hours} onPress={() => update({ hours })} />)}</View>
        <Txt>Выезд</Txt><View style={row}>{[6, 7, 8, 9, 10].map(start => <Chip key={start} label={`${start}:00`} selected={plan.start === start} onPress={() => update({ start })} />)}</View>
        <Txt>Закончить поездку до</Txt><View style={row}>{[16, 17, 18, 19, 20].map(deadline => <Chip key={deadline} label={`${deadline}:00`} selected={plan.deadline === deadline} onPress={() => update({ deadline })} />)}</View>
        <Txt muted style={{ fontSize: 13 }}>Выбери срок с запасом до темноты. Закат и состояние горных дорог пока не учитываются автоматически.</Txt>
        <Button disabled={plan.road.some(v => v === null)} icon="sparkles-outline" onPress={() => { const next = fitPlan(route, plan); setPlan(next); setNotice(Array.from({ length: plan.days }, (_, i) => dayMinutes(route, next, i + 1)).some(v => v > limit) ? 'В лимит не помещается. Выезжай раньше, увеличь время или выбери более короткий маршрут. Обязательные места сохранены.' : 'Убрали необязательные остановки, где это требовалось. Проверь новый план ниже.'); }}>Подобрать под время</Button>
        {!!notice && <Info>{notice}</Info>}
        {plan.road.some(v => v === null) && <Info warm>После изменения программы уточни дорогу каждого дня в картах и введи время ниже. Подбор заработает после этого.</Info>}
        <Button secondary icon="add" disabled={plan.extras.length >= 12} onPress={() => setAdding(true)}>Добавить место из каталога</Button>
        {Array.from({ length: plan.days }, (_, d) => d + 1).map(day => <View key={day} style={{ gap: 12 }}>
          <Title style={{ fontSize: 24 }}>День {day}</Title>
          {!plan.selected.some((v, i) => v && plan.stopDays[i] === day) && <Info>На этот день пока нет выбранных мест. Перенеси остановку из другого дня или добавь новую.</Info>}
          {day < plan.days && <Button secondary icon="bed-outline" onPress={() => setMap(`hotels ${route.stops.filter((_, i) => plan.selected[i] && plan.stopDays[i] === day).at(-1)?.mapSearchQuery ?? 'Georgia'}`)}>Выбрать ночлег на картах</Button>}
          <View style={card}><Txt>Дорога за день, минут · с возвращением или до ночлега</Txt><Amount key={`road-${day}-${plan.days}-${plan.extras.length}`} max={1440} label={`Дорога день ${day}, минут`} value={plan.road[day - 1]} onChange={value => update({ road: plan.road.map((v, i) => i === day - 1 ? value === null ? null : Math.min(1440, value) : v) })} /><Txt muted style={{ fontSize: 12 }}>Время из навигатора, без прогулок и обеда. Исходные значения — оценка каталога.</Txt></View>
          <View style={card}><Txt style={{ fontSize: 27, fontWeight: '700' }}>{plan.road[day - 1] === null ? 'Уточни время дороги' : `≈ ${clockLabel(dayMinutes(route, plan, day))} в пути и на местах`}</Txt>{plan.road[day - 1] !== null && <Txt>Завершение ≈ {clockLabel(plan.start * 60 + dayMinutes(route, plan, day))}</Txt>}{plan.road[day - 1] !== null && dayMinutes(route, plan, day) > limit && <Txt style={{ color: colors.amber }}>Не помещается в выбранное время</Txt>}</View>
          {route.stops.map((stop, i) => plan.stopDays[i] !== day ? null : <View key={i} style={card}>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}><IconButton name={plan.selected[i] ? 'checkbox' : 'square-outline'} label={`${plan.selected[i] ? 'Убрать' : 'Добавить'} ${stop.name}`} active={plan.selected[i]} disabled={plan.required[i]} onPress={() => update({ selected: plan.selected.map((v, j) => i === j ? !v : v) })} /><Txt style={{ flex: 1, fontSize: 21, fontWeight: '700' }}>{stop.name}</Txt></View>
            <Txt muted>{stop.text}</Txt>
            {plan.days > 1 && <View style={row}>{Array.from({ length: plan.days }, (_, d) => d + 1).map(d => <Chip key={d} small label={`День ${d}`} selected={plan.stopDays[i] === d} onPress={() => update({ stopDays: plan.stopDays.map((v, j) => i === j ? d : v), road: plan.stopDays[i] === d ? plan.road : plan.road.map(() => null) })} />)}</View>}
            <View style={row}><Chip label="Обязательно" icon={plan.required[i] ? 'star' : 'star-outline'} selected={plan.required[i]} onPress={() => update({ required: plan.required.map((v, j) => i === j ? !v : v), selected: plan.selected.map((v, j) => i === j ? true : v) })} /></View>
            {plan.selected[i] && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><IconButton name="remove" label={`Меньше времени: ${stop.name}`} disabled={plan.minutes[i] <= stop.durationMinutesEstimate} onPress={() => update({ minutes: plan.minutes.map((v, j) => i === j ? Math.max(stop.durationMinutesEstimate, v - 15) : v) })} /><Txt style={{ flex: 1, textAlign: 'center' }}>{plan.minutes[i]} мин</Txt><IconButton name="add" label={`Больше времени: ${stop.name}`} disabled={plan.minutes[i] >= 720} onPress={() => update({ minutes: plan.minutes.map((v, j) => i === j ? Math.min(720, v + 15) : v) })} /></View>}
          </View>)}
        </View>)}
        {selected === 0 && <Info warm>Выбери хотя бы одно место для поездки.</Info>}
        <Info>Расчёт включает указанное время дороги, час на еду и 30 минут запаса в день. {plan.days > 1 ? 'Исходное распределение дороги между днями приблизительное. ' : ''}Удаление остановок не сокращает оценку дороги. Время троп не уменьшаем ниже исходной оценки.</Info>
        <Button secondary onPress={() => setTab('Бюджет')}>Посчитать расходы</Button>
      </>}
      {tab === 'Бюджет' && <>
        <Title>Во сколько обойдётся?</Title><Info>Это твоя смета в лари, а не актуальные цены. Внеси суммы за выбранные места. После изменения остановок проверь билеты и еду заново.</Info>
        <View style={{ ...card, flexDirection: 'row', alignItems: 'center' }}><IconButton name="remove" label="Меньше людей" disabled={plan.people <= 1} onPress={() => update({ people: plan.people - 1 })} /><Txt style={{ flex: 1, textAlign: 'center' }}>{plan.people} чел.</Txt><IconButton name="add" label="Больше людей" disabled={plan.people >= 24} onPress={() => update({ people: plan.people + 1 })} /></View>
        <View style={{ ...card, backgroundColor: colors.accent }}><Txt style={{ color: '#141511', fontSize: 35, lineHeight: 40, fontWeight: '700' }}>{Math.round(sum.total)} ₾</Txt><Txt style={{ color: '#141511' }}>{sum.unknown ? 'Известная часть бюджета' : 'Всего на компанию'} · {Math.round(sum.perPerson)} ₾ / чел.</Txt>{sum.unknown > 0 && <Txt style={{ color: '#141511' }}>Ещё {sum.unknown} статей нужно уточнить</Txt>}</View>
        <View style={card}><Txt>Мой лимит на компанию, ₾</Txt><Amount label="Лимит бюджета, лари" value={plan.ceiling} onChange={ceiling => update({ ceiling })} />{plan.ceiling !== null && <Txt>{sum.total > plan.ceiling ? `Уже выше лимита на ${Math.ceil(sum.total - plan.ceiling)} ₾` : `До лимита ${Math.floor(plan.ceiling - sum.total)} ₾${sum.unknown ? ', но не все расходы известны' : ''}`}</Txt>}</View>
        {COSTS.map(([label, basis], i) => <View key={label} style={card}><Txt style={{ fontWeight: '700' }}>{label}</Txt><Txt muted>{basis} · за всю поездку</Txt><Amount label={`${label}, лари`} value={plan.costs[i]} onChange={value => update({ costs: plan.costs.map((v, j) => i === j ? value : v) })} /></View>)}
        <Txt muted>Пустое поле — расход неизвестен. Введи 0, если платить не нужно. Общий билет на несколько мест учитывай один раз.</Txt>
      </>}
      {tab === 'Карты' && <>
        <Title>Куда едем?</Title><Info>Открывай выбранные места по порядку в Google или Яндекс Картах. Точки обозначают достопримечательности: подъезд и парковку уточни в навигаторе. Общий автомобильный маршрут пока не передаётся.</Info>
        {route.stops.map((stop, i) => ({ stop, i })).sort((a, b) => plan.stopDays[a.i] - plan.stopDays[b.i]).map(({ stop, i }) => !plan.selected[i] ? null : <View key={i} style={card}><Txt muted>День {plan.stopDays[i]}</Txt><Txt style={{ fontSize: 23, fontWeight: '700' }}>{stop.name}</Txt><Button icon="navigate-outline" onPress={() => setMap(stop.mapSearchQuery)}>Открыть в картах</Button></View>)}
        <Button secondary onPress={() => setMap('Tbilisi, Georgia')}>Обратно в Тбилиси</Button>
      </>}
      <Button secondary icon="heart-outline" disabled={!storageReady || saved.includes(route.id)} onPress={() => toggleSaved(route.id)}>{saved.includes(route.id) ? 'Маршрут в сохранённом' : 'Добавить в сохранённое'}</Button>
      <Txt muted style={{ fontSize: 12 }}>{status}. Продолжить можно кнопкой «Собрать свою поездку» в этом маршруте.</Txt>
      </>}
    </ScrollView>
    <Sheet visible={adding} title="Ещё одно место" onClose={() => setAdding(false)}><View style={{ gap: 12 }}><TextInput accessibilityLabel="Поиск места" placeholder="Место или маршрут" placeholderTextColor={colors.muted} value={placeQuery} onChangeText={setPlaceQuery} style={{ minHeight: 50, fontSize: 16, padding: 12, borderRadius: 8, backgroundColor: colors.surface, color: colors.text }} /><Txt muted>Добавится в последний день. Новый заезд меняет дорогу — уточни её время в картах.</Txt>{PLACES.filter(p => !route.stops.some(s => s.mapSearchQuery === p.stop.mapSearchQuery) && `${p.stop.name} ${p.routeTitle}`.toLocaleLowerCase('ru').includes(placeQuery.toLocaleLowerCase('ru'))).map(p => <Button key={p.key} secondary onPress={() => { setPlan(addPlace(plan, p.key)); setAdding(false); setPlaceQuery(''); }}>{p.stop.name}</Button>)}</View></Sheet>
    <MapChoice query={map} onClose={() => setMap(null)} /><CalendarSheet visible={calendar} onClose={() => setCalendar(false)} tripDays={plan.days} />
  </SafeAreaView>;
}
