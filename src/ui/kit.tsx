import React from 'react';
import {
  Modal, Platform, Pressable, ScrollView, StyleProp, StyleSheet, Text, TextProps, TextStyle, View, ViewStyle,
} from 'react-native';
import { alpha, C, F, fs, mix, S } from '../theme';

type TProps = TextProps & { style?: StyleProp<TextStyle>; color?: string; size?: number };

export function Display({ style, color, size = 28, ...p }: TProps) {
  return <Text {...p} style={[{ fontFamily: F.display, color: color ?? C.text, fontSize: fs(size), lineHeight: fs(size * 1.18), letterSpacing: 0.4 }, style]} />;
}
export function Body({ style, color, size = 16, ...p }: TProps) {
  return <Text {...p} style={[{ fontFamily: F.body, color: color ?? C.text, fontSize: fs(size), lineHeight: fs(size * 1.45) }, style]} />;
}
export function Italic({ style, color, size = 16, ...p }: TProps) {
  return <Text {...p} style={[{ fontFamily: F.bodyItalic, color: color ?? C.muted, fontSize: fs(size), lineHeight: fs(size * 1.45) }, style]} />;
}
export function Mono({ style, color, size = 13, ...p }: TProps) {
  return <Text {...p} style={[{ fontFamily: F.mono, color: color ?? C.text, fontSize: fs(size), fontVariant: ['tabular-nums'] }, style]} />;
}
/** Small uppercase label used for section eyebrows and field names. */
export function Label({ style, color, size = 11, ...p }: TProps) {
  return <Text {...p} style={[{ fontFamily: F.monoBold, color: color ?? C.faint, fontSize: fs(size), letterSpacing: 1.4, textTransform: 'uppercase' }, style]} />;
}

type BtnKind = 'primary' | 'ghost' | 'danger' | 'quiet';
export function Btn({
  title, onPress, kind = 'ghost', small, disabled, style, color, onPressIn, onPressOut,
}: {
  title: string; onPress?: () => void; kind?: BtnKind; small?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle>; color?: string;
  onPressIn?: () => void; onPressOut?: () => void;
}) {
  const tint = color ?? (kind === 'danger' ? C.ember : C.gold);
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={(state) => {
        const { pressed, hovered, focused } = state as { pressed: boolean; hovered?: boolean; focused?: boolean };
        const base: ViewStyle = {
          paddingVertical: small ? 6 : 10,
          paddingHorizontal: small ? 10 : 16,
          borderRadius: 3,
          borderWidth: 1,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.4 : 1,
        };
        if (kind === 'primary') Object.assign(base, { backgroundColor: pressed ? C.goldDim : hovered ? mix(tint, C.text, 0.18) : tint, borderColor: tint });
        else if (kind === 'quiet') Object.assign(base, { backgroundColor: hovered ? C.raised : 'transparent', borderColor: 'transparent' });
        else Object.assign(base, { backgroundColor: pressed ? alpha(tint, 0.25) : hovered ? alpha(tint, 0.12) : 'transparent', borderColor: alpha(tint, 0.6) });
        if (focused && Platform.OS === 'web') Object.assign(base, { outlineColor: C.gold, outlineWidth: 2, outlineStyle: 'solid' });
        return [base, style];
      }}
    >
      <Text style={{ fontFamily: F.monoBold, fontSize: fs(small ? 11 : 12), letterSpacing: 1.1, textTransform: 'uppercase', color: kind === 'primary' ? C.onAccent : tint }}>
        {title}
      </Text>
    </Pressable>
  );
}

export function Panel({ title, right, children, style, tone }: { title?: string; right?: React.ReactNode; children?: React.ReactNode; style?: StyleProp<ViewStyle>; tone?: string }) {
  return (
    <View style={[s.panel, tone ? { borderColor: alpha(tone, 0.55), backgroundColor: alpha(tone, 0.06) } : null, style]}>
      {(title || right) && (
        <View style={s.panelHead}>
          {title ? <Label color={tone ?? C.muted}>{title}</Label> : <View />}
          {right}
        </View>
      )}
      {children}
    </View>
  );
}

export function Bar({ value, max = 100, color = C.gold, height = 6 }: { value: number; max?: number; color?: string; height?: number }) {
  const pct = Math.max(0, Math.min(1, value / max));
  return (
    <View style={{ height, backgroundColor: C.sunken, borderRadius: height, overflow: 'hidden', borderWidth: 1, borderColor: C.lineSoft }}>
      <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: color }} />
    </View>
  );
}

export function Chip({ text, color = C.muted, filled }: { text: string; color?: string; filled?: boolean }) {
  return (
    <View style={{ alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 2, borderWidth: 1, borderColor: alpha(color, 0.6), backgroundColor: filled ? alpha(color, 0.18) : 'transparent' }}>
      <Text style={{ fontFamily: F.monoBold, fontSize: fs(10), letterSpacing: 1, textTransform: 'uppercase', color }}>{text}</Text>
    </View>
  );
}

export function GodMark({ glyph, color, size = 40 }: { glyph: string; color: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 1.5, borderColor: color, backgroundColor: alpha(color, 0.14), alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color, fontSize: size * 0.5, lineHeight: size * 0.62, textAlign: 'center' }}>{glyph}</Text>
    </View>
  );
}

export function Stepper({ value, onMinus, onPlus, minusDisabled, plusDisabled, width = 36 }: { value: string | number; onMinus: () => void; onPlus: () => void; minusDisabled?: boolean; plusDisabled?: boolean; width?: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Btn small title="−" onPress={onMinus} disabled={minusDisabled} />
      <Mono style={{ width: fs(width), textAlign: 'center' }}>{value}</Mono>
      <Btn small title="+" onPress={onPlus} disabled={plusDisabled} />
    </View>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[{ height: 1, backgroundColor: C.lineSoft }, style]} />;
}

export function Row({ children, style, gap = S.sm, wrap }: { children?: React.ReactNode; style?: StyleProp<ViewStyle>; gap?: number; wrap?: boolean }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap, flexWrap: wrap ? 'wrap' : 'nowrap' }, style]}>{children}</View>;
}

export function Sheet({ visible, onClose, children, width = 560, dismissable = true }: { visible: boolean; onClose: () => void; children: React.ReactNode; width?: number; dismissable?: boolean }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={dismissable ? onClose : undefined}>
      <View style={s.scrim}>
        <Pressable style={StyleSheet.absoluteFill} onPress={dismissable ? onClose : undefined} accessibilityLabel="Close" />
        <View style={[s.sheet, { maxWidth: width }]}>
          <ScrollView contentContainerStyle={{ padding: S.xl, gap: S.lg }} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function Stat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Label size={10}>{label}</Label>
      <Mono size={16} color={color ?? C.text}>{value}</Mono>
    </View>
  );
}

// Shared styles are getters so they pick up the current theme and text size.
export const s = {
  get panel(): ViewStyle { return { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 4, padding: S.lg, gap: S.md }; },
  get panelHead(): ViewStyle { return { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }; },
  get scrim(): ViewStyle { return { flex: 1, backgroundColor: alpha(C.sunken, 0.82), alignItems: 'center', justifyContent: 'center', padding: S.lg }; },
  get sheet(): ViewStyle { return { width: '100%', maxHeight: '92%', backgroundColor: C.surface, borderWidth: 1, borderColor: C.goldDim, borderRadius: 4 }; },
  get input(): TextStyle { return { fontFamily: F.body, fontSize: fs(16), color: C.text, backgroundColor: C.sunken, borderWidth: 1, borderColor: C.line, borderRadius: 3, paddingHorizontal: 12, paddingVertical: 10 }; },
};
