export function mapQuery(url: string): string | null {
  try { const parsed = new URL(url); return /(^|\.)google\.com$/.test(parsed.hostname) && parsed.pathname.startsWith('/maps') ? parsed.searchParams.get('query') || parsed.searchParams.get('q') : null; } catch { return null; }
}
export function mapSearch(query: string, provider: 'google' | 'yandex'): string {
  return provider === 'google' ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : `https://yandex.ru/maps/?text=${encodeURIComponent(query)}`;
}
