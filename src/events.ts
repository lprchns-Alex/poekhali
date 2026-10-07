import { addDays, tbilisiToday } from './model';

type TripDayCount = 1 | 2;

type EventBase = {
  id: string;
  title: string;
  description: string;
  location: string;
  category: 'Музыка' | 'Еда' | 'Природа' | 'Активный отдых';
  routeIds: readonly string[];
  /** The day on which the base itinerary visits this area. Unset means any trip day. */
  routeDays?: Readonly<Record<string, TripDayCount>>;
  sourceUrl: string;
  sourceName: string;
  bookingUrl: string;
  bookingNote: string;
  verifiedAt: string;
};

export type DatedTripEvent = EventBase & {
  schedule: { kind: 'dated'; startDate: string; endDate: string; confirmed: boolean; timeLabel?: string };
};

export type ArrangedTripEvent = EventBase & {
  /** This is an idea to request from the host, never a claim of available slots. */
  schedule: { kind: 'by_arrangement'; availableMonths?: readonly number[]; seasonLabel?: string };
};

export type TripEvent = DatedTripEvent | ArrangedTripEvent;
export type TripEventSelection = { dated: DatedTripEvent[]; byArrangement: ArrangedTripEvent[] };

/** Apply search after date selection, preserving each event's scheduling semantics. */
export function filterEvents<T extends TripEvent>(events: readonly T[], query: string): T[] {
  const normalize = (value: string) => value.toLocaleLowerCase('ru-RU').replaceAll('ё', 'е');
  const search = normalize(query.trim());
  return events.filter(event => !search || normalize(`${event.title} ${event.location} ${event.category} ${event.description}`).includes(search));
}

// Editorial selection checked against the linked organizer / tourism pages.
// Adding an activity is not part of the base route's time estimate.
export const TRIP_EVENTS: readonly TripEvent[] = [
  {
    id: 'jazz-wine-kakheti-2026',
    title: 'Jazz & Wine Kakheti',
    description: 'Джаз и дегустации в усадьбе Цинандали. Фестиваль можно сделать главным событием первого дня в Кахетии.',
    location: 'Цинандали · Tsinandali Estate',
    category: 'Музыка',
    routeIds: ['kakheti-weekend'],
    routeDays: { 'kakheti-weekend': 1 },
    schedule: { kind: 'dated', startDate: '2026-10-10', endDate: '2026-10-10', confirmed: true, timeLabel: 'С 13:00 · программа до вечера' },
    sourceUrl: 'https://easternpromotions.ge/',
    sourceName: 'Eastern Promotions · организатор',
    bookingUrl: 'https://georgia.travel/events/251e0de0-ee9c-4faf-83b5-ffc343c43b4c',
    bookingNote: 'Билеты и изменения программы — по ссылке. Фестиваль займёт часть дня: прогулку по Телави лучше перенести или сократить.',
    verifiedAt: '2026-10-07',
  },
  {
    id: 'kitesa-cooking',
    title: 'Готовим хинкали в Мцхете',
    description: 'В Kitesa’s Wine Cellar проводят мастер-классы по хинкали, хачапури и чурчхеле. Можно совместить с обедом после прогулки.',
    location: 'Мцхета · Teatroni',
    category: 'Еда',
    routeIds: ['mtskheta-jvari'],
    schedule: { kind: 'by_arrangement' },
    sourceUrl: 'https://places.georgia.travel/en/establishments/kitesas-wine-cellar',
    sourceName: 'Georgia Travel · каталог GNTA',
    bookingUrl: 'https://places.georgia.travel/en/establishments/kitesas-wine-cellar',
    bookingNote: 'Уточните дату, длительность, меню и цену у хозяев. Мастер-класс может увеличить время поездки.',
    verifiedAt: '2026-10-07',
  },
  {
    id: 'pheasants-tears-tasting',
    title: 'Вино и кухня в Сигнахи',
    description: 'В Pheasant’s Tears можно договориться о дегустации или меню с сочетанием еды и вина.',
    location: 'Сигнахи · Pheasant’s Tears',
    category: 'Еда',
    routeIds: ['sighnaghi-bodbe', 'kakheti-weekend'],
    routeDays: { 'kakheti-weekend': 2 },
    schedule: { kind: 'by_arrangement' },
    sourceUrl: 'https://www.pheasantstears.com/about',
    sourceName: 'Pheasant’s Tears · ресторан',
    bookingUrl: 'https://www.pheasantstears.com/contact',
    bookingNote: 'Дата, столик, меню и цена требуют подтверждения рестораном. После дегустации нужен трезвый водитель.',
    verifiedAt: '2026-10-07',
  },
  {
    id: 'sabaduri-horseback',
    title: 'Сабадури верхом',
    description: 'Часовая прогулка с проводником в Sabaduri Ranch, среди холмов и сельских пейзажей Эрцо-Тианети.',
    location: 'Сабадури · Эрцо-Тианети',
    category: 'Природа',
    routeIds: ['sabaduri-sioni'],
    schedule: { kind: 'by_arrangement' },
    sourceUrl: 'https://sabadurihorsebackgeorgia.com/horseback-rides-adventures/',
    sourceName: 'Sabaduri Ranch · организатор',
    bookingUrl: 'https://sabadurihorsebackgeorgia.com/contact/',
    bookingNote: 'Согласуйте время, условия участия и точку встречи. Час в седле, подготовка и заезд на ранчо добавляются к маршруту.',
    verifiedAt: '2026-10-07',
  },
  {
    id: 'aragvi-rafting',
    title: 'Рафтинг на Арагви',
    description: 'Сплав с инструктором у Пасанаури. У Georgia Rafting Adventures заявлен сезон с апреля по октябрь.',
    location: 'Пасанаури · Арагви',
    category: 'Активный отдых',
    routeIds: ['ananuri'],
    schedule: { kind: 'by_arrangement', availableMonths: [4, 5, 6, 7, 8, 9, 10], seasonLabel: 'Апрель — октябрь' },
    sourceUrl: 'https://georgiarafting.ge/',
    sourceName: 'Georgia Rafting Adventures · организатор',
    bookingUrl: 'https://georgiarafting.ge/#contact',
    bookingNote: 'Нужен дополнительный заезд из Ананури. Согласуйте дату и условия на реке; сплав, инструктаж и трансфер увеличат время поездки.',
    verifiedAt: '2026-10-07',
  },
];

function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function candidateDays(startDate: string, tripDays: TripDayCount, today: string): string[] {
  if (!isCalendarDate(startDate) || !isCalendarDate(today) || (tripDays !== 1 && tripDays !== 2)) return [];
  return Array.from({ length: tripDays }, (_, index) => addDays(startDate, index)).filter(day => day >= today);
}

function matchesDays(event: TripEvent, days: readonly string[]): boolean {
  const schedule = event.schedule;
  if (schedule.kind === 'dated') {
    if (!schedule.confirmed || !isCalendarDate(schedule.startDate) || !isCalendarDate(schedule.endDate) || schedule.endDate < schedule.startDate) return false;
    return days.some(day => day >= schedule.startDate && day <= schedule.endDate);
  }
  return days.some(day => !schedule.availableMonths || schedule.availableMonths.includes(Number(day.slice(5, 7))));
}

function selectEvents(events: readonly TripEvent[], days: readonly string[], routeId?: string, startDate?: string): TripEventSelection {
  const dated: DatedTripEvent[] = [];
  const byArrangement: ArrangedTripEvent[] = [];
  for (const event of events) {
    if (routeId && !event.routeIds.includes(routeId)) continue;
    const routeDay = routeId ? event.routeDays?.[routeId] : undefined;
    const visitDate = routeDay && startDate ? addDays(startDate, routeDay - 1) : undefined;
    const matchingDays = visitDate ? days.filter(day => day === visitDate) : days;
    if (!matchesDays(event, matchingDays)) continue;
    if (event.schedule.kind === 'dated') dated.push(event as DatedTripEvent);
    else byArrangement.push(event as ArrangedTripEvent);
  }
  dated.sort((a, b) => a.schedule.startDate.localeCompare(b.schedule.startDate));
  return { dated, byArrangement };
}

/** Ideas for the chosen dates. By-arrangement ideas remain separate from dated events. */
export function eventsForDates(startDate: string, tripDays: TripDayCount = 1, today = tbilisiToday(), events: readonly TripEvent[] = TRIP_EVENTS): TripEventSelection {
  return selectEvents(events, candidateDays(startDate, tripDays, today));
}

/** Matches both the destination and its day in the itinerary, including overnight trips. */
export function eventsForTrip(routeId: string, startDate: string, tripDays: TripDayCount = 1, today = tbilisiToday(), events: readonly TripEvent[] = TRIP_EVENTS): TripEventSelection {
  const days = candidateDays(startDate, tripDays, today);
  if (!days.length) return { dated: [], byArrangement: [] };
  return selectEvents(events, days, routeId, startDate);
}

/** Future / currently running confirmed events, for a small date-discovery strip. */
export function upcomingEvents(fromDate = tbilisiToday(), limit = 5, events: readonly TripEvent[] = TRIP_EVENTS): DatedTripEvent[] {
  if (!isCalendarDate(fromDate) || !Number.isFinite(limit) || limit <= 0) return [];
  return events.filter((event): event is DatedTripEvent => event.schedule.kind === 'dated' && event.schedule.confirmed &&
    isCalendarDate(event.schedule.startDate) && isCalendarDate(event.schedule.endDate) &&
    event.schedule.startDate <= event.schedule.endDate && event.schedule.endDate >= fromDate)
    .sort((a, b) => a.schedule.startDate.localeCompare(b.schedule.startDate)).slice(0, Math.floor(limit));
}
