import React from 'react';
import { View } from 'react-native';
import type { Route } from '../model';
import { galleryPhotoSource, routeGallery } from '../photos';
import { Icon, Photo, Title, Txt } from './primitives';
import { PagedCarousel } from './PagedCarousel';
import { useApp } from './AppProvider';

export function PhotoGallery({ route, short }: { route: Route; short: boolean }) {
  const { colors } = useApp();
  const photos = routeGallery(route);
  return <View style={{ marginBottom: 36 }}>
    <View style={{ paddingHorizontal: 6, marginBottom: 17 }}>
      <Txt muted style={{ fontSize: 11, lineHeight: 17, letterSpacing: 1.5, fontWeight: '600', marginBottom: 8 }}>{short ? 'ПОЛНЫЙ МАРШРУТ' : 'ЧТО УВИДИМ'}</Txt>
      <Title style={{ fontSize: 29, lineHeight: 33, fontWeight: '400', letterSpacing: -1 }}>{short ? 'Фотографии мест' : 'Места по пути'}</Title>
    </View>
    <PagedCarousel key={route.id} items={photos} label="Фотографии мест" renderItem={(photo, index) => <View style={{ backgroundColor: colors.surface, borderRadius: 28, overflow: 'hidden' }}>
      <Photo source={galleryPhotoSource(photo)} caption={photo.caption} resizeMode={['gergeti', 'prometheus', 'nikortsminda', 'chronicle2'].includes(photo.id) ? 'contain' : 'cover'} height={230} />
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 11, padding: 18 }}>
        <View style={{ width: 32, height: 32, backgroundColor: colors.soft, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}><Icon name="location-outline" size={16} /></View>
        <View style={{ flex: 1, gap: 4 }}><Txt muted style={{ fontSize: 10, lineHeight: 15, letterSpacing: 1 }}>ФОТО {String(index + 1).padStart(2, '0')}</Txt><Txt style={{ fontSize: 15, lineHeight: 21 }}>{photo.caption}</Txt></View>
      </View>
    </View>} />
    {short && <Txt muted style={{ fontSize: 12, lineHeight: 19, marginTop: 10, paddingHorizontal: 4 }}>На фото — озеро Сиони из полного маршрута. В вариант «Только лес» оно не входит.</Txt>}
  </View>;
}
