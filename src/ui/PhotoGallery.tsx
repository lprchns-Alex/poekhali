import React from 'react';
import { View } from 'react-native';
import type { Route } from '../model';
import { galleryPhotoSource, routeGallery } from '../photos';
import { Photo, Txt } from './primitives';
import { PagedCarousel } from './PagedCarousel';

export function PhotoGallery({ route, short }: { route: Route; short: boolean }) {
  const photos = routeGallery(route);
  return <View style={{ marginBottom: 28 }}>
    <PagedCarousel key={route.id} items={photos} label="Фотографии мест" renderItem={photo => <View>
      <Photo source={galleryPhotoSource(photo)} caption={photo.caption} resizeMode={['gergeti', 'prometheus', 'nikortsminda', 'chronicle2'].includes(photo.id) ? 'contain' : 'cover'} height={230} style={{ borderRadius: 12 }} />
      <Txt style={{ fontSize: 14, lineHeight: 20, marginTop: 10, paddingHorizontal: 2 }}>{photo.caption}</Txt>
    </View>} />
    {short && <Txt muted style={{ fontSize: 12, lineHeight: 18, marginTop: 8 }}>На фото — озеро Сиони из полного маршрута. В вариант «Только лес» оно не входит.</Txt>}
  </View>;
}
