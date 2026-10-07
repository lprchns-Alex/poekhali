import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { eventsForDates, eventsForTrip, TripEvent, upcomingEvents } from '../events';
import { addDays, formatDate, Route, ROUTES, TripDays } from '../model';
import { useApp } from './AppProvider';
import { Button, ExternalLink, Icon, Title, Txt } from './primitives';

function EventCard({ event, route, suggestDate = false }: { event: TripEvent; route?: Route; suggestDate?: boolean }) {
  const { colors, date, setDate, setFilters, filters } = useApp();
  const target = route ?? ROUTES.find(item => event.routeIds.includes(item.id));
  const scheduled = event.schedule.kind === 'dated' ? event.schedule : null;
  // Open a route on the day that actually places the traveler at this event.
  const departure = scheduled && target ? addDays(scheduled.startDate, 1 - (event.routeDays?.[target.id] ?? 1)) : date;
  return <View style={{ backgroundColor: scheduled ? colors.accent : colors.surface, borderRadius: 12, padding: 17, marginBottom: 8 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}><Icon name={scheduled ? 'calendar-outline' : 'sparkles-outline'} color={scheduled ? '#151610' : colors.text} size={18} /><Txt style={{ flex: 1, fontSize: 12, lineHeight: 18, fontWeight: '700', color: scheduled ? '#51491D' : colors.muted }}>{scheduled ? formatDate(scheduled.startDate, true).toLocaleUpperCase('ru-RU') : 'ПО ДОГОВОРЁННОСТИ'} / {event.category.toLocaleUpperCase('ru-RU')}</Txt></View>
    <Title style={{ fontSize: 25, lineHeight: 28, letterSpacing: -0.8, color: scheduled ? '#151610' : colors.text }}>{event.title}</Title>
    <Txt style={{ fontSize: 13, lineHeight: 19, marginTop: 7, color: scheduled ? '#51491D' : colors.muted }}>{event.location}{scheduled?.timeLabel ? `\n${scheduled.timeLabel}` : ''}</Txt>
    <Txt style={{ fontSize: 15, lineHeight: 22, marginTop: 14, color: scheduled ? '#151610' : colors.text }}>{event.description}</Txt>
    <Txt style={{ fontSize: 13, lineHeight: 20, marginTop: 12, color: scheduled ? '#51491D' : colors.muted }}>{event.bookingNote}</Txt>
    <View style={{ backgroundColor: colors.surface, paddingHorizontal: 10, borderRadius: 8, marginTop: 12 }}><ExternalLink url={event.bookingUrl}>Программа и запись ↗</ExternalLink>{event.bookingUrl !== event.sourceUrl && <ExternalLink url={event.sourceUrl}>Источник: {event.sourceName}</ExternalLink>}</View>
    {!route && target && <View style={{ marginTop: 12 }}><Button secondary icon="navigate-outline" onPress={() => {
      if (scheduled) setDate(departure);
      setFilters({ ...filters, days: target.days as TripDays, maxHours: target.days === 2 ? 48 : 12 });
      router.push(`/route/${target.id}`);
    }}>{scheduled || suggestDate ? `Поехать ${formatDate(departure)}` : `Маршрут · ${target.days === 2 ? '2 дня с ночёвкой' : '1 день'}`}</Button></View>}
  </View>;
}

export function EventsSection({ route }: { route?: Route }) {
  const { date, filters, colors } = useApp();
  const days = (route?.days ?? filters.days) as TripDays;
  const selection = route ? eventsForTrip(route.id, date, days) : eventsForDates(date, days);
  const next = route ? [] : upcomingEvents().filter(event => !selection.dated.some(item => item.id === event.id));
  const hasAny = selection.dated.length + selection.byArrangement.length > 0;
  return <View>
    <Title style={{ fontSize: 29, lineHeight: 33, marginBottom: 8 }}>{route ? 'Ещё по пути' : 'Повод поехать.'}</Title>
    <Txt muted style={{ fontSize: 14, lineHeight: 21, marginBottom: 19 }}>{formatDate(date, true)}{days === 2 ? ` — ${formatDate(addDays(date, 1), true)}` : ''}{'\n'}{route ? 'Занятия рядом с маршрутом. Их время и стоимость добавляются отдельно.' : 'События на выбранные даты и занятия рядом с нашими маршрутами. Фильтры времени и прогулок относятся к маршрутам.'}</Txt>
    {selection.dated.map(event => <EventCard key={event.id} event={event} route={route} />)}
    {selection.dated.length === 0 && <Txt muted style={{ fontSize: 14, lineHeight: 21, marginBottom: 18 }}>Подтверждённых событий на эти даты{route ? ' по этому маршруту' : ''} пока нет.</Txt>}
    {selection.byArrangement.length > 0 && <><Txt style={{ fontSize: 12, fontWeight: '700', letterSpacing: 1, marginTop: 12, marginBottom: 12 }}>ЗАНЯТИЯ ПО ЗАПИСИ</Txt>{selection.byArrangement.map(event => <EventCard key={event.id} event={event} route={route} />)}</>}
    {!hasAny && <View style={{ backgroundColor: colors.surface, borderRadius: 10, padding: 16 }}><Txt muted>Новые события появятся после проверки дат у организаторов.</Txt></View>}
    {next.length > 0 && <><Txt style={{ fontSize: 12, fontWeight: '700', letterSpacing: 1, marginTop: 20, marginBottom: 12 }}>БЛИЖАЙШИЕ ДАТЫ</Txt>{next.map(event => <EventCard key={event.id} event={event} suggestDate />)}</>}
    <Txt muted style={{ fontSize: 11, lineHeight: 17, marginTop: 10 }}>Подборка проверена 7 октября 2026. Наличие билетов и мест уточняется у организатора.</Txt>
  </View>;
}
