import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { addDays, DEFAULT_FILTERS, filterRoutes, Filters, formatDate, MOODS, tbilisiToday } from '../model';
import { useApp } from './AppProvider';
import { isoDate, parseDate } from './dates';
import { Button, Chip, Icon, IconButton, Sheet, Txt } from './primitives';

export function FiltersSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) { return visible ? <FilterContent onClose={onClose} /> : null; }
function FilterContent({ onClose }: { onClose: () => void }) {
  const { filters, setFilters, query, colors, meal, setMeal } = useApp();
  const [draft, setDraft] = useState<Filters>(filters);
  const [draftMeal, setDraftMeal] = useState(meal);
  const count = filterRoutes(draft, query, draftMeal).length;
  return <Sheet visible title="Какая поездка?" onClose={onClose} footer={<Button onPress={() => { setFilters(draft); setMeal(draftMeal); onClose(); }}>Показать маршруты · {count}</Button>}>
    <Txt muted style={{ marginBottom: 20 }}>На машине из Тбилиси. Считаем всю поездку: дорогу, прогулки и еду.</Txt>
    <Txt style={{ fontWeight: '700', marginBottom: 12 }}>На сколько дней</Txt>
    <View style={{ flexDirection: 'row', gap: 6, marginBottom: 20 }}>
      {([1, 2] as const).map(days => <Chip key={days} label={days === 1 ? '1 день' : '2 дня · с ночёвкой'} selected={draft.days === days} onPress={() => setDraft({ ...draft, days, maxHours: days === 1 ? 12 : 48 })} />)}
    </View>
    <Txt style={{ fontWeight: '700', marginBottom: 12 }}>{draft.days === 1 ? 'Вся поездка займёт' : 'Время с ночёвкой'}</Txt>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingBottom: 20, marginBottom: 20, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border }}>
      {(draft.days === 1 ? [{ label: 'До 6 часов', value: 6 }, { label: 'До 8 часов', value: 8 }, { label: 'Весь день', value: 12 }] : [{ label: 'До 36 часов', value: 36 }, { label: 'До 48 часов', value: 48 }]).map(item => <Chip key={item.value} label={item.label} selected={draft.maxHours === item.value} onPress={() => setDraft({ ...draft, maxHours: item.value })} />)}
    </View>
    <Txt style={{ fontWeight: '700', marginBottom: 12 }}>Обед в плане</Txt>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}><Chip label="В кафе" selected={draftMeal === 'cafe'} onPress={() => setDraftMeal('cafe')} /><Chip label="Еда с собой" selected={draftMeal === 'picnic'} onPress={() => setDraftMeal('picnic')} /></View>
    <Txt muted style={{ fontSize: 13, lineHeight: 19, marginBottom: 24 }}>Перерыв включён во время. Мероприятия добавляют время отдельно.</Txt>
    <Txt style={{ fontWeight: '700', marginBottom: 12 }}>За чем едем</Txt>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingBottom: 20, marginBottom: 20, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border }}>{MOODS.map(mood => <Chip key={mood} label={mood} selected={draft.mood === mood} onPress={() => setDraft({ ...draft, mood })} />)}</View>
    <Txt style={{ fontWeight: '700', marginBottom: 12 }}>Прогулка</Txt>
    <Pressable accessibilityRole="checkbox" aria-checked={draft.easyOnly} accessibilityState={{ checked: draft.easyOnly }} onPress={() => setDraft({ ...draft, easyOnly: !draft.easyOnly })} style={({ pressed }) => ({ backgroundColor: colors.surface, minHeight: 76, borderRadius: 10, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, opacity: pressed ? 0.7 : 1 })}>
      <View style={{ width: 25, height: 25, borderRadius: 5, borderWidth: draft.easyOnly ? 0 : 1.5, borderColor: colors.muted, backgroundColor: draft.easyOnly ? colors.primary : 'transparent', justifyContent: 'center', alignItems: 'center' }}>{draft.easyOnly && <Icon name="checkmark" size={18} color={colors.onPrimary} />}</View>
      <View style={{ flex: 1 }}><Txt style={{ fontWeight: '500' }}>Без сложных подъёмов</Txt><Txt muted style={{ fontSize: 14, lineHeight: 20 }}>Спокойный темп и лёгкая прогулка</Txt></View>
    </Pressable>
    <Pressable accessibilityRole="button" onPress={() => { setDraft(DEFAULT_FILTERS); setDraftMeal('cafe'); }} style={{ alignSelf: 'center', minHeight: 48, justifyContent: 'center', marginTop: 14 }}><Txt style={{ color: colors.primary, fontWeight: '600' }}>Сбросить фильтры</Txt></Pressable>
  </Sheet>;
}

export function CalendarSheet({ visible, onClose, tripDays }: { visible: boolean; onClose: () => void; tripDays?: number }) { return visible ? <CalendarContent onClose={onClose} tripDays={tripDays} /> : null; }
function CalendarContent({ onClose, tripDays }: { onClose: () => void; tripDays?: number }) {
  const { date, setDate, colors, filters } = useApp();
  const daysInTrip = tripDays ?? filters.days;
  const [draft, setDraft] = useState(date);
  const [month, setMonth] = useState(() => parseDate(date));
  const today = tbilisiToday();
  const year = month.getUTCFullYear();
  const index = month.getUTCMonth();
  const first = new Date(Date.UTC(year, index, 1, 12));
  const before = (first.getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(year, index + 1, 0)).getUTCDate();
  const currentMonth = `${year}-${String(index + 1).padStart(2, '0')}`;
  const moveMonth = (offset: number) => setMonth(new Date(Date.UTC(year, index + offset, 1, 12)));
  return <Sheet visible title="Когда поедем?" onClose={onClose} footer={<Button icon="calendar-outline" onPress={() => { setDate(draft); onClose(); }}>Выбрать · {formatDate(draft)}{daysInTrip === 2 ? ` — ${formatDate(addDays(draft, 1))}` : ''}</Button>}>
    <Txt muted style={{ marginBottom: 16 }}>{daysInTrip === 2 ? 'Выбери день выезда. Возвращение — на следующий день.' : 'Покажем прогноз и мероприятия на день поездки.'}</Txt>
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
      <IconButton name="chevron-back" label="Предыдущий месяц" disabled={currentMonth <= today.slice(0, 7)} onPress={() => moveMonth(-1)} />
      <Txt style={{ flex: 1, textAlign: 'center', fontWeight: '700', textTransform: 'capitalize' }}>{month.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric', timeZone: 'UTC' }).replace(' г.', '')}</Txt>
      <IconButton name="chevron-forward" label="Следующий месяц" onPress={() => moveMonth(1)} />
    </View>
    <View style={{ flexDirection: 'row', marginBottom: 6 }}>{['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => <Txt key={day} muted style={{ width: '14.2857%', textAlign: 'center', fontSize: 13 }}>{day}</Txt>)}</View>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{Array.from({ length: before + days }, (_, i) => {
      const number = i - before + 1;
      if (number <= 0) return <View key={`empty-${i}`} style={{ width: '14.2857%', height: 48 }} />;
      const value = isoDate(new Date(Date.UTC(year, index, number, 12)));
      const selected = value === draft;
      const secondDay = daysInTrip === 2 && value === addDays(draft, 1);
      const disabled = value < today;
      return <Pressable key={value} accessibilityRole="button" accessibilityLabel={formatDate(value, true)} accessibilityState={{ selected, disabled }} disabled={disabled} onPress={() => setDraft(value)} style={({ pressed }) => ({ width: '14.2857%', minHeight: 48, paddingVertical: 11, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: selected || secondDay ? colors.accent : pressed ? colors.soft : 'transparent', borderWidth: value === today && !selected ? 1 : 0, borderColor: colors.muted, opacity: disabled ? 0.28 : 1 })}><Txt style={{ fontWeight: selected ? '700' : '500', color: selected || secondDay ? '#141511' : colors.text, fontVariant: ['tabular-nums'] }}>{number}</Txt></Pressable>;
    })}</View>
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginTop: 20, padding: 14, backgroundColor: colors.surface, borderRadius: 10 }}><Icon name="cloud-outline" size={20} color={colors.muted} /><Txt muted style={{ fontSize: 14, lineHeight: 21, flex: 1 }}>Прогноз доступен примерно на две недели вперёд. Для более поздних дат он появится ближе к поездке.</Txt></View>
  </Sheet>;
}
