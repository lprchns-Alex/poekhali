import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type WeatherShape = 'sun' | 'partly' | 'cloud' | 'fog' | 'rain' | 'snow' | 'thunder' | 'unknown';
type Dot = { x: number; y: number };

const circle = (x: number, y: number, cx: number, cy: number, radius: number) =>
  (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2;

function sun(x: number, y: number, cx = 0, cy = 0, radius = 5.8) {
  const dx = x - cx;
  const dy = y - cy;
  if (circle(x, y, cx, cy, radius)) return true;
  const distance = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);
  const ray = Math.abs(Math.sin(angle * 4)) < 0.19;
  return distance >= radius + 2.1 && distance <= radius + 3.9 && ray;
}

function cloud(x: number, y: number) {
  return y <= 3 && (
    circle(x, y, -5, 0, 3.5) ||
    circle(x, y, 0, -2.5, 4.5) ||
    circle(x, y, 5, 0.5, 3.8) ||
    (x >= -5 && x <= 5 && y >= -1 && y <= 3)
  );
}

function isDot(shape: WeatherShape, x: number, y: number) {
  switch (shape) {
    case 'sun': return sun(x, y);
    case 'partly': return cloud(x, y - 1) || (y < 1 && sun(x, y, -4, -4, 3.3));
    case 'cloud': return cloud(x, y);
    case 'fog': return y >= -4 && y <= 5 && (y + 4) % 3 === 0 && Math.abs(x) <= (y === -4 ? 5 : 8);
    case 'rain':
      return cloud(x, y + 2) || (y >= 4 && y <= 8 && ((x + y + 30) % 5 === 0) && Math.abs(x) <= 6);
    case 'snow':
      return cloud(x, y + 2) || [-5, 0, 5].some(cx =>
        (y === 6 && Math.abs(x - cx) <= 1) || (x === cx && (y === 5 || y === 7)));
    case 'thunder':
      return cloud(x, y + 3) || (
        (y >= 2 && y <= 5 && x >= 1 - y && x <= 4 - y) ||
        (y >= 5 && y <= 9 && x >= 5 - y && x <= 7 - y)
      );
    default: return y === 0 && Math.abs(x) <= 4;
  }
}

const shapes: WeatherShape[] = ['sun', 'partly', 'cloud', 'fog', 'rain', 'snow', 'thunder', 'unknown'];
const dots = Object.fromEntries(shapes.map(shape => {
  const points: Dot[] = [];
  for (let y = -12; y <= 12; y++) {
    for (let x = -12; x <= 12; x++) {
      if (isDot(shape, x, y)) points.push({ x, y });
    }
  }
  return [shape, points];
})) as Record<WeatherShape, Dot[]>;

function weatherShape(code: number | null): WeatherShape {
  if (code === null || !Number.isFinite(code)) return 'unknown';
  if (code === 0 || code === 1) return 'sun';
  if (code === 2) return 'partly';
  if (code === 3) return 'cloud';
  if (code === 45 || code === 48) return 'fog';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if (code >= 95) return 'thunder';
  return 'unknown';
}

/** Decorative WMO illustration; the parent supplies the readable weather summary. */
export const DotWeather = memo(function DotWeather({ code, size = 100, color = '#171713' }: {
  code: number | null;
  size?: number;
  color?: string;
}) {
  const step = size / 25;
  const diameter = step * 0.53;
  return (
    <View
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size, flexShrink: 0, pointerEvents: 'none' }}
    >
      {dots[weatherShape(code)].map(({ x, y }) => (
        <View key={`${x}:${y}`} style={{
          position: 'absolute',
          left: size / 2 + x * step - diameter / 2,
          top: size / 2 + y * step - diameter / 2,
          width: diameter,
          height: diameter,
          borderRadius: diameter / 2,
          backgroundColor: color,
        }} />
      ))}
    </View>
  );
});

const tickAngles = Array.from({ length: 120 }, (_, index) => index * 3);
const directions = [
  { label: 'N', x: 0.5, y: 0.18 },
  { label: 'E', x: 0.82, y: 0.5 },
  { label: 'S', x: 0.5, y: 0.82 },
  { label: 'W', x: 0.18, y: 0.5 },
];

/** Static decoration, deliberately hidden from accessibility; this is not a device compass. */
export const Compass = memo(function Compass({ size = 180, color = '#171713', mutedColor = '#A5A59B' }: {
  size?: number;
  color?: string;
  mutedColor?: string;
}) {
  const tickWidth = Math.max(1, size / 200);
  const pin = size * 0.037;
  return (
    <View
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size, flexShrink: 0, pointerEvents: 'none' }}
    >
      {tickAngles.map((angle, index) => {
        const height = size * (index % 10 === 0 ? 0.068 : 0.043);
        const radius = size * 0.456;
        const radians = angle * Math.PI / 180;
        return <View key={angle} style={{
          position: 'absolute',
          width: tickWidth,
          height,
          left: size / 2 + Math.sin(radians) * radius - tickWidth / 2,
          top: size / 2 - Math.cos(radians) * radius - height / 2,
          backgroundColor: mutedColor,
          opacity: index % 10 === 0 ? 0.82 : 0.48,
          transform: [{ rotate: `${angle}deg` }],
        }} />;
      })}
      {directions.map(({ label, x, y }) => (
        <Text key={label} allowFontScaling={false} style={{
          position: 'absolute',
          color,
          left: size * x - size * 0.07,
          top: size * y - size * 0.06,
          width: size * 0.14,
          height: size * 0.12,
          fontSize: size * 0.088,
          lineHeight: size * 0.12,
          fontWeight: '700',
          textAlign: 'center',
        }}>{label}</Text>
      ))}
      <View style={[styles.triangle, {
        left: size * 0.462,
        top: size * 0.285,
        borderLeftWidth: size * 0.038,
        borderRightWidth: size * 0.038,
        borderBottomWidth: size * 0.215,
        borderBottomColor: color,
      }]} />
      <View style={[styles.triangle, {
        left: size * 0.462,
        top: size * 0.5,
        borderLeftWidth: size * 0.038,
        borderRightWidth: size * 0.038,
        borderTopWidth: size * 0.215,
        borderTopColor: mutedColor,
      }]} />
      <View style={{
        position: 'absolute',
        left: size / 2 - pin / 2,
        top: size / 2 - pin / 2,
        width: pin,
        height: pin,
        borderRadius: pin / 2,
        backgroundColor: '#ECECE5',
      }} />
    </View>
  );
});

const styles = StyleSheet.create({
  triangle: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});
