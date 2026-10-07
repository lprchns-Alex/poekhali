import { addDays, tbilisiToday, type Route } from '../model';

export type WeatherPoint = {
  stopName: string;
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

async function getHourly(latitude: number, longitude: number, date: string): Promise<CachedWeather> {
  const key = `${latitude.toFixed(4)},${longitude.toFixed(4)},${date}`;
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.promise;
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
      if (!Array.isArray(data.hourly?.time)) throw new Error('Invalid weather response');
      return { data, fetchedAt: new Date().toISOString() };
    } finally {
      clearTimeout(timer);
    }
  })();
  cache.set(key, { expiresAt: Date.now() + TTL, promise: request });
  try { return await request; } catch (error) { cache.delete(key); throw error; }
}

function valueAt(values: unknown, index: number): number | null {
  if (!Array.isArray(values)) return null;
  const value: unknown = values[index];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function readWeatherPoint(data: HourlyData, date: string, hour: number, stopName: string): WeatherPoint {
  const time = data.hourly?.time;
  const index = Array.isArray(time) ? time.indexOf(`${date}T${String(hour).padStart(2, '0')}:00`) : -1;
  return {
    stopName, hour,
    temperatureC: index < 0 ? null : valueAt(data.hourly?.temperature_2m, index),
    rainProbability: index < 0 ? null : valueAt(data.hourly?.precipitation_probability, index),
    windKmh: index < 0 ? null : valueAt(data.hourly?.wind_speed_10m, index),
    code: index < 0 ? null : valueAt(data.hourly?.weather_code, index),
  };
}

export async function fetchRouteWeather(route: Route, date: string, short = false): Promise<WeatherResult> {
  const today = tbilisiToday();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < today || date > addDays(today, 15)) {
    return { status: 'out_of_range', date, updatedAt: null, points: [], message: 'Прогноз появится ближе к поездке — доступны ближайшие 16 дней.' };
  }
  const stops = short && route.shortVariant ? route.stops.slice(0, 1) : route.stops;
  const results = await Promise.allSettled(stops.map(async (stop, index) => {
    const { data, fetchedAt } = await getHourly(stop.latitude, stop.longitude, date);
    return { point: readWeatherPoint(data, date, index === 0 ? 11 : 15, stop.name), fetchedAt };
  }));
  const points = results.map((result, index) => result.status === 'fulfilled' ? result.value.point : {
    stopName: stops[index].name, hour: index === 0 ? 11 : 15,
    temperatureC: null, rainProbability: null, windKmh: null, code: null,
  });
  const usable = points.filter(point => point.temperatureC !== null);
  const fetchedAt = results.flatMap(result => result.status === 'fulfilled' ? [result.value.fetchedAt] : []).sort()[0] ?? null;
  if (!usable.length) return { status: 'unavailable', date, updatedAt: fetchedAt, points, message: 'Не удалось получить прогноз. Попробуйте обновить его позже.' };
  return { status: 'ready', date, updatedAt: fetchedAt, points, message: usable.length < points.length ? 'Для части остановок прогноз пока недоступен.' : undefined };
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
