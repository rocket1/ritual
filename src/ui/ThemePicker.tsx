import React, { useState } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { C, currentTextSize, currentTheme, F, fs, S, setTextSize, setTheme, TEXT_SIZES, Theme, THEMES } from '../theme';
import { Body, Btn, Display, Label, Row, Sheet } from './kit';

/** A button that opens the appearance sheet. */
export function ThemeButton({ small = true, title = 'Appearance' }: { small?: boolean; title?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Btn small={small} kind="quiet" title={title} onPress={() => setOpen(true)} />
      {open && <ThemeSheet onClose={() => setOpen(false)} />}
    </>
  );
}

function ThemeSheet({ onClose }: { onClose: () => void }) {
  const active = currentTheme().id;
  const text = currentTextSize();
  const dark = THEMES.filter((t) => t.dark);
  const light = THEMES.filter((t) => !t.dark);
  return (
    <Sheet visible onClose={onClose} width={760}>
      <Display size={26}>Appearance</Display>

      <View style={{ gap: S.sm }}>
        <Label>Text size</Label>
        <Row wrap gap={S.sm}>
          {TEXT_SIZES.map((t) => (
            <Btn key={t.id} small title={t.label} kind={t.id === text ? 'primary' : 'ghost'} onPress={() => setTextSize(t.id)} />
          ))}
        </Row>
        <Body size={14} color={C.muted}>Applies everywhere. Saved in this browser.</Body>
      </View>

      <ThemeGroup label="Dark themes" themes={dark} active={active} />
      <ThemeGroup label="Light themes" themes={light} active={active} />

      <Btn kind="primary" title="Done" onPress={onClose} />
    </Sheet>
  );
}

function ThemeGroup({ label, themes, active }: { label: string; themes: Theme[]; active: string }) {
  return (
    <View style={{ gap: S.sm }}>
      <Label>{label}</Label>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: S.sm }}>
        {themes.map((t) => <Swatch key={t.id} t={t} on={t.id === active} />)}
      </View>
    </View>
  );
}

// Each swatch is drawn in its own theme's colors, so it previews itself.
function Swatch({ t, on }: { t: Theme; on: boolean }) {
  const p = t.c;
  const narrow = useWindowDimensions().width < 600;
  return (
    <Pressable
      onPress={() => setTheme(t.id)}
      accessibilityRole="radio"
      accessibilityState={{ checked: on }}
      accessibilityLabel={`${t.name} theme`}
      style={{ width: narrow ? '48%' : '31.8%', borderRadius: 4, borderWidth: on ? 2 : 1, borderColor: on ? C.gold : C.line, overflow: 'hidden' }}
    >
      <View style={{ backgroundColor: p.bg, padding: S.md, gap: 6 }}>
        <Row gap={6}>
          <Text style={{ fontFamily: F.display, fontSize: fs(22), color: p.text }}>Aa</Text>
          <View style={{ flex: 1 }} />
          {[p.gold, p.jade, p.ember, p.lapis].map((c) => (
            <View key={c} style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c }} />
          ))}
        </Row>
        <View style={{ backgroundColor: p.surface, borderWidth: 1, borderColor: p.line, borderRadius: 3, padding: 6, gap: 4 }}>
          <View style={{ height: 4, width: '70%', backgroundColor: p.muted, borderRadius: 2, opacity: 0.6 }} />
          <View style={{ alignSelf: 'flex-start', backgroundColor: p.gold, borderRadius: 2, paddingHorizontal: 6, paddingVertical: 1 }}>
            <Text style={{ fontFamily: F.monoBold, fontSize: fs(9), color: p.onAccent }}>PERFORM</Text>
          </View>
        </View>
        <Text style={{ fontFamily: F.monoBold, fontSize: fs(11), color: p.muted, letterSpacing: 1 }}>{t.name.toUpperCase()}{on ? ' · ON' : ''}</Text>
      </View>
    </Pressable>
  );
}
