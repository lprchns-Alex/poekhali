import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const baseUrl = process.env.EXPO_WEB_BASE_URL;
  return {
    ...config,
    ...(baseUrl ? {
      web: { ...config.web, output: 'static' },
      experiments: { ...config.experiments, baseUrl },
    } : {}),
  };
};
