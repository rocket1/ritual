import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { C, fs } from '../theme';

// Altar flame inside a ring: the app's mark, drawn on a 32-unit grid.
export function Logo({ size = 32, color }: { size?: number; color?: string }) {
  const c = color ?? C.gold;
  const px = fs(size);
  return (
    <Svg width={px} height={px} viewBox="0 0 32 32" accessibilityLabel="Ritual logo">
      <Circle cx={16} cy={16} r={14.5} stroke={c} strokeWidth={1.5} fill="none" />
      <Path d="M16 6.5c3.2 3.4 4.6 6 4.6 8.4a4.6 4.6 0 0 1-9.2 0c0-1.6.7-3 1.9-4.3.2 1.4.9 2.3 1.8 2.6-.5-2.4.1-4.6.9-6.7z" fill={c} />
      <Rect x={10} y={21} width={12} height={1.8} rx={0.4} fill={c} />
      <Rect x={12} y={23.6} width={8} height={1.8} rx={0.4} fill={c} />
    </Svg>
  );
}
