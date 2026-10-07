export const light = {
  background: '#FFFFFF', surface: '#F3F5F1', elevated: '#FFFFFF', text: '#162E27', muted: '#68756F',
  primary: '#18533F', onPrimary: '#FFFFFF', soft: '#E6EEE7', border: '#E1E7E0',
  accent: '#DDF28D', amber: '#956117', amberSoft: '#FFF4DD', page: '#E9EEE8',
};
export const dark: typeof light = {
  background: '#10251D', surface: '#193128', elevated: '#203B30', text: '#EDF3EB', muted: '#A5B8AC',
  primary: '#DDF28D', onPrimary: '#143324', soft: '#2D4A36', border: '#365044',
  accent: '#DDF28D', amber: '#F0CE8C', amberSoft: '#403825', page: '#0B1C15',
};
export type Palette = typeof light;
