export const light = {
  background: '#CECECA', surface: '#E1E1DB', elevated: '#F2F1E9', text: '#161713', muted: '#56574F',
  primary: '#171813', onPrimary: '#FAF9EF', soft: '#DDDED4', border: '#B1B2AA',
  accent: '#FFDF55', amber: '#584313', amberSoft: '#E7DCA9', page: '#BDBDB8',
};
export const dark: typeof light = {
  background: '#242621', surface: '#32352E', elevated: '#3C4036', text: '#F1F0E7', muted: '#B5B8AC',
  primary: '#FFDF55', onPrimary: '#171813', soft: '#414539', border: '#52564B',
  accent: '#FFDF55', amber: '#EFDC9C', amberSoft: '#48422B', page: '#181A16',
};
export type Palette = typeof light;

const routeColors: Record<string, string> = {
  'sabaduri-sioni': '#AEB59E',
  'mtskheta-jvari': '#FFDF55',
  ananuri: '#CEC4B3',
  'sighnaghi-bodbe': '#EAE9E0',
  dashbashi: '#EAB098',
  uplistsikhe: '#B5C7BD',
  'kakheti-weekend': '#EAB098',
  'kazbegi-weekend': '#B5C7BD',
};
export function routePanel(id: string) {
  return { background: routeColors[id] ?? '#EAE9E0', ink: '#151610', muted: '#414638' };
}
