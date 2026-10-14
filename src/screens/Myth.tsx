import React from 'react';
import { ScrollView, View } from 'react-native';
import { clockOf, dayOf, mythShift, PLAYER } from '../game/engine';
import { act, useG } from '../game/store';
import { C, fs, S } from '../theme';
import { Body, Btn, Display, GodMark, Italic, Label, Mono, Panel, Row } from '../ui/kit';
import { useUi } from '../ui/nav';

export function Myth() {
  const g = useG();
  const { wide } = useUi();
  const offspring = g.gods.filter((x) => x.parentId === PLAYER);
  return (
    <ScrollView contentContainerStyle={{ padding: S.lg, gap: S.lg }}>
      <View style={{ gap: 4 }}>
        <Display size={32}>The Myth</Display>
        <Body color={C.muted} style={{ maxWidth: 700 }}>
          Your god's attributes together are its myth, and the myth changes on its own. Small drifts happen daily. Sometimes your god turns wrathful, splits into a new sect, or fuses with its offspring. You do not control this.
        </Body>
      </View>
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: S.lg, alignItems: 'flex-start' }}>
        <Panel title="Chronicle" style={{ flex: 2, width: wide ? undefined : '100%' }}>
          {g.chronicle.map((e) => (
            <Row key={e.id} gap={S.md} style={{ alignItems: 'flex-start', paddingVertical: S.sm, borderTopWidth: 1, borderColor: C.lineSoft }}>
              <View style={{ width: fs(70) }}>
                <Mono size={11} color={C.muted}>day {dayOf(e.hour)}</Mono>
                <Mono size={10} color={C.faint}>{clockOf(e.hour)}</Mono>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                {e.major ? <Display size={18} color={C.gold}>{e.title}</Display> : <Label>{e.title}</Label>}
                <Body size={e.major ? 15 : 14} color={e.major ? C.text : C.muted}>{e.text}</Body>
              </View>
            </Row>
          ))}
        </Panel>
        <View style={{ flex: 1, gap: S.lg, width: wide ? undefined : '100%' }}>
          <Panel title="Offspring and sects">
            {offspring.length === 0 ? (
              <Italic>None yet. A schism can happen once your faith holds four or more villages.</Italic>
            ) : offspring.map((o) => (
              <Row key={o.id} gap={S.md}>
                <GodMark glyph={o.glyph} color={o.color} size={36} />
                <View style={{ flex: 1 }}>
                  <Body>{o.name}</Body>
                  <Italic size={13}>{o.epithet}</Italic>
                </View>
              </Row>
            ))}
          </Panel>
          <Panel title="Mockup controls" tone={C.violet}>
            <Body size={14} color={C.muted}>Myth changes normally come about once every few days. Force one to see what happens.</Body>
            <Btn color={C.violet} title="Stir the myth" onPress={() => act((gg) => mythShift(gg, true))} />
          </Panel>
        </View>
      </View>
    </ScrollView>
  );
}
