import type { ImageSourcePropType } from 'react-native';
import type { Route } from './model';
import galleryPhotos from './gallery-photos.json';
import galleryRoutes from './gallery-routes.json';

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

const gallerySources: Record<string, ImageSourcePropType> = {
  'jvari': require('../assets/photos/gallery/jvari.jpg'),
  'zhinvali': require('../assets/photos/gallery/zhinvali.jpg'),
  'bodbe': require('../assets/photos/gallery/bodbe.jpg'),
  'dashbashi2': require('../assets/photos/gallery/dashbashi2.jpg'),
  'uplistsikhe2': require('../assets/photos/gallery/uplistsikhe2.jpg'),
  'tsinandali': require('../assets/photos/gallery/tsinandali.jpg'),
  'gergeti': require('../assets/photos/gallery/gergeti.jpg'),
  'asureti2': require('../assets/photos/gallery/asureti2.jpg'),
  'algeti': require('../assets/photos/gallery/algeti.jpg'),
  'borjomi': require('../assets/photos/gallery/borjomi.jpg'),
  'gareji2': require('../assets/photos/gallery/gareji2.jpg'),
  'chronicle2': require('../assets/photos/gallery/chronicle2.jpg'),
  'kojori2': require('../assets/photos/gallery/kojori2.jpg'),
  'dmanisi': require('../assets/photos/gallery/dmanisi.jpg'),
  'telavi2': require('../assets/photos/gallery/telavi2.jpg'),
  'khertvisi': require('../assets/photos/gallery/khertvisi.jpg'),
  'prometheus': require('../assets/photos/gallery/prometheus.jpg'),
  'okatse': require('../assets/photos/gallery/okatse.jpg'),
  'zugdidi2': require('../assets/photos/gallery/zugdidi2.jpg'),
  'nikortsminda': require('../assets/photos/gallery/nikortsminda.jpg'),
  'surami2': require('../assets/photos/gallery/surami2.jpg'),
  'ilia': require('../assets/photos/gallery/ilia.jpg'),
  'ilia2': require('../assets/photos/gallery/ilia2.jpg'),
  'shiomgvime2': require('../assets/photos/gallery/shiomgvime2.jpg'),
  'abastumani2': require('../assets/photos/gallery/abastumani2.jpg'),
  'sioni2': require('../assets/photos/gallery/sioni2.jpg'),
  'lagodekhi2': require('../assets/photos/gallery/lagodekhi2.jpg'),
  'bateti2': require('../assets/photos/gallery/bateti2.jpg'),
  'martkopi2': require('../assets/photos/gallery/martkopi2.jpg'),
};

export type GalleryPhoto = { id: string; caption: string; sourceUrl: string; license: string; licenseUrl: string; credit: string };
export function routeGallery(route: Route): GalleryPhoto[] {
  const primary: GalleryPhoto = { ...route.photo, caption: route.photoCaption };
  const ids = galleryRoutes[route.id as keyof typeof galleryRoutes] ?? [];
  const extras = ids.map(id => galleryPhotos[id as keyof typeof galleryPhotos]).filter(Boolean);
  // Lead with the lake, rather than the administrative centre, for Kvareli.
  return route.id === 'kvareli-ilia' ? [...extras, primary] : [primary, ...extras];
}
export function galleryPhotoSource(photo: GalleryPhoto): ImageSourcePropType {
  return gallerySources[photo.id] ?? localPhotos[photo.id];
}
