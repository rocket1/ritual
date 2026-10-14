import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TIERS } from './game/data';
import {
  advanceHour, clockOf, dayOf, followersOf, godById, might, PLAYER, randInt, resolveChallenge, travelToNewPlanet,
} from './game/engine';
import { act, clockHeld, holdClock, setGame, useG } from './game/store';
import { DuelGame } from './rituals/Games';
import { RitualPlayer } from './rituals/RitualPlayer';
import { Charity } from './screens/Charity';
import { Guide } from './screens/Guide';
import { MapScreen } from './screens/MapScreen';
import { Myth } from './screens/Myth';
import { Pantheon } from './screens/Pantheon';
import { Rituals } from './screens/Rituals';
import { Temple } from './screens/Temple';
import { Wisdom } from './screens/Wisdom';
import { alpha, C, currentTheme, F, fs, S, TONE_COLOR } from './theme';
import { Body, Btn, Display, GodMark, Italic, Label, Mono, Row, Sheet } from './ui/kit';
import { Tab, TABS, UiContext } from './ui/nav';
import { ThemeButton } from './ui/ThemePicker';

const HOUR_MS = 4000;

export function Shell() {
  const g = useG();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const wide = width >= 900;
  const [tab, setTab] = useState<Tab>('temple');
  const [ritualId, setRitualId] = useState<string | null>(null);
  const [duel, setDuel] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      if (!g.paused && !clockHeld()) act(advanceHour);
    }, HOUR_MS / g.speed);
    return () => clearInterval(id);
  }, [g.paused, g.speed]);

  const ui = useMemo(() => ({ go: setTab, openRitual: setRitualId, openDuel: () => setDuel(true), wide }), [wide]);
  const unread = g.rituals.filter((r) => r.status === 'offered').length;

  const Screen = { temple: Temple, rituals: Rituals, map: MapScreen, pantheon: Pantheon, myth: Myth, wisdom: Wisdom, charity: Charity, guide: Guide }[tab];

  return (
    <UiContext.Provider value={ui}>
      <View style={{ flex: 1, flexDirection: wide ? 'row' : 'column', backgroundColor: C.bg, paddingTop: wide ? 0 : insets.top }}>
        {wide && <Sidebar tab={tab} setTab={setTab} unread={unread} />}
        <View style={{ flex: 1, minWidth: 0 }}>
          <TopBar compact={!wide} />
          <View style={{ flex: 1 }}>
            <Screen />
          </View>
          {!wide && <BottomTabs tab={tab} setTab={setTab} unread={unread} bottom={insets.bottom} />}
        </View>
        <Toasts />
      </View>
      {ritualId && <RitualPlayer ritualId={ritualId} onClose={() => setRitualId(null)} />}
      {duel && <DuelSheet onClose={() => setDuel(false)} />}
      {g.truthReached && <TruthSheet />}
    </UiContext.Provider>
  );
}

function Sidebar({ tab, setTab, unread }: { tab: Tab; setTab: (t: Tab) => void; unread: number }) {
  const g = useG();
  const [confirm, setConfirm] = useState(false);
  return (
    <View style={{ width: fs(210), backgroundColor: C.sunken, borderRightWidth: 1, borderColor: C.lineSoft, paddingVertical: S.xl, paddingHorizontal: S.lg, gap: S.xl }}>
      <View style={{ gap: 2 }}>
        <Display size={30} color={C.gold} style={{ letterSpacing: 4 }}>RITUAL</Display>
        <Mono size={10} color={C.faint}>doing, not believing</Mono>
      </View>
      <Row gap={S.sm}>
        <GodMark glyph={g.player.glyph} color={g.player.color} size={34} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Body size={14} numberOfLines={1}>{g.player.name}</Body>
          <Mono size={10} color={C.gold}>{TIERS[g.tierIndex].name}</Mono>
        </View>
      </Row>
      <View style={{ gap: 2 }}>
        {TABS.map((t) => {
          const on = t.id === tab;
          return (
            <Pressable
              key={t.id}
              onPress={() => setTab(t.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              style={(st) => ({
                flexDirection: 'row', alignItems: 'center', gap: S.md, paddingVertical: 9, paddingHorizontal: S.sm, borderRadius: 3,
                backgroundColor: on ? alpha(C.gold, 0.12) : (st as { hovered?: boolean }).hovered ? C.surface : 'transparent',
              })}
            >
              <Text style={{ width: fs(18), textAlign: 'center', color: on ? C.gold : C.faint, fontSize: fs(15) }}>{t.glyph}</Text>
              <Text style={{ flex: 1, fontFamily: F.display, fontSize: fs(16), color: on ? C.text : C.muted, letterSpacing: 0.6 }}>{t.label}</Text>
              {t.id === 'rituals' && unread > 0 && <Mono size={11} color={C.gold}>{unread}</Mono>}
              {t.id === 'temple' && g.omen && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.gold }} />}
            </Pressable>
          );
        })}
      </View>
      <View style={{ flex: 1 }} />
      {confirm ? (
        <View style={{ gap: S.sm }}>
          <Body size={13} color={C.muted}>Abandon {g.player.name} and create a new god? This mockup keeps nothing.</Body>
          <Row>
            <Btn small kind="danger" title="Abandon" onPress={() => setGame(null)} />
            <Btn small kind="quiet" title="Keep" onPress={() => setConfirm(false)} />
          </Row>
        </View>
      ) : (
        <View style={{ gap: 2 }}>
          <ThemeButton />
          <Btn small kind="quiet" title="New god" onPress={() => setConfirm(true)} />
        </View>
      )}
    </View>
  );
}

function TopBar({ compact }: { compact: boolean }) {
  const g = useG();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: compact ? S.md : S.xl, paddingHorizontal: S.lg, paddingVertical: S.md, borderBottomWidth: 1, borderColor: C.lineSoft, backgroundColor: C.bg }}>
      {compact && <Display size={20} color={C.gold} style={{ letterSpacing: 3 }}>RITUAL</Display>}
      <Metric label="Relics" value={g.relics.toLocaleString()} color={C.gold} />
      <Metric label="Followers" value={followersOf(g, PLAYER).toLocaleString()} />
      {!compact && <Metric label="Tier" value={TIERS[g.tierIndex].name} />}
      <View style={{ flex: 1 }} />
      <Row gap={S.sm}>
        <View style={{ alignItems: 'flex-end' }}>
          <Mono size={14}>{clockOf(g.hour)}</Mono>
          <Mono size={10} color={C.faint}>day {dayOf(g.hour)}</Mono>
        </View>
        <Btn small kind="quiet" title={g.paused ? '▶' : '❚❚'} onPress={() => act((gg) => { gg.paused = !gg.paused; })} />
        <Btn small kind={g.speed === 4 ? 'primary' : 'quiet'} title="×4" onPress={() => act((gg) => { gg.speed = gg.speed === 4 ? 1 : 4; })} />
        {compact && <ThemeButton title="◐" />}
        {!compact && <Btn small title="Pass 8 h" onPress={() => act((gg) => { for (let i = 0; i < 8; i++) advanceHour(gg); })} />}
      </Row>
    </View>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View>
      <Label size={9}>{label}</Label>
      <Mono size={16} color={color ?? C.text}>{value}</Mono>
    </View>
  );
}

function BottomTabs({ tab, setTab, unread, bottom }: { tab: Tab; setTab: (t: Tab) => void; unread: number; bottom: number }) {
  return (
    <View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: C.lineSoft, backgroundColor: C.sunken, paddingBottom: bottom }}>
      {TABS.map((t) => {
        const on = t.id === tab;
        return (
          <Pressable key={t.id} onPress={() => setTab(t.id)} accessibilityRole="tab" accessibilityState={{ selected: on }} style={{ flex: 1, alignItems: 'center', paddingVertical: 8, gap: 2 }}>
            <Text style={{ color: on ? C.gold : C.faint, fontSize: fs(17) }}>{t.glyph}</Text>
            <Text style={{ fontFamily: F.mono, fontSize: fs(9), color: on ? C.text : C.faint }}>{t.id === 'guide' ? 'Guide' : t.label}{t.id === 'rituals' && unread ? ` ${unread}` : ''}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}


function Toasts() {
  const g = useG();
  const { width } = useWindowDimensions();
  const unseen = g.alerts.filter((a) => !a.seen);
  const shown = unseen.slice(0, 3);
  const key = shown.map((a) => a.id).join();
  useEffect(() => {
    if (unseen.length > 3) act(() => unseen.slice(3).forEach((a) => { a.seen = true; }));
    if (!shown.length) return;
    const id = setTimeout(() => act(() => shown.forEach((a) => { a.seen = true; })), 6000);
    return () => clearTimeout(id);
  }, [key]);
  if (!shown.length) return null;
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', top: 64, right: S.lg, width: Math.min(360, width - S.lg * 2), gap: S.sm }}>
      {shown.map((a) => (
        <Pressable key={a.id} onPress={() => act(() => { a.seen = true; })} style={{ backgroundColor: C.raised, borderWidth: 1, borderColor: alpha(TONE_COLOR[a.tone], 0.6), borderLeftWidth: 3, borderLeftColor: TONE_COLOR[a.tone], borderRadius: 3, padding: S.md, shadowColor: '#000', shadowOpacity: currentTheme().dark ? 0.4 : 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }}>
          <Body size={13}>{a.text}</Body>
        </Pressable>
      ))}
    </View>
  );
}

function DuelSheet({ onClose }: { onClose: () => void }) {
  const g = useG();
  const [c] = useState(() => g.challenge);
  const god = godById(g, c?.godId ?? null);
  const [target] = useState(() => Math.round(16 + (god ? might(god) : 40) / 5 + randInt(-3, 3)));
  const [outcome, setOutcome] = useState<string | null>(null);
  useEffect(() => {
    holdClock(true);
    return () => holdClock(false);
  }, []);
  if (!c || !god) return null;
  return (
    <Sheet visible onClose={onClose} dismissable={!!outcome}>
      <Label color={C.ember}>Live challenge · {god.name}</Label>
      <Display size={24}>Duel {god.handle}</Display>
      {outcome ? (
        <View style={{ gap: S.md }}>
          <Body>{outcome}</Body>
          <Btn kind="primary" title="Return" onPress={onClose} />
        </View>
      ) : (
        <DuelGame target={target} rivalName={god.handle ?? god.name} onDone={(won, taps) => {
          setOutcome(`${taps} invocations against ${target}. ${won ? 'You won the village.' : 'You lost the village.'}`);
          act((gg) => resolveChallenge(gg, won));
        }} />
      )}
    </Sheet>
  );
}

function TruthSheet() {
  const g = useG();
  return (
    <Sheet visible onClose={() => {}} dismissable={false}>
      <Label color={C.gold}>Truth</Label>
      <Display size={36} color={C.gold}>{g.player.name} is real.</Display>
      <Body>Your faith governs {g.planet.name}. Your god no longer needs believers here, only rituals. Real gods travel.</Body>
      <Italic>On a new planet you begin again as a Prophet, keeping your god's attributes and relics. The rivals there are stronger.</Italic>
      <Btn kind="primary" title="Travel to the next planet" onPress={() => act(travelToNewPlanet)} />
    </Sheet>
  );
}
