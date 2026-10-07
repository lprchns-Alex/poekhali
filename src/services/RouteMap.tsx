import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import type { Route } from '../model';

export type RouteMapProps = {
  routes: Route[];
  selectedRouteId?: string;
  onSelectRoute?: (id: string) => void;
  dark?: boolean;
  height?: number;
};

type MapStatus = 'loading' | 'ready' | 'partial' | 'error' | 'blocked';
type MapPoint = { id: string; latitude: number; longitude: number; title: string; label: string; selected: boolean };

// A denied/rate-limited service is not retried by navigation or automatic reloads.
let tileAccessDenied = false;

// Leaflet 1.9.4 is the stable release; 2.0 is currently a prerelease.
// https://leafletjs.com/download.html
// OSM tiles: viewport requests only, browser/WebView HTTP cache, visible attribution.
// https://operations.osmfoundation.org/policies/tiles/
const REFERENCE_LINKS = {
  copyright: 'https://www.openstreetmap.org/copyright',
  report: 'https://www.openstreetmap.org/fixthemap',
  leaflet: 'https://leafletjs.com',
} as const;

function isReference(value: unknown): value is keyof typeof REFERENCE_LINKS {
  return value === 'copyright' || value === 'report' || value === 'leaflet';
}

function isMapDocument(url: string): boolean {
  return url === 'about:blank' || url === 'about:srcdoc';
}

// JSON inside an inline script must not be able to close the script element.
function scriptJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

function documentKey(value: string): string {
  let hash = 5381;
  for (let index = 0; index < value.length; index++) hash = (hash * 33) ^ value.charCodeAt(index);
  return (hash >>> 0).toString(36);
}

function overviewStop(route: Route, routes: Route[]) {
  const first = route.stops[0];
  const isUnique = (stop: Route['stops'][number]) => routes.every(other => other.id === route.id ||
    other.stops[0]?.latitude !== stop.latitude || other.stops[0]?.longitude !== stop.longitude);
  // An overnight extension can start at the same place as a day trip (Ananuri).
  // Give it a distinct destination pin so both routes remain tappable in the overview.
  if (route.days > 1 && !isUnique(first)) return [...route.stops].reverse().find(isUnique) ?? first;
  return first;
}

function routePoints(routes: Route[], selectedRouteId?: string): MapPoint[] {
  const points: MapPoint[] = [];
  routes.forEach((route, routeIndex) => {
    const selected = route.id === selectedRouteId;
    const stops = selected ? route.stops : [overviewStop(route, routes)];
    stops.forEach((stop, stopIndex) => {
      if (!Number.isFinite(stop.latitude) || !Number.isFinite(stop.longitude) || Math.abs(stop.latitude) > 85 || Math.abs(stop.longitude) > 180) return;
      const title = selected ? stop.name : route.subtitle;
      const label = String(selected ? stopIndex + 1 : routeIndex + 1);
      // Multiple activities at one physical anchor stay at that real coordinate.
      const duplicate = points.find(point => point.id === route.id && point.latitude === stop.latitude && point.longitude === stop.longitude);
      if (duplicate) {
        duplicate.title += ` · ${title}`;
        duplicate.label += `·${label}`;
      } else {
        points.push({ id: route.id, latitude: stop.latitude, longitude: stop.longitude, title, label, selected });
      }
    });
  });
  return points;
}

function mapHtml(points: MapPoint[], channel: string, dark: boolean, parentOrigin: string): string {
  const background = dark ? '#242621' : '#DDDED4';
  const foreground = dark ? '#F1F0E7' : '#171813';
  const surface = dark ? '#32352E' : '#FFFFFF';
  return `<!doctype html>
<html lang="ru"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="referrer" content="origin-when-cross-origin">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${channel}' https://unpkg.com; style-src 'unsafe-inline' https://unpkg.com; img-src blob: data:; connect-src https://tile.openstreetmap.org; font-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="anonymous">
<style>
html,body,#map{height:100%;width:100%;margin:0;background:${background}}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;overflow:hidden}
.leaflet-container{font-family:inherit;background:${background};color:${foreground}}
.leaflet-tile-pane{${dark ? 'filter:brightness(.77) saturate(.7)' : ''}}
.leaflet-control-zoom{border:0!important;box-shadow:0 2px 10px #173c3026!important;border-radius:14px!important;overflow:hidden}
.leaflet-control-zoom a{width:44px!important;height:44px!important;line-height:44px!important;background:${surface}!important;color:${foreground}!important;font-size:23px!important}
.leaflet-control-attribution{font-size:10px!important;line-height:17px!important;background:${surface}!important;color:${foreground}!important;padding:2px 6px!important;max-width:calc(100vw - 12px);box-sizing:border-box}
.leaflet-bottom .leaflet-control-attribution{margin-bottom:4px}
.leaflet-control-attribution a{color:${foreground}!important}
.map-pin{border:0!important;background:transparent!important;display:grid!important;place-items:center!important}
.pin-face{display:grid;place-items:center;width:32px;height:32px;border-radius:50%;border:2px solid white;background:#42483A;color:white;font-weight:750;font-size:13px;box-shadow:0 3px 10px #14382b40}
.selected .pin-face{width:38px;height:38px;background:#FFDF55;color:#171813;border:3px solid #171813;font-size:14px}
.map-pin:focus-visible .pin-face{outline:3px solid #1B80CB;outline-offset:3px}
.leaflet-popup-content-wrapper,.leaflet-popup-tip{background:${surface};color:${foreground}}
.leaflet-popup-content{font-size:14px;line-height:20px;margin:14px 20px 14px 14px;max-width:220px}
.place-name{font-weight:700;margin-bottom:4px}.place-note{font-size:12px;line-height:17px;opacity:.76}
.map-caption{position:absolute;z-index:700;top:12px;left:12px;background:${surface};color:${foreground};border:1px solid ${dark ? '#52564B' : '#B1B2AA'};border-radius:20px;padding:7px 11px;font-size:11px;font-weight:650;pointer-events:none;box-shadow:0 2px 8px #14382b0a}
</style></head><body>
<div id="map" role="region" aria-label="Места поездок по Грузии"></div>
<div class="map-caption">Места поездки · обзорная карта</div>
<script nonce="${channel}">
(function(){
  'use strict';
  var channel=${scriptJson(channel)}, points=${scriptJson(points)}, parentOrigin=${scriptJson(parentOrigin)};
  var currentStatus='loading',resourceFailed=false,accessDenied=false,tileSequence=0;
  var pendingTiles=new Map();
  function send(type,extra){
    var payload=Object.assign({sender:'poekhali-route-map',channel:channel,type:type},extra||{});
    if(window.ReactNativeWebView){window.ReactNativeWebView.postMessage(JSON.stringify(payload));}
    else if(window.parent!==window){window.parent.postMessage(payload,parentOrigin);}
  }
  function status(value){if(accessDenied&&value!=='blocked')return;if(resourceFailed&&value!=='error')return;if(currentStatus!==value){currentStatus=value;send('status',{status:value});}}
  // No user/catalog text is used as HTML, and only fixed reference links leave this document.
  document.addEventListener('click',function(event){
    var anchor=event.target instanceof Element ? event.target.closest('a') : null;
    if(!anchor) return;
    var href=anchor.getAttribute('href')||'';
    if(href==='#'||href==='') return;
    event.preventDefault();
    var links=${scriptJson(REFERENCE_LINKS)};
    Object.keys(links).some(function(key){if(anchor.href.replace(/\\/$/,'')===links[key]){send('reference',{reference:key});return true;}return false;});
  },true);
  var deadline=setTimeout(function(){if(currentStatus==='loading') status('error');},15000);
  window.addEventListener('error',function(event){if(event.target instanceof HTMLScriptElement || event.target instanceof HTMLLinkElement){resourceFailed=true;status('error');}},true);
  function boot(){
    if(!window.L){status('error');return;}
    try {
      var map=L.map('map',{zoomControl:false,attributionControl:true,scrollWheelZoom:false});
      L.control.zoom({position:'bottomright',zoomInTitle:'Приблизить',zoomOutTitle:'Отдалить'}).addTo(map);
      map.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');
      function denyAccess(){
        accessDenied=true;clearTimeout(deadline);status('blocked');
        pendingTiles.forEach(function(request){request.cancel();});pendingTiles.clear();
        map.removeLayer(tiles);
      }
      // Inspect the HTTP response before displaying an image: OSM error responses
      // can themselves contain PNGs, which an ordinary image loader treats as success.
      function deliverTile(requestId,responseStatus,bytes){
        var request=pendingTiles.get(requestId);if(!request)return;
        if(responseStatus===403||responseStatus===429){denyAccess();return;}
        pendingTiles.delete(requestId);
        if(responseStatus!==200||!(bytes instanceof ArrayBuffer)||bytes.byteLength>1048576){request.fail();return;}
        request.show(bytes);
      }
      window.addEventListener('message',function(event){
        if(event.source!==window.parent||event.origin!==parentOrigin)return;
        var data=event.data;
        if(!data||data.sender!=='poekhali-route-map-host'||data.channel!==channel||data.type!=='tile')return;
        if(!Number.isSafeInteger(data.requestId))return;
        deliverTile(data.requestId,data.status,data.bytes);
      });
      var CheckedTiles=L.TileLayer.extend({createTile:function(coords,done){
        var tile=document.createElement('img'),requestId=++tileSequence,objectUrl;
        tile.alt='';tile.setAttribute('role','presentation');
        var controller=new AbortController(),finished=false;
        function release(){if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl=undefined;}}
        function finish(error){if(finished)return;finished=true;release();done(error,tile);}
        var request={
          cancel:function(){controller.abort();release();finished=true;pendingTiles.delete(requestId);if(!window.ReactNativeWebView)send('cancelTile',{requestId:requestId});},
          fail:function(){finish(new Error('Tile unavailable'));},
          show:function(bytes){if(finished)return;objectUrl=URL.createObjectURL(new Blob([bytes],{type:'image/png'}));tile.onload=function(){finish(null);};tile.onerror=function(){finish(new Error('Invalid tile'));};tile.src=objectUrl;}
        };
        tile._cancelRequest=request.cancel;
        pendingTiles.set(requestId,request);
        if(accessDenied){request.cancel();return tile;}
        if(window.ReactNativeWebView){
          // The native WebView adds the stable Poekhali/1.0 application User-Agent.
          fetch(this.getTileUrl(coords),{signal:controller.signal,credentials:'omit',cache:'default'}).then(function(response){
            if(response.status===403||response.status===429){deliverTile(requestId,response.status);return;}
            if(!response.ok||!(response.headers.get('content-type')||'').includes('image/png')){deliverTile(requestId,0);return;}
            return response.arrayBuffer().then(function(bytes){deliverTile(requestId,200,bytes);});
          }).catch(function(){deliverTile(requestId,0);});
        } else {
          // The host browser requests tiles with its actual page Referer while this
          // document remains sandboxed. No arbitrary URL crosses the message bridge.
          send('tile',{requestId:requestId,z:coords.z,x:coords.x,y:coords.y});
        }
        return tile;
      }});
      var tiles=new CheckedTiles('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
        maxZoom:18,minZoom:4,keepBuffer:1,updateWhenIdle:true,
        attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors · <a href="https://www.openstreetmap.org/fixthemap">Исправить</a>'
      });
      tiles.on('tileunload',function(event){if(event.tile._cancelRequest)event.tile._cancelRequest();});
      var loaded=0,failed=0;
      tiles.on('loading',function(){loaded=0;failed=0;clearTimeout(deadline);deadline=setTimeout(function(){status(loaded?'partial':'error');},15000);});
      tiles.on('tileload',function(){loaded++;if(currentStatus==='loading'||currentStatus==='error')status('ready');});
      tiles.on('tileerror',function(){failed++;});
      tiles.on('load',function(){clearTimeout(deadline);status(failed ? (loaded ? 'partial':'error') : 'ready');});
      tiles.addTo(map);
      var bounds=[];
      points.forEach(function(point){
        var pin=document.createElement('div'); pin.className='pin-face'; pin.textContent=point.label;
        var icon=L.divIcon({className:'map-pin'+(point.selected?' selected':''),html:pin,iconSize:[48,48],iconAnchor:[24,24],popupAnchor:[0,-20]});
        var popup=document.createElement('div'),name=document.createElement('div'),note=document.createElement('div');
        name.className='place-name';name.textContent=point.title;
        note.className='place-note';note.textContent='Ориентир на карте. Точный подъезд нужно проверить.';
        popup.appendChild(name);popup.appendChild(note);
        var marker=L.marker([point.latitude,point.longitude],{icon:icon,title:point.title,alt:point.title,keyboard:true,zIndexOffset:point.selected?100:0}).addTo(map);
        marker.bindPopup(popup,{closeButton:true,maxWidth:250});
        marker.on('click',function(){send('select',{id:point.id});});
        bounds.push([point.latitude,point.longitude]);
      });
      if(bounds.length>1)map.fitBounds(bounds,{paddingTopLeft:[42,64],paddingBottomRight:[56,36],maxZoom:12,animate:false});
      else if(bounds.length===1)map.setView(bounds[0],11);
      else map.setView([41.9,44.9],8);
      window.addEventListener('resize',function(){map.invalidateSize({animate:false});});
      if(typeof ResizeObserver==='function')new ResizeObserver(function(){map.invalidateSize({animate:false});}).observe(document.getElementById('map'));
    } catch(error){status('error');}
  }
  var script=document.createElement('script');
  script.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  script.integrity='sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
  script.crossOrigin='anonymous';script.onload=boot;script.onerror=function(){status('error');};
  document.head.appendChild(script);
})();
</script></body></html>`;
}

/** Overview anchors only. No connecting straight lines or turn-by-turn navigation. */
export function RouteMap({ routes, selectedRouteId, onSelectRoute, dark = false, height = 320 }: RouteMapProps) {
  const instanceId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [attempt, setAttempt] = useState(0);
  const [accessBlocked, setAccessBlocked] = useState(() => tileAccessDenied);
  const [loadState, setLoadState] = useState<{ channel: string; status: MapStatus }>({ channel: '', status: 'loading' });
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const pointsJson = JSON.stringify(routePoints(routes, selectedRouteId));
  const channel = `poekhali${instanceId}attempt${attempt}document${documentKey(pointsJson + dark)}`;
  const status: MapStatus = accessBlocked ? 'blocked' : loadState.channel === channel ? loadState.status : 'loading';
  const setStatus = useCallback((next: MapStatus) => setLoadState({ channel, status: next }), [channel]);
  const parentOrigin = Platform.OS === 'web' && typeof window !== 'undefined' && /^https?:$/.test(window.location.protocol) ? window.location.origin : '*';
  const html = useMemo(() => mapHtml(JSON.parse(pointsJson) as MapPoint[], channel, dark, parentOrigin), [pointsJson, channel, dark, parentOrigin]);
  const background = dark ? '#242621' : '#CECECA';
  const foreground = dark ? '#F1F0E7' : '#171813';
  const mapHeight = Number.isFinite(height) ? Math.max(180, height) : 320;

  const handleMessage = useCallback((value: unknown) => {
    let message: unknown = value;
    if (typeof value === 'string') {
      if (value.length > 2048) return;
      try { message = JSON.parse(value); } catch { return; }
    }
    if (!message || typeof message !== 'object') return;
    const data = message as Record<string, unknown>;
    if (data.sender !== 'poekhali-route-map' || data.channel !== channel) return;
    if (data.type === 'select' && typeof data.id === 'string' && routes.some(route => route.id === data.id)) {
      onSelectRoute?.(data.id);
    } else if (data.type === 'status' && (data.status === 'ready' || data.status === 'partial' || data.status === 'error' || data.status === 'blocked')) {
      if (data.status === 'blocked') {
        tileAccessDenied = true;
        setAccessBlocked(true);
      } else setStatus(data.status);
    } else if (data.type === 'reference' && isReference(data.reference)) {
      void Linking.openURL(REFERENCE_LINKS[data.reference]).catch(() => undefined);
    }
  }, [channel, onSelectRoute, routes, setStatus]);

  useEffect(() => {
    const timer = setTimeout(() => setLoadState(current => current.channel !== channel || current.status === 'loading' ? { channel, status: 'error' } : current), 18000);
    return () => clearTimeout(timer);
  }, [channel]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    let disposed = false;
    const requests = new Map<number, AbortController>();
    const reply = (requestId: number, responseStatus: number, bytes?: ArrayBuffer) => {
      if (disposed) return;
      // Opaque sandbox origins require '*'; the recipient checks our exact origin,
      // window identity and document channel before accepting these image bytes.
      frameRef.current?.contentWindow?.postMessage({ sender: 'poekhali-route-map-host', channel, type: 'tile', requestId, status: responseStatus, bytes }, '*', bytes ? [bytes] : []);
    };
    const loadTile = async (requestId: number, z: number, x: number, y: number) => {
      if (tileAccessDenied) { reply(requestId, 403); return; }
      const controller = new AbortController();
      requests.set(requestId, controller);
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const response = await fetch(`https://tile.openstreetmap.org/${z}/${x}/${y}.png`, {
          signal: controller.signal, credentials: 'omit', cache: 'default',
          // This is the real browser page's origin, not a fabricated Referer/UA.
          referrerPolicy: 'origin-when-cross-origin',
        });
        if (response.status === 403 || response.status === 429) {
          tileAccessDenied = true;
          reply(requestId, response.status);
          setAccessBlocked(true);
          requests.forEach(request => request.abort());
          return;
        }
        if (!response.ok || !(response.headers.get('content-type') ?? '').includes('image/png')) { reply(requestId, 0); return; }
        const bytes = await response.arrayBuffer();
        reply(requestId, bytes.byteLength <= 1048576 ? 200 : 0, bytes.byteLength <= 1048576 ? bytes : undefined);
      } catch {
        reply(requestId, 0);
      } finally {
        clearTimeout(timeout);
        requests.delete(requestId);
      }
    };
    const listener = (event: MessageEvent<unknown>) => {
      // sandbox="allow-scripts" creates an opaque origin. Both source and origin must match.
      if (event.source !== frameRef.current?.contentWindow || event.origin !== 'null') return;
      const data = event.data as Record<string, unknown> | null;
      if (!data || typeof data !== 'object' || data.sender !== 'poekhali-route-map' || data.channel !== channel) return;
      if (data.type === 'cancelTile' && Number.isSafeInteger(data.requestId)) { requests.get(data.requestId as number)?.abort(); return; }
      if (data.type === 'tile') {
        const { requestId, x, y, z } = data;
        if (![requestId, x, y, z].every(value => typeof value === 'number' && Number.isSafeInteger(value))) return;
        if ((requestId as number) < 1 || (z as number) < 4 || (z as number) > 18 || (x as number) < 0 || (y as number) < 0 || (x as number) >= 2 ** (z as number) || (y as number) >= 2 ** (z as number) || requests.has(requestId as number)) return;
        if (requests.size >= 64) { reply(requestId as number, 0); return; }
        void loadTile(requestId as number, z as number, x as number, y as number);
        return;
      }
      handleMessage(event.data);
    };
    window.addEventListener('message', listener);
    return () => { disposed = true; window.removeEventListener('message', listener); requests.forEach(request => request.abort()); };
  }, [channel, handleMessage]);

  const onNativeMessage = (event: WebViewMessageEvent) => {
    // Android WebMessageListener reports the opaque origin "null" for inline HTML;
    // iOS and the older Android bridge report its about:blank document URL.
    const trustedSource = isMapDocument(event.nativeEvent.url) || (Platform.OS === 'android' && event.nativeEvent.url === 'null');
    if (trustedSource) handleMessage(event.nativeEvent.data);
  };
  const retry = () => setAttempt(value => value + 1);
  const hasPoints = routes.some(route => route.stops.some(stop => Number.isFinite(stop.latitude) && Number.isFinite(stop.longitude)));

  return (
    <View style={[styles.container, { height: mapHeight, minHeight: mapHeight, backgroundColor: background }]}>
      {hasPoints && !accessBlocked ? (Platform.OS === 'web' ? React.createElement('iframe', {
        ref: frameRef,
        key: channel,
        title: 'Карта мест поездки по Грузии',
        srcDoc: html,
        sandbox: 'allow-scripts',
        referrerPolicy: 'origin-when-cross-origin',
        onError: () => setStatus('error'),
        style: { position: 'absolute', inset: 0, display: 'block', width: '100%', height: '100%', border: 0, backgroundColor: background },
      }) : (
        <WebView
          key={channel}
          source={{ html }}
          style={{ flex: 1, backgroundColor: background }}
          originWhitelist={['*']}
          onShouldStartLoadWithRequest={request => isMapDocument(request.url)}
          onMessage={onNativeMessage}
          onError={() => setStatus('error')}
          onHttpError={() => setStatus('error')}
          onContentProcessDidTerminate={() => setStatus('error')}
          onRenderProcessGone={() => setStatus('error')}
          onOpenWindow={() => undefined}
          javaScriptEnabled
          javaScriptCanOpenWindowsAutomatically={false}
          applicationNameForUserAgent="Poekhali/1.0"
          cacheEnabled
          incognito={false}
          thirdPartyCookiesEnabled={false}
          sharedCookiesEnabled={false}
          allowFileAccess={false}
          allowFileAccessFromFileURLs={false}
          allowUniversalAccessFromFileURLs={false}
          mixedContentMode="never"
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
          automaticallyAdjustContentInsets={false}
          textZoom={100}
        />
      )) : null}
      {!hasPoints ? (
        <View style={[styles.overlay, { backgroundColor: background }]}>
          <Text style={[styles.title, { color: foreground }]}>Нет мест на карте</Text>
          <Text style={[styles.message, { color: foreground }]}>Попробуйте изменить фильтры поездки.</Text>
        </View>
      ) : status === 'loading' || status === 'error' || status === 'blocked' ? (
        <View style={[styles.overlay, { backgroundColor: background }]} accessibilityLiveRegion="polite">
          {status === 'loading' ? <ActivityIndicator color={foreground} size="small" /> : <Text style={[styles.symbol, { color: foreground }]}>⌁</Text>}
          <Text style={[styles.title, { color: foreground }]}>{status === 'loading' ? 'Открываем карту…' : status === 'blocked' ? 'Карта сейчас недоступна' : 'Карта не загрузилась'}</Text>
          <Text style={[styles.message, { color: foreground }]}>{status === 'loading' ? 'Места и дороги OpenStreetMap' : status === 'blocked' ? 'Сервис карты ограничил доступ. Места и план поездки доступны в списке.' : 'Проверьте интернет и попробуйте ещё раз.'}</Text>
          {status === 'error' ? <Pressable accessibilityRole="button" onPress={retry} style={({ pressed }) => [styles.retry, { opacity: pressed ? 0.7 : 1 }]}><Text style={styles.retryText}>Повторить</Text></Pressable> : null}
        </View>
      ) : status === 'partial' ? (
        <View style={[styles.partial, { backgroundColor: background }]} accessibilityLiveRegion="polite">
          <Text style={[styles.partialText, { color: foreground }]}>Часть карты не загрузилась</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Повторить загрузку карты" onPress={retry} style={styles.partialRetry}><Text style={[styles.partialRetryText, { color: foreground }]}>Повторить</Text></Pressable>
        </View>
      ) : null}
    </View>
  );
}

export default RouteMap;

const styles = StyleSheet.create({
  container: { width: '100%', flexShrink: 0, overflow: 'hidden', borderRadius: 22, position: 'relative' },
  overlay: { ...StyleSheet.absoluteFill, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 10 },
  title: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  message: { fontSize: 13, lineHeight: 19, textAlign: 'center', opacity: 0.72, maxWidth: 250 },
  symbol: { fontSize: 32, lineHeight: 36, fontWeight: '600' },
  retry: { minHeight: 48, minWidth: 136, alignItems: 'center', justifyContent: 'center', borderRadius: 24, backgroundColor: '#244B39', paddingHorizontal: 22, marginTop: 4 },
  retryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  partial: { position: 'absolute', top: 8, left: 8, right: 8, minHeight: 48, paddingLeft: 12, paddingRight: 4, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 6 },
  partialText: { flex: 1, fontSize: 12, lineHeight: 17 },
  partialRetry: { minHeight: 44, minWidth: 88, paddingHorizontal: 8, justifyContent: 'center', alignItems: 'center' },
  partialRetryText: { fontSize: 12, fontWeight: '700', textDecorationLine: 'underline' },
});
