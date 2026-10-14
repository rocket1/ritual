import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { KIND_INFO, TIERS, TRUTH_SHARE } from '../game/data';
import {
  ATTR_RANGE, ATTRS, attrCost, buyOmenHint, clockOf, contemplate, COSTS, dayOf, declineChallenge, extendGrace,
  feelingLucky, followersOf, godById, interpretOmen, landTiles, PLAYER, raiseAttr, refuseGrace, tilesOf,
} from '../game/engine';
import { act, useG } from '../game/store';
import { alpha, C, F, KIND_COLOR, S, TONE_COLOR } from '../theme';
import { Bar, Body, Btn, Chip, Display, GodMark, Italic, Label, Mono, Panel, Row, Stat } from '../ui/kit';
import { useUi } from '../ui/nav';
import { RitualRow } from './Rituals';


export function Temple() {
  const { wide } = useUi();
  return (
    <ScrollView contentContainerStyle={{ padding: S.lg, gap: S.lg }}>
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: S.lg, alignItems: 'flex-start' }}>
        <View style={{ flex: wide ? 1.05 : undefined, gap: S.lg, width: wide ? undefined : '100%' }}>
          <GodCard />
          <Attributes />
        </View>
        <View style={{ flex: wide ? 1.3 : undefined, gap: S.lg, width: wide ? undefined : '100%' }}>
          <OmenCard />
          <ChallengeCard />
          <TodayRituals />
          <GraceCard />
        </View>
        <View style={{ flex: wide ? 1 : undefined, gap: S.lg, width: wide ? undefined : '100%' }}>
          <HoroscopeCard />
          <AlertsCard />
        </View>
      </View>
    </ScrollView>
  );
}

function GodCard() {
  const g = useG();
  const p = g.player;
  const tiles = tilesOf(g, PLAYER).length;
  const land = landTiles(g).length;
  const next = g.tierIndex < 3 ? TIERS[g.tierIndex + 1].minTiles : Math.ceil(land * TRUTH_SHARE);
  const nextTier = g.tierIndex < 3 ? TIERS[g.tierIndex + 1].name : g.tierIndex === 3 ? 'Truth' : null;
  const kin = Object.values(g.relations).filter((r) => r.kin).length;
  return (
    <Panel style={{ borderColor: alpha(p.color, 0.6) }}>
      <Row gap={S.lg} style={{ alignItems: 'flex-start' }}>
        <GodMark glyph={p.glyph} color={p.color} size={72} />
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Label color={p.color}>Your god</Label>
          <Display size={28}>{p.name}</Display>
          <Italic size={15}>{p.epithet}</Italic>
        </View>
      </Row>
      <Body size={14} color={C.muted}>{p.profile}</Body>

      <View style={{ gap: 6 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          {TIERS.map((t, i) => (
            <View key={t.name} style={{ alignItems: 'center', gap: 4, flex: 1 }}>
              <View style={{ width: 10, height: 10, transform: [{ rotate: '45deg' }], backgroundColor: i <= g.tierIndex ? C.gold : 'transparent', borderWidth: 1, borderColor: i <= g.tierIndex ? C.gold : C.faint }} />
              <Mono size={10} color={i === g.tierIndex ? C.gold : i < g.tierIndex ? C.muted : C.faint}>{t.name}</Mono>
            </View>
          ))}
        </Row>
        <Italic size={13}>{TIERS[g.tierIndex].blurb}</Italic>
        {nextTier && (
          <View style={{ gap: 4 }}>
            <Bar value={tiles} max={next} color={C.gold} height={4} />
            <Mono size={10} color={C.faint}>{tiles} of {next} villages to become a {nextTier}</Mono>
          </View>
        )}
      </View>

      <Row gap={S.xl} wrap>
        <Stat label="Followers" value={followersOf(g, PLAYER).toLocaleString()} />
        <Stat label="Villages" value={tiles} />
        <Stat label="Army" value={g.army} />
        <Stat label="Kin gods" value={kin} />
        <Stat label="Wisdom pts" value={g.wisdomPoints} color={C.violet} />
      </Row>
      <Mono size={10} color={C.faint}>Also worshipped by @rowan.ix and @sol_ana (mock co-followers)</Mono>
    </Panel>
  );
}

function Attributes() {
  const g = useG();
  const p = g.player;
  return (
    <Panel title="The myth" right={<Mono size={11} color={C.faint}>raise with relics</Mono>}>
      {ATTRS.map((a) => {
        const cost = attrCost(g, a);
        return (
          <View key={a} style={{ gap: 5 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Row gap={6}>
                <Body style={{ fontFamily: F.bodyBold, textTransform: 'capitalize' }}>{a}</Body>
                {g.horoscope.luckyAttr === a && <Chip text="lucky today" color={C.gold} />}
              </Row>
              <Row gap={S.sm}>
                <Mono>{p.attrs[a]}</Mono>
                <Btn small title={`+1 · ${cost}`} disabled={g.relics < cost || p.attrs[a] >= 100} onPress={() => act((gg) => raiseAttr(gg, a))} />
              </Row>
            </Row>
            <Bar value={p.attrs[a]} color={p.color} />
            <Row style={{ justifyContent: 'space-between' }}>
              <Mono size={10} color={C.faint}>{ATTR_RANGE[a][0]}</Mono>
              <Mono size={10} color={C.faint}>{ATTR_RANGE[a][1]}</Mono>
            </Row>
          </View>
        );
      })}
      <View style={{ gap: 5 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Body style={{ fontFamily: F.bodyBold }}>Benevolence</Body>
          <Mono color={p.benevolence < -30 ? C.ember : p.benevolence > 30 ? C.jade : C.text}>{p.benevolence > 0 ? '+' : ''}{p.benevolence}</Mono>
        </Row>
        <View style={{ height: 6, backgroundColor: C.sunken, borderRadius: 3, borderWidth: 1, borderColor: C.lineSoft }}>
          <View style={{ position: 'absolute', left: '50%', top: -3, width: 1, height: 10, backgroundColor: C.faint }} />
          <View style={{ position: 'absolute', left: `${(p.benevolence + 100) / 2}%`, top: -4, width: 10, height: 12, marginLeft: -5, backgroundColor: p.benevolence < -30 ? C.ember : C.jade, borderRadius: 2 }} />
        </View>
        <Row style={{ justifyContent: 'space-between' }}>
          <Mono size={10} color={C.faint}>Wrathful</Mono>
          <Mono size={10} color={C.faint}>Benevolent</Mono>
        </Row>
      </View>
      <Row style={{ justifyContent: 'space-between' }} wrap>
        <Body size={14} color={C.muted}>Contemplate: spend {COSTS.contemplate} wisdom points for +1 wisdom.</Body>
        <Btn small title="Contemplate" color={C.violet} disabled={g.wisdomPoints < COSTS.contemplate} onPress={() => act(contemplate)} />
      </Row>
    </Panel>
  );
}

function TodayRituals() {
  const g = useG();
  const { go } = useUi();
  const active = g.rituals.filter((r) => r.status === 'offered' || r.status === 'queued');
  return (
    <Panel title="Today's rituals" right={<Btn small kind="quiet" title={`All ${active.length} →`} onPress={() => go('rituals')} />}>
      {active.length ? active.slice(0, 4).map((r) => <RitualRow key={r.id} r={r} compact />) : <Italic>No demands right now. Your god will speak again soon.</Italic>}
    </Panel>
  );
}

function OmenCard() {
  const g = useG();
  const [hint, setHint] = useState(false);
  const o = g.omen;
  if (!o) return null;
  return (
    <Panel title="An omen" tone={C.gold} right={<Mono size={11} color={C.goldDim}>fades in {o.expires - g.hour} h</Mono>}>
      <Display size={21}>{o.text}</Display>
      <Body size={14} color={C.muted}>Interpret it correctly and you will be rewarded. Otherwise…</Body>
      <View style={{ gap: S.sm }}>
        {o.options.map((opt, i) => (
          <Btn key={opt.label} title={opt.label} onPress={() => { act((gg) => interpretOmen(gg, i)); setHint(false); }} />
        ))}
      </View>
      {hint ? (
        <Italic size={14} color={C.violet}>{o.hint}</Italic>
      ) : (
        <Btn small kind="quiet" color={C.violet} title={`Ask for insight (${COSTS.hint} wisdom)`} disabled={g.wisdomPoints < COSTS.hint} onPress={() => act(buyOmenHint) && setHint(true)} />
      )}
    </Panel>
  );
}

function ChallengeCard() {
  const g = useG();
  const { openDuel } = useUi();
  const c = g.challenge;
  if (!c) return null;
  const god = godById(g, c.godId)!;
  return (
    <Panel title="Live challenge" tone={C.ember} right={<Mono size={11} color={C.ember}>{c.expires - g.hour} h to answer</Mono>}>
      <Row gap={S.md}>
        <GodMark glyph={god.glyph} color={god.color} size={40} />
        <Body style={{ flex: 1 }}><Body style={{ fontFamily: F.bodyBold }}>{god.handle}</Body>, follower of {god.name}, challenges you for a border village. Duel now, or let the gods' attributes decide.</Body>
      </Row>
      <Row wrap>
        <Btn kind="primary" color={C.ember} title="Duel now" onPress={openDuel} />
        <Btn title="Let the gods decide" onPress={() => act(declineChallenge)} />
      </Row>
    </Panel>
  );
}

function GraceCard() {
  const g = useG();
  const [revealed, setRevealed] = useState<string | null>(null);
  if (!g.graceRequests.length && !revealed) return null;
  return (
    <Panel title="Requests for grace" right={<Mono size={11} color={C.faint}>{g.graceRequests.length} waiting</Mono>}>
      <Body size={14} color={C.muted}>Strangers performed rituals in your god's honor. You cannot see how devoted they are. Refuse a true devotee and your god may punish you.</Body>
      {g.graceRequests.map((req) => (
        <View key={req.id} style={{ gap: S.sm, paddingTop: S.sm, borderTopWidth: 1, borderColor: C.lineSoft }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Mono size={12}>{req.pilgrim}</Mono>
            <Mono size={11} color={C.faint}>score hidden</Mono>
          </Row>
          <Body size={14}>Performed: <Body size={14} style={{ fontFamily: F.bodyItalic }}>{req.ritualTitle}</Body></Body>
          <Row>
            <Btn small kind="primary" title="Extend grace (−10)" onPress={() => act((gg) => extendGrace(gg, req.id))} />
            <Btn small title="Refuse" onPress={() => { const r = act((gg) => refuseGrace(gg, req.id)); setRevealed(`${req.pilgrim}'s devotion was ${r.score}/100. ${r.delta < 0 ? `Your god punished you: ${r.delta} relics.` : 'Your god approved: +10 relics.'}`); }} />
          </Row>
        </View>
      ))}
      {revealed && <Italic size={14} color={C.text}>{revealed}</Italic>}
    </Panel>
  );
}

function HoroscopeCard() {
  const g = useG();
  const h = g.horoscope;
  const [result, setResult] = useState<string | null>(null);
  return (
    <Panel title={`Horoscope · ${g.sign}`} tone={C.violet} right={<Mono size={11} color={C.violet}>day {dayOf(g.hour)}</Mono>}>
      <Display size={19} color={C.text}>{h.aspect}</Display>
      <Italic color={C.text}>{h.reading}</Italic>
      <Row gap={S.xl} wrap>
        <View style={{ gap: 3 }}>
          <Label size={10}>Favored order</Label>
          <Mono color={KIND_COLOR[h.favored]}>{KIND_INFO[h.favored].label} ×1.5</Mono>
        </View>
        <View style={{ gap: 3 }}>
          <Label size={10}>Lucky attribute</Label>
          <Mono style={{ textTransform: 'capitalize' }}>{h.luckyAttr}</Mono>
        </View>
        <View style={{ gap: 3 }}>
          <Label size={10}>Luck</Label>
          <Mono>{h.luck}/100</Mono>
        </View>
      </Row>
      <View style={{ gap: S.sm, paddingTop: S.sm, borderTopWidth: 1, borderColor: C.lineSoft }}>
        <Body size={14} color={C.muted}>Feeling lucky? Perform the horoscopic rite and let the engine execute the outcome. Once a day.</Body>
        {result ? <Italic size={14} color={C.text}>{result}</Italic> : (
          <Btn color={C.violet} title="Let the stars decide" disabled={h.riteUsed} onPress={() => { const r = act(feelingLucky); setResult(`${r.text} (${r.delta >= 0 ? '+' : ''}${r.delta} relics)`); }} />
        )}
        {h.riteUsed && !result && <Mono size={11} color={C.faint}>Already performed today.</Mono>}
      </View>
    </Panel>
  );
}

function AlertsCard() {
  const g = useG();
  return (
    <Panel title="Alerts">
      {g.alerts.slice(0, 14).map((a) => (
        <Row key={a.id} gap={S.sm} style={{ alignItems: 'flex-start' }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, marginTop: 7, backgroundColor: TONE_COLOR[a.tone] }} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Body size={13} color={a.tone === 'info' ? C.muted : C.text}>{a.text}</Body>
            <Mono size={10} color={C.faint}>day {dayOf(a.hour)} · {clockOf(a.hour)}</Mono>
          </View>
        </Row>
      ))}
    </Panel>
  );
}
