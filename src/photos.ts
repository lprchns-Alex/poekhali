import type { ImageSourcePropType } from 'react-native';
import type { Route } from './model';

const localPhotos: Record<string, ImageSourcePropType> = {
  sioni: require('../assets/photos/sioni.jpg'),
  mtskheta: require('../assets/photos/mtskheta.jpg'),
  ananuri: require('../assets/photos/ananuri.jpg'),
  sighnaghi: require('../assets/photos/sighnaghi.jpg'),
  dashbashi: require('../assets/photos/dashbashi.jpg'),
  uplistsikhe: require('../assets/photos/uplistsikhe.jpg'),
};

export function routePhoto(route: Route): ImageSourcePropType {
  return localPhotos[route.photo.id] ?? { uri: route.photo.url };
}
