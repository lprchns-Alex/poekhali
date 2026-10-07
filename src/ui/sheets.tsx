import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { DEFAULT_FILTERS, filterRoutes, Filters, formatDate, MOODS, tbilisiToday } from '../model';
import { useApp } from './AppProvider';
import { isoDate, parseDate } from './dates';
import { Button, Chip, Icon, IconButton, Sheet, Txt } from './primitives';

export function FiltersSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) { return visible ? <FilterContent onClose={onClose} /> : null; }
function FilterContent({ onClose }: { onClose: () => void }) {
  const { filters, setFilters, query, colors } = useApp();
  const [draft, setDraft] = useState<Filters>(filters);
  const count = filterRoutes(draft, query).length;
  return <Sheet visible title="Какая поездка?" onClose={onClose} footer={<Button onPress={() => { setFilters(draft); onClose(); }}>Показать маршруты · {count}</Button>}>
    <Txt muted style={{ marginBottom: 22 }}>На машине из Тбилиси, с возвращением домой.</Txt>
    <Txt style={{ fontWeight: '600', marginBottom: 12 }}>Сколько времени есть</Txt>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
      {[{ label: 'До 6 часов', value: 6 }, { label: 'До 8 часов', value: 8 }, { label: 'Весь день', value: 12 }].map(item => <Chip key={item.value} label={item.label} selected={draft.maxHours === item.value} onPress={() => setDraft({ ...draft, maxHours: item.value })} />)}
    </View>
    <Txt style={{ fontWeight: '600', marginBottom: 12 }}>За чем едем</Txt>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>{MOODS.map(mood => <Chip key={mood} label={mood} selected={draft.mood === mood} onPress={() => setDraft({ ...draft, mood })} />)}</View>
    <Txt style={{ fontWeight: '600', marginBottom: 12 }}>Прогулка</Txt>
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: draft.easyOnly }} onPress={() => setDraft({ ...draft, easyOnly: !draft.easyOnly })} style={{ backgroundColor: colors.surface, minHeight: 76, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ width: 25, height: 25, borderRadius: 8, borderWidth: draft.easyOnly ? 0 : 1.5, borderColor: colors.muted, backgroundColor: draft.easyOnly ? colors.primary : 'transparent', justifyContent: 'center', alignItems: 'center' }}>{draft.easyOnly && <Icon name="checkmark" size={18} color={colors.onPrimary} />}</View>
      <View style={{ flex: 1 }}><Txt style={{ fontWeight: '500' }}>Без сложных подъёмов</Txt><Txt muted style={{ fontSize: 14, lineHeight: 20 }}>Спокойный темп и лёгкая прогулка</Txt></View>
    </Pressable>
    <Pressable accessibilityRole="button" onPress={() => setDraft(DEFAULT_FILTERS)} style={{ alignSelf: 'center', minHeight: 48, justifyContent: 'center', marginTop: 14 }}><Txt style={{ color: colors.primary, fontWeight: '600' }}>Сбросить фильтры</Txt></Pressable>
  </Sheet>;
}

export function CalendarSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) { return visible ? <CalendarContent onClose={onClose} /> : null; }
function CalendarContent({ onClose }: { onClose: () => void }) {
  const { date, setDate, colors } = useApp();
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
  return <Sheet visible title="Когда поедем?" onClose={onClose} footer={<Button icon="calendar-outline" onPress={() => { setDate(draft); onClose(); }}>Выбрать · {formatDate(draft)}</Button>}>
    <Txt muted style={{ marginBottom: 16 }}>Покажем прогноз на день поездки.</Txt>
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
      <IconButton name="chevron-back" label="Предыдущий месяц" disabled={currentMonth <= today.slice(0, 7)} onPress={() => moveMonth(-1)} />
      <Txt style={{ flex: 1, textAlign: 'center', fontWeight: '600', textTransform: 'capitalize' }}>{month.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric', timeZone: 'UTC' }).replace(' г.', '')}</Txt>
      <IconButton name="chevron-forward" label="Следующий месяц" onPress={() => moveMonth(1)} />
    </View>
    <View style={{ flexDirection: 'row', marginBottom: 6 }}>{['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => <Txt key={day} muted style={{ width: '14.2857%', textAlign: 'center', fontSize: 13 }}>{day}</Txt>)}</View>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{Array.from({ length: before + days }, (_, i) => {
      const number = i - before + 1;
      if (number <= 0) return <View key={`empty-${i}`} style={{ width: '14.2857%', height: 48 }} />;
      const value = isoDate(new Date(Date.UTC(year, index, number, 12)));
      const selected = value === draft;
      const disabled = value < today;
      return <Pressable key={value} accessibilityRole="button" accessibilityLabel={formatDate(value, true)} accessibilityState={{ selected, disabled }} disabled={disabled} onPress={() => setDraft(value)} style={({ pressed }) => ({ width: '14.2857%', minHeight: 48, paddingVertical: 11, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: selected ? colors.primary : pressed ? colors.soft : 'transparent', borderWidth: value === today && !selected ? 1 : 0, borderColor: colors.border, opacity: disabled ? 0.28 : 1 })}><Txt style={{ fontWeight: selected ? '700' : '400', color: selected ? colors.onPrimary : colors.text }}>{number}</Txt></Pressable>;
    })}</View>
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginTop: 20, padding: 14, backgroundColor: colors.surface, borderRadius: 14 }}><Icon name="cloud-outline" size={20} color={colors.muted} /><Txt muted style={{ fontSize: 14, lineHeight: 21, flex: 1 }}>Прогноз доступен примерно на две недели вперёд. Для более поздних дат он появится ближе к поездке.</Txt></View>
  </Sheet>;
}
