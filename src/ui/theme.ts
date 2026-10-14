export const light = {
  background: '#F4F5F2', surface: '#FFFFFF', elevated: '#FFFFFF', text: '#151714', muted: '#62675D',
  primary: '#171A15', onPrimary: '#FFFFFF', soft: '#E9ECE5', border: '#DDE1D7',
  accent: '#C5F933', amber: '#644A18', amberSoft: '#F5ECD5', page: '#E2E6DC',
};
export const dark: typeof light = {
  background: '#111410', surface: '#1E231B', elevated: '#292F25', text: '#F5F7EF', muted: '#ABB5A3',
  primary: '#C5F933', onPrimary: '#151714', soft: '#30372A', border: '#3B4433',
  accent: '#C5F933', amber: '#F2D59C', amberSoft: '#3D3422', page: '#080B07',
};
export type Palette = typeof light;

export function routePanel(_id: string) {
  return { background: '#171C15', ink: '#F7FAF1', muted: '#B8C2AE' };
}
