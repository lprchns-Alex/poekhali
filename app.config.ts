import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const baseUrl = process.env.EXPO_WEB_BASE_URL;
  return {
    ...config,
    name: config.name ?? 'Поехали',
    slug: config.slug ?? 'poekhali-georgia',
    ...(baseUrl ? {
      web: { ...config.web, output: 'static' },
      experiments: { ...config.experiments, baseUrl },
    } : {}),
  };
};
