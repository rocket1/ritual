import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, useWindowDimensions, View } from 'react-native';
import { GOD_COLORS, PROTOTYPES, SIGNS } from '../game/data';
import { ATTR_RANGE, ATTRS, newGame } from '../game/engine';
import { setGame } from '../game/store';
import type { Attr, Attrs, Sign } from '../game/types';
import { alpha, C, F, S } from '../theme';
import { ThemeButton } from '../ui/ThemePicker';
import { GuideContent } from './Guide';
import { Bar, Body, Btn, Display, GodMark, Italic, Label, Mono, Panel, Row, s, Sheet, Stepper } from '../ui/kit';

const START_RELICS = 1000;
const POINT_COST = 10;
const zero: Attrs = { wisdom: 0, power: 0, charisma: 0, evidence: 0 };

export function CreateGod() {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const [protoId, setProtoId] = useState(PROTOTYPES[1].id);
  const proto = PROTOTYPES.find((p) => p.id === protoId)!;
  const [name, setName] = useState('');
  const [epithet, setEpithet] = useState('');
  const [profile, setProfile] = useState('');
  const [color, setColor] = useState<string | null>(null);
  const [sign, setSign] = useState<Sign>('Scorpio');
  const [added, setAdded] = useState<Attrs>(zero);
  const [benevolence, setBenevolence] = useState<number | null>(null);
  const [tithe, setTithe] = useState(10);
  const [guide, setGuide] = useState(false);

  const spent = useMemo(() => Object.values(added).reduce((a, b) => a + b, 0) * POINT_COST, [added]);
  const left = START_RELICS - spent;
  const benev = benevolence ?? proto.benevolence;
  const col = color ?? proto.color;

  const choose = (id: string) => {
    setProtoId(id);
    setAdded(zero);
    setBenevolence(null);
    setColor(null);
  };
  const bump = (a: Attr, d: number) => setAdded((x) => ({ ...x, [a]: Math.max(0, x[a] + d) }));

  const begin = (quick = false) => {
    const alloc = quick ? { wisdom: 25, power: 25, charisma: 30, evidence: 20 } : added;
    const attrs = Object.fromEntries(ATTRS.map((a) => [a, Math.min(100, proto.attrs[a] + alloc[a])])) as Attrs;
    const used = Object.values(alloc).reduce((a, b) => a + b, 0) * POINT_COST;
    setGame(newGame({
      prototypeId: proto.id, name, epithet, profile, color: col, attrs, benevolence: benev, tithe, sign, relicsLeft: START_RELICS - used,
    }));
  };

  const cols = wide ? 5 : width >= 560 ? 3 : 2;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ paddingHorizontal: S.lg, paddingVertical: S.xxl, alignItems: 'center' }}>
      <View style={{ width: '100%', maxWidth: 1120, gap: S.xl }}>
        <View style={{ gap: S.sm }}>
          <Row style={{ justifyContent: 'space-between' }} wrap>
            <Label color={C.gold}>Ritual · doing, not believing</Label>
            <Row gap={4}>
              <Btn small kind="quiet" title="How to play" onPress={() => setGuide(true)} />
              <ThemeButton />
            </Row>
          </Row>
          <Display size={wide ? 46 : 34}>Create the god you will serve</Display>
          <Body color={C.muted} style={{ maxWidth: 640 }}>
            You shape a god, and then you become its first follower. Pick a starting myth, spend your 1,000 relics on its nature, and go perform its rituals.
          </Body>
        </View>

        <View style={{ gap: S.sm }}>
          <Label>1 · Choose a starting myth</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: S.sm }}>
            {PROTOTYPES.map((p) => {
              const on = p.id === protoId;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => choose(p.id)}
                  style={(st) => ({
                    width: `${100 / cols - 1.2}%` as const,
                    padding: S.md,
                    gap: S.sm,
                    borderWidth: 1,
                    borderRadius: 4,
                    borderColor: on ? p.color : C.line,
                    backgroundColor: on ? alpha(p.color, 0.1) : (st as { hovered?: boolean }).hovered ? C.raised : C.surface,
                  })}
                >
                  <GodMark glyph={p.glyph} color={p.color} size={36} />
                  <Body size={15} style={{ fontFamily: F.bodyBold }} numberOfLines={1}>{p.name}</Body>
                  <Mono size={10} color={C.faint} numberOfLines={1}>{p.archetype}</Mono>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={{ flexDirection: wide ? 'row' : 'column', gap: S.lg, alignItems: 'flex-start' }}>
          <Panel title="2 · Name and nature" style={{ flex: wide ? 1 : undefined, width: wide ? undefined : '100%' }}>
            <Row gap={S.md}>
              <GodMark glyph={proto.glyph} color={col} size={56} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Display size={24}>{name.trim() || proto.name}</Display>
                <Italic size={14}>{epithet.trim() || proto.epithet}</Italic>
              </View>
            </Row>
            <Field label="Name"><TextInput id="god-name" value={name} onChangeText={setName} placeholder={proto.name} placeholderTextColor={C.faint} style={s.input} /></Field>
            <Field label="Epithet"><TextInput id="god-epithet" value={epithet} onChangeText={setEpithet} placeholder={proto.epithet} placeholderTextColor={C.faint} style={s.input} /></Field>
            <Field label="Profile"><TextInput id="god-profile" value={profile} onChangeText={setProfile} placeholder={proto.profile} placeholderTextColor={C.faint} multiline style={[s.input, { minHeight: 72, textAlignVertical: 'top' }]} /></Field>
            <Field label="Color">
              <Row wrap gap={6}>
                {GOD_COLORS.map((c) => (
                  <Pressable key={c} accessibilityLabel={`Color ${c}`} onPress={() => setColor(c)} style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: c, borderWidth: 2, borderColor: c === col ? C.text : 'transparent' }} />
                ))}
              </Row>
            </Field>
            <Field label="Your sign (feeds the horoscope engine)">
              <Row wrap gap={6}>
                {SIGNS.map((x) => <Btn key={x} small title={x} kind={x === sign ? 'primary' : 'ghost'} onPress={() => setSign(x)} />)}
              </Row>
            </Field>
          </Panel>

          <Panel title="3 · Spend 1,000 relics on the myth" right={<Mono color={left < 0 ? C.ember : C.gold}>{left} left</Mono>} style={{ flex: wide ? 1 : undefined, width: wide ? undefined : '100%' }}>
            <Body size={14} color={C.muted}>Each point costs {POINT_COST} relics. These attributes decide border battles, conversions and luck.</Body>
            {ATTRS.map((a) => {
              const v = proto.attrs[a] + added[a];
              return (
                <View key={a} style={{ gap: 6 }}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <View>
                      <Body style={{ fontFamily: F.bodyBold, textTransform: 'capitalize' }}>{a}</Body>
                      <Mono size={10} color={C.faint}>{ATTR_RANGE[a][0]} → {ATTR_RANGE[a][1]}</Mono>
                    </View>
                    <Stepper value={v} onMinus={() => bump(a, -5)} onPlus={() => bump(a, 5)} minusDisabled={added[a] === 0} plusDisabled={left < POINT_COST * 5 || v >= 100} />
                  </Row>
                  <Bar value={v} color={col} />
                </View>
              );
            })}
            <Row style={{ justifyContent: 'space-between' }} wrap>
              <View>
                <Body style={{ fontFamily: F.bodyBold }}>Benevolence</Body>
                <Mono size={10} color={C.faint}>Wrathful fights harder · kind converts easier</Mono>
              </View>
              <Stepper value={benev} width={40} onMinus={() => setBenevolence(Math.max(-100, benev - 10))} onPlus={() => setBenevolence(Math.min(100, benev + 10))} />
            </Row>
            <Row style={{ justifyContent: 'space-between' }} wrap>
              <View>
                <Body style={{ fontFamily: F.bodyBold }}>Tithe</Body>
                <Mono size={10} color={C.faint}>Daily relics from followers · above 15% erodes charisma</Mono>
              </View>
              <Stepper value={`${tithe}%`} width={40} onMinus={() => setTithe(Math.max(0, tithe - 1))} onPlus={() => setTithe(Math.min(30, tithe + 1))} />
            </Row>
            <Italic size={13}>Unspent relics carry into the game.</Italic>
          </Panel>
        </View>

        <Row wrap gap={S.md}>
          <Btn kind="primary" title={`Bring forth ${name.trim() || proto.name}`} onPress={() => begin()} />
          <Btn title="Quick start with a balanced god" onPress={() => begin(true)} />
        </Row>
        {guide && (
          <Sheet visible onClose={() => setGuide(false)} width={860}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Display size={30}>How to play</Display>
              <Btn small kind="quiet" title="Close" onPress={() => setGuide(false)} />
            </Row>
            <GuideContent />
            <Btn kind="primary" title="Close" onPress={() => setGuide(false)} />
          </Sheet>
        )}
      </View>
    </ScrollView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Label>{label}</Label>
      {children}
    </View>
  );
}
