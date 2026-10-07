import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dark, light, Palette } from './theme';
import { parsePreferences } from '../preferences';
import { DEFAULT_FILTERS, Filters, Meal, Mood, nextSaturday } from '../model';

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
  const canPersist = useRef(false);
  const isDark = theme ? theme === 'dark' : system === 'dark';
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(storageKey).then(raw => {
      if (!active) return;
      const value = parsePreferences(raw);
      setSaved(value.saved);
      setTheme(value.theme);
      setMeal(value.meal);
      setDate(value.date);
      setFilters(value.filters);
      canPersist.current = true;
    }).catch(() => { if (active) setStorageError('Не удалось прочитать сохранённое. Избранное пока доступно в этой сессии.'); })
      .finally(() => { if (active) setStorageReady(true); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!storageReady || !canPersist.current) return;
    const data = JSON.stringify({ saved, theme, meal, date, filters });
    writes.current = writes.current.catch(() => undefined).then(() => AsyncStorage.setItem(storageKey, data))
      .then(() => setStorageError(null)).catch(() => setStorageError('Не удалось записать избранное на устройство. Оно сохранится только до закрытия приложения.'));
  }, [saved, theme, meal, date, filters, storageReady]);
  const toggleSaved = useCallback((id: string) => setSaved(previous => previous.includes(id) ? previous.filter(item => item !== id) : [...previous, id]), []);
  return <Context.Provider value={{ colors: isDark ? dark : light, isDark, toggleTheme: () => setTheme(isDark ? 'light' : 'dark'), date, setDate, saved, toggleSaved, storageReady, storageError, query, setQuery, category: filters.mood, setCategory: mood => setFilters(previous => ({ ...previous, mood })), filters, setFilters, meal, setMeal }}>{children}</Context.Provider>;
}
export function useApp() { const value = useContext(Context); if (!value) throw new Error('AppProvider is missing'); return value; }
