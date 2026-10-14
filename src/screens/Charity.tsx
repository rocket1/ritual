import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { CHARITIES } from '../game/data';
import { charityName, clockOf, dayOf } from '../game/engine';
import { act, useG } from '../game/store';
import { alpha, C, F, S } from '../theme';
import { Bar, Body, Display, Italic, Label, Mono, Panel, Row, Stepper } from '../ui/kit';
import { useUi } from '../ui/nav';

const money = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function Charity() {
  const g = useG();
  const { wide } = useUi();
  const c = g.charity;
  const total = c.allocations.reduce((a, b) => a + b.pct, 0);
  const given = c.released.reduce((a, b) => a + b.amount, 0);
  const setPct = (id: string, d: number) => act((gg) => {
    const a = gg.charity.allocations.find((x) => x.id === id)!;
    a.pct = Math.max(0, Math.min(100, a.pct + d));
  });

  return (
    <ScrollView contentContainerStyle={{ padding: S.lg, gap: S.lg }}>
      <View style={{ gap: 4 }}>
        <Display size={32}>Charity</Display>
        <Body color={C.muted} style={{ maxWidth: 700 }}>
          Most of what players pay goes into a shared charity pool. Dharma rituals, and some meditations, release money from the pool to the charities you choose.
        </Body>
      </View>

      <View style={{ flexDirection: wide ? 'row' : 'column', gap: S.lg, alignItems: 'flex-start' }}>
        <View style={{ flex: 1, gap: S.lg, width: wide ? undefined : '100%' }}>
          <Panel tone={C.jade} title="Charity pool">
            <Display size={40} color={C.jade}>{money(c.pool)}</Display>
            <Mono size={11} color={C.muted}>waiting to be released by rituals · all players</Mono>
            <Row gap={S.xl}>
              <View><Label size={10}>Released by you</Label><Mono size={16} color={C.gold}>{money(given)}</Mono></View>
              <View><Label size={10}>Releases</Label><Mono size={16}>{c.released.length}</Mono></View>
            </Row>
          </Panel>
          <Panel title="Your plan">
            <Row gap={S.md} wrap>
              <PlanCard on={c.plan === 'free'} title="Free" price="$0" text="Play everything. Your rituals still release pool money." onPress={() => act((gg) => { gg.charity.plan = 'free'; })} />
              <PlanCard on={c.plan === 'devotee'} title="Devotee" price="$4.99 / mo" text="Your subscription goes into the pool. Mock only, no payment is taken." onPress={() => act((gg) => { gg.charity.plan = 'devotee'; })} />
            </Row>
          </Panel>
        </View>

        <View style={{ flex: 1.2, gap: S.lg, width: wide ? undefined : '100%' }}>
          <Panel title="Where your releases go" right={<Mono size={11} color={total === 100 ? C.jade : C.ember}>{total}% allocated</Mono>}>
            {CHARITIES.map((ch) => {
              const pct = c.allocations.find((a) => a.id === ch.id)?.pct ?? 0;
              return (
                <View key={ch.id} style={{ gap: 6, paddingVertical: 4 }}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Body style={{ fontFamily: F.bodyBold }}>{ch.name}</Body>
                      <Body size={13} color={C.muted}>{ch.cause}</Body>
                    </View>
                    <Stepper value={`${pct}%`} width={44} onMinus={() => setPct(ch.id, -5)} onPlus={() => setPct(ch.id, 5)} minusDisabled={pct === 0} plusDisabled={total >= 100} />
                  </Row>
                  <Bar value={pct} color={C.jade} height={4} />
                </View>
              );
            })}
            {total !== 100 && <Italic size={13} color={C.ember}>Allocations are scaled to 100% when money is released.</Italic>}
          </Panel>
          <Panel title="Ledger">
            {c.released.length === 0 && <Italic>Complete a Dharma ritual to release your first gift.</Italic>}
            {c.released.slice(0, 15).map((r, i) => (
              <Row key={i} gap={S.md} style={{ paddingVertical: 4, borderTopWidth: 1, borderColor: C.lineSoft }}>
                <Mono size={11} color={C.faint} style={{ width: 82 }}>day {dayOf(r.hour)} {clockOf(r.hour)}</Mono>
                <Body size={13} style={{ flex: 1 }} numberOfLines={1}>{charityName(r.charityId)}</Body>
                <Mono size={12} color={C.jade}>{money(r.amount)}</Mono>
              </Row>
            ))}
          </Panel>
        </View>
      </View>
    </ScrollView>
  );
}

function PlanCard({ on, title, price, text, onPress }: { on: boolean; title: string; price: string; text: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ checked: on }} style={{ flex: 1, minWidth: 180, padding: S.md, gap: 4, borderWidth: 1, borderRadius: 4, borderColor: on ? C.jade : C.line, backgroundColor: on ? alpha(C.jade, 0.1) : 'transparent' }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Body style={{ fontFamily: F.bodyBold }}>{title}</Body>
        <Mono size={12} color={on ? C.jade : C.muted}>{price}</Mono>
      </Row>
      <Body size={13} color={C.muted}>{text}</Body>
    </Pressable>
  );
}
