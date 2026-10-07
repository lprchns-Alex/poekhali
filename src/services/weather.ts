import { addDays, getStopDate, isValidDate, tbilisiToday, type Route } from '../model';

export type WeatherPoint = {
  stopName: string;
  date: string;
  day: number;
  hour: number;
  temperatureC: number | null;
  rainProbability: number | null;
  windKmh: number | null;
  code: number | null;
};
export type WeatherResult = {
  status: 'ready' | 'unavailable' | 'out_of_range';
  date: string;
  updatedAt: string | null;
  points: WeatherPoint[];
  message?: string;
};

type HourlyData = { hourly?: { time?: unknown; temperature_2m?: unknown; precipitation_probability?: unknown; wind_speed_10m?: unknown; weather_code?: unknown } };
type CachedWeather = { data: HourlyData; fetchedAt: string };
const cache = new Map<string, { expiresAt: number; promise: Promise<CachedWeather> }>();
const TTL = 15 * 60 * 1000;
const WEATHER_CODES = new Set([0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 97, 99]);

async function getHourly(latitude: number, longitude: number, date: string, forceRefresh: boolean): Promise<CachedWeather> {
  const key = `${latitude.toFixed(4)},${longitude.toFixed(4)},${date}`;
  const cached = cache.get(key);
  if (!forceRefresh && cached && cached.expiresAt > Date.now()) return cached.promise;
  const request = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const query = new URLSearchParams({
        latitude: String(latitude), longitude: String(longitude),
        hourly: 'temperature_2m,precipitation_probability,wind_speed_10m,weather_code',
        timezone: 'Asia/Tbilisi', start_date: date, end_date: date, wind_speed_unit: 'kmh',
      });
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?${query}`, { signal: controller.signal });
      if (!response.ok) throw new Error(`Weather HTTP ${response.status}`);
      const data = await response.json() as HourlyData;
      if (!data || !Array.isArray(data.hourly?.time)) throw new Error('Invalid weather response');
      return { data, fetchedAt: new Date().toISOString() };
    } finally {
      clearTimeout(timer);
    }
  })();
  cache.set(key, { expiresAt: Date.now() + TTL, promise: request });
  try { return await request; } catch (error) {
    // An older request must not evict a newer manual refresh for this location.
    if (cache.get(key)?.promise === request) cache.delete(key);
    throw error;
  }
}

function valueAt(values: unknown, index: number): number | null {
  if (!Array.isArray(values)) return null;
  const value: unknown = values[index];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function readWeatherPoint(data: HourlyData, date: string, hour: number, stopName: string, day = 1): WeatherPoint {
  const time = data.hourly?.time;
  const index = Array.isArray(time) ? time.indexOf(`${date}T${String(hour).padStart(2, '0')}:00`) : -1;
  const rain = index < 0 ? null : valueAt(data.hourly?.precipitation_probability, index);
  const wind = index < 0 ? null : valueAt(data.hourly?.wind_speed_10m, index);
  const code = index < 0 ? null : valueAt(data.hourly?.weather_code, index);
  return {
    stopName, date, day, hour,
    temperatureC: index < 0 ? null : valueAt(data.hourly?.temperature_2m, index),
    rainProbability: rain !== null && rain >= 0 && rain <= 100 ? rain : null,
    windKmh: wind !== null && wind >= 0 ? wind : null,
    code: code !== null && WEATHER_CODES.has(code) ? code : null,
  };
}

export async function fetchRouteWeather(route: Route, date: string, short = false, forceRefresh = false): Promise<WeatherResult> {
  const today = tbilisiToday();
  const lastForecastDate = addDays(today, 15);
  if (!isValidDate(date) || date < today || date > lastForecastDate) {
    return { status: 'out_of_range', date, updatedAt: null, points: [], message: 'Прогноз появится ближе к поездке — доступны ближайшие 16 дней.' };
  }
  const stops = short && route.shortVariant ? route.stops.slice(0, 1) : route.stops;
  const firstStops = new Set<number>();
  const scheduled = stops.map(stop => {
    const day = stop.day ?? 1;
    const hour = firstStops.has(day) ? 15 : 11;
    firstStops.add(day);
    return { stop, date: getStopDate(date, stop), day, hour };
  });
  const results = await Promise.allSettled(scheduled.map(async item => {
    if (item.date > lastForecastDate) throw new Error('Stop is outside forecast horizon');
    const { data, fetchedAt } = await getHourly(item.stop.latitude, item.stop.longitude, item.date, forceRefresh);
    return { point: readWeatherPoint(data, item.date, item.hour, item.stop.name, item.day), fetchedAt };
  }));
  const points = results.map((result, index) => result.status === 'fulfilled' ? result.value.point : {
    stopName: scheduled[index].stop.name, date: scheduled[index].date, day: scheduled[index].day, hour: scheduled[index].hour,
    temperatureC: null, rainProbability: null, windKmh: null, code: null,
  });
  const usable = points.filter(point => point.temperatureC !== null);
  const fetchedAt = results.flatMap(result => result.status === 'fulfilled' ? [result.value.fetchedAt] : []).sort()[0] ?? null;
  if (!usable.length) return { status: 'unavailable', date, updatedAt: fetchedAt, points, message: 'Не удалось получить прогноз. Попробуйте обновить его позже.' };
  const beyondHorizon = scheduled.some(item => item.date > lastForecastDate);
  return { status: 'ready', date, updatedAt: fetchedAt, points, message: beyondHorizon ? 'Прогноз на второй день появится позже — доступны ближайшие 16 дней.' : usable.length < points.length ? 'Для части остановок прогноз пока недоступен.' : undefined };
}

export function weatherSummary(point: WeatherPoint): string {
  if (point.temperatureC === null) return 'Прогноз недоступен';
  const code = point.code;
  if (code === null) return 'Прогноз на время остановки';
  if (code >= 95) return 'Возможна гроза';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'Снег';
  if (code >= 51 && code <= 82) return 'Возможен дождь';
  if (code === 45 || code === 48) return 'Туман';
  if (code === 0) return 'Ясно';
  if (code === 1 || code === 2) return 'Переменная облачность';
  return 'Облачно';
}

export function weatherAdvice(weather: WeatherResult): string | null {
  if (weather.status !== 'ready') return null;
  if (weather.points.some(point => (point.code ?? 0) >= 95)) return 'В прогнозе гроза. Стоит выбрать другой день для открытых смотровых и прогулок.';
  if (weather.points.some(point => (point.windKmh ?? 0) >= 35)) return 'На открытых местах может быть ветрено. Учитывайте это при выборе остановок.';
  if (weather.points.some(point => (point.rainProbability ?? 0) >= 60)) return 'Вероятен дождь. Рассмотрите короткую прогулку и обед в помещении.';
  return null;
}
