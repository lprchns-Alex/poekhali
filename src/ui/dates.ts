export function todayInGeorgia(): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tbilisi', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  return ['year', 'month', 'day'].map(type => parts.find(part => part.type === type)?.value).join('-');
}
export function parseDate(value: string) { return new Date(`${value}T12:00:00Z`); }
export function isoDate(value: Date) { return value.toISOString().slice(0, 10); }
export function addDays(value: string, days: number) { const date = parseDate(value); date.setUTCDate(date.getUTCDate() + days); return isoDate(date); }
export function nextSaturday() { const today = todayInGeorgia(); return addDays(today, (6 - parseDate(today).getUTCDay() + 7) % 7); }
export function formatDate(value: string, long = false) { return parseDate(value).toLocaleDateString('ru-RU', { timeZone: 'UTC', day: 'numeric', month: long ? 'long' : 'short' }).replace('.', ''); }
export function weekday(value: string) { return parseDate(value).toLocaleDateString('ru-RU', { timeZone: 'UTC', weekday: 'long' }); }
