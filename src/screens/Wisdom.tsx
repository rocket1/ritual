import React from 'react';
import { ScrollView, View } from 'react-native';
import { SCROLLS } from '../game/data';
import { useG } from '../game/store';
import { alpha, C, S } from '../theme';
import { Body, Display, Italic, Label, Mono, Row } from '../ui/kit';
import { useUi } from '../ui/nav';

export function Wisdom() {
  const g = useG();
  const { wide } = useUi();
  return (
    <ScrollView contentContainerStyle={{ padding: S.lg, gap: S.lg }}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }} wrap>
        <View style={{ gap: 4 }}>
          <Display size={32}>Secret knowledge</Display>
          <Body color={C.muted} style={{ maxWidth: 640 }}>
            Each new tier, and every 400 relics you earn, unseals a scroll and grants 10 wisdom points. Spend them on omen insight, riddle hints, or contemplation.
          </Body>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Mono size={22} color={C.violet}>{g.wisdomPoints}</Mono>
          <Label>wisdom points</Label>
          <Mono size={11} color={C.faint}>next scroll at {g.nextScrollAt} lifetime relics ({g.lifetimeRelics} now)</Mono>
        </View>
      </Row>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: S.lg }}>
        {SCROLLS.map((sc, i) => {
          const open = g.scrolls.includes(i);
          return (
            <View
              key={sc.title}
              style={{
                flexGrow: 1, flexBasis: wide ? '30%' : '100%',
                minHeight: 170,
                padding: S.xl,
                gap: S.sm,
                borderRadius: 3,
                borderWidth: 1,
                borderColor: open ? alpha(C.gold, 0.4) : C.lineSoft,
                backgroundColor: open ? C.paper : C.surface,
              }}
            >
              {open ? (
                <>
                  <Label color={C.paperMuted}>{sc.title}</Label>
                  <Italic size={18} color={C.paperText}>{sc.text}</Italic>
                  <Mono size={11} color={C.paperMuted}>{sc.source}</Mono>
                </>
              ) : (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: S.sm }}>
                  <Display size={28} color={C.faint}>✧</Display>
                  <Label>Sealed</Label>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}
