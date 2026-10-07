import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dark, light, Palette } from './theme';
import { DEFAULT_FILTERS, Filters, Meal, Mood, nextSaturday, tbilisiToday, validSavedIds } from '../model';

export type MealMode = Meal;
type AppState = {
  colors: Palette; isDark: boolean; toggleTheme: () => void;
  date: string; setDate: (value: string) => void;
  saved: string[]; toggleSaved: (id: string) => void; storageReady: boolean; storageError: string | null;
  query: string; setQuery: (value: string) => void;
  category: Mood; setCategory: (value: Mood) => void;
  filters: Filters; setFilters: (value: Filters) => void;
  meal: MealMode; setMeal: (value: MealMode) => void;
};
const Context = createContext<AppState | null>(null);
const storageKey = 'poekhali.preferences.v1';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [theme, setTheme] = useState<'light' | 'dark' | null>(null);
  const [date, setDate] = useState(nextSaturday);
  const [saved, setSaved] = useState<string[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [meal, setMeal] = useState<MealMode>('cafe');
  const writes = useRef<Promise<unknown>>(Promise.resolve());
  const isDark = theme ? theme === 'dark' : system === 'dark';
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(storageKey).then(raw => {
      if (!active || !raw) return;
      const data: unknown = JSON.parse(raw);
      if (typeof data !== 'object' || data === null) return;
      const value = data as Record<string, unknown>;
      if (Array.isArray(value.saved)) setSaved(validSavedIds(value.saved));
      if (value.theme === 'dark' || value.theme === 'light') setTheme(value.theme);
      if (value.meal === 'cafe' || value.meal === 'picnic') setMeal(value.meal);
      if (typeof value.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.date) && Number.isFinite(Date.parse(`${value.date}T12:00:00Z`)) && value.date >= tbilisiToday()) setDate(value.date);
    }).catch(() => { if (active) setStorageError('Не удалось прочитать сохранённое. Избранное пока доступно в этой сессии.'); })
      .finally(() => { if (active) setStorageReady(true); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!storageReady) return;
    const data = JSON.stringify({ saved, theme, meal, date });
    writes.current = writes.current.catch(() => undefined).then(() => AsyncStorage.setItem(storageKey, data))
      .then(() => setStorageError(null)).catch(() => setStorageError('Не удалось записать избранное на устройство. Оно сохранится только до закрытия приложения.'));
  }, [saved, theme, meal, date, storageReady]);
  const toggleSaved = useCallback((id: string) => setSaved(previous => previous.includes(id) ? previous.filter(item => item !== id) : [...previous, id]), []);
  return <Context.Provider value={{ colors: isDark ? dark : light, isDark, toggleTheme: () => setTheme(isDark ? 'light' : 'dark'), date, setDate, saved, toggleSaved, storageReady, storageError, query, setQuery, category: filters.mood, setCategory: mood => setFilters(previous => ({ ...previous, mood })), filters, setFilters, meal, setMeal }}>{children}</Context.Provider>;
}
export function useApp() { const value = useContext(Context); if (!value) throw new Error('AppProvider is missing'); return value; }
