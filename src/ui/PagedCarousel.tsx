import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { IconButton, Txt } from './primitives';
import { useApp } from './AppProvider';

/** Native horizontal scrolling, with equivalent controls for mouse and keyboard. */
export function PagedCarousel<T>({ items, label, renderItem }: { items: T[]; label: string; renderItem: (item: T, index: number, active: boolean) => React.ReactNode }) {
  const { colors } = useApp();
  const scroll = useRef<ScrollView>(null);
  const [width, setWidth] = useState(0);
  const [page, setPage] = useState(0);
  const currentPage = useRef(0);
  useEffect(() => {
    scroll.current?.scrollTo({ x: currentPage.current * width, animated: false });
  }, [width]);
  const goTo = (index: number) => {
    currentPage.current = index;
    setPage(index);
    scroll.current?.scrollTo({ x: index * width, animated: false });
  };
  return <View onLayout={event => setWidth(event.nativeEvent.layout.width)} style={{ minWidth: 0 }}>
    <ScrollView ref={scroll} horizontal pagingEnabled directionalLockEnabled showsHorizontalScrollIndicator={false}
      accessibilityLabel={label} scrollEventThrottle={32} onScroll={event => {
        if (!width) return;
        const index = Math.max(0, Math.min(items.length - 1, Math.round(event.nativeEvent.contentOffset.x / width)));
        currentPage.current = index;
        setPage(index);
      }} style={{ flexGrow: 0 }}>
      {width > 0 && items.map((item, index) => <View key={index} aria-hidden={page !== index} accessibilityElementsHidden={page !== index} importantForAccessibility={page === index ? 'auto' : 'no-hide-descendants'} style={{ width, paddingHorizontal: 2 }}>{renderItem(item, index, page === index)}</View>)}
    </ScrollView>
    {items.length > 1 && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 }}>
      <Txt muted accessibilityLiveRegion="polite" style={{ flex: 1, fontSize: 13, lineHeight: 19 }}>{page + 1} / {items.length} · Листай в сторону</Txt>
      <View style={{ flexDirection: 'row', gap: 4 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {items.map((_, index) => <View key={index} style={{ width: index === page ? 18 : 5, height: 5, borderRadius: 3, backgroundColor: index === page ? colors.text : colors.border }} />)}
      </View>
      <IconButton name="chevron-back" label={`${label}: назад`} disabled={page === 0} onPress={() => goTo(page - 1)} />
      <IconButton name="chevron-forward" label={`${label}: дальше`} disabled={page === items.length - 1} onPress={() => goTo(page + 1)} />
    </View>}
  </View>;
}
