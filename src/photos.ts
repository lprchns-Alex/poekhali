import type { ImageSourcePropType } from 'react-native';
import type { Route } from './model';

const localPhotos: Record<string, ImageSourcePropType> = {
  chronicle: require('../assets/photos/chronicle.jpg'),
  kojori: require('../assets/photos/kojori.jpg'),
  martkopi: require('../assets/photos/martkopi.jpg'),
  shiomgvime: require('../assets/photos/shiomgvime.jpg'),
  bolnisi: require('../assets/photos/bolnisi.jpg'),
  gareji: require('../assets/photos/gareji.jpg'),
  telavi: require('../assets/photos/telavi.jpg'),
  kvareli: require('../assets/photos/kvareli.jpg'),
  lagodekhi: require('../assets/photos/lagodekhi.jpg'),
  bateti: require('../assets/photos/bateti.png'),
  vardzia: require('../assets/photos/vardzia.jpg'),
  kutaisi: require('../assets/photos/kutaisi.jpg'),
  martvili: require('../assets/photos/martvili.jpg'),
  zugdidi: require('../assets/photos/zugdidi.jpg'),
  shaori: require('../assets/photos/shaori.jpg'),
  surami: require('../assets/photos/surami.jpg'),
  abastumani: require('../assets/photos/abastumani.jpg'),
  asureti: require('../assets/photos/asureti.jpg'),
  manglisi: require('../assets/photos/manglisi.jpg'),
  rabati: require('../assets/photos/rabati.jpg'),
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
