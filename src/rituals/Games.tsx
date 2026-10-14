import React, { useEffect, useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { PLACARDS, RIDDLES } from '../game/data';
import { buyOmenHint, COSTS, randInt, runSolver } from '../game/engine';
import { act, useG } from '../game/store';
import type { GameSpec } from '../game/types';
import { alpha, C, F, S } from '../theme';
import { Bar, Body, Btn, Display, Italic, Label, Mono, Row, s } from '../ui/kit';

export type Done = (quality: number, note?: string) => void;
type Props<T extends GameSpec['type']> = { spec: Extract<GameSpec, { type: T }>; onDone: Done };

function useInterval(fn: () => void, ms: number | null) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    if (ms == null) return;
    const id = setInterval(() => ref.current(), ms);
    return () => clearInterval(id);
  }, [ms]);
}

function GpsNote({ text }: { text: string }) {
  return (
    <Row gap={6}>
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: C.jade }} />
      <Mono size={11} color={C.muted}>{text}</Mono>
    </Row>
  );
}

// ---- Sacrifice: walk the block, collecting relic orbs along the way ----
const ORBS = [0.12, 0.38, 0.62, 0.88];
export function WalkGame({ spec, onDone }: Props<'walk'>) {
  const [p, setP] = useState(0);
  const [walking, setWalking] = useState(false);
  useInterval(() => setP((v) => Math.min(spec.laps, v + 0.016)), walking ? 50 : null);
  useEffect(() => {
    if (p >= spec.laps) onDone(1, `${spec.laps * 400} m walked, ${spec.laps * ORBS.length} relic orbs gathered.`);
  }, [p >= spec.laps]);
  const size = 190;
  const pos = (f: number) => {
    const d = (f % 1) * 4;
    const seg = Math.floor(d);
    const u = d - seg;
    const L = size - 14;
    if (seg === 0) return { left: u * L, top: 0 };
    if (seg === 1) return { left: L, top: u * L };
    if (seg === 2) return { left: L - u * L, top: L };
    return { left: 0, top: L - u * L };
  };
  const lap = Math.min(spec.laps - 1, Math.floor(p));
  const frac = p - lap;
  const orbs = Math.floor(p) * ORBS.length + ORBS.filter((o) => o <= frac).length;
  return (
    <View style={{ gap: S.lg, alignItems: 'center' }}>
      <GpsNote text="GPS (simulated) · 400 m per lap" />
      <View style={{ width: size, height: size, borderWidth: 1, borderColor: C.line, backgroundColor: C.sunken, padding: 7 }}>
        <View style={{ position: 'absolute', left: 30, top: 30, right: 30, bottom: 30, backgroundColor: C.raised, borderWidth: 1, borderColor: C.lineSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Label>the block</Label>
        </View>
        {ORBS.map((o) => (
          <View key={o} style={{ position: 'absolute', width: 10, height: 10, borderRadius: 5, marginLeft: 9, marginTop: 9, backgroundColor: o <= frac ? C.faint : C.gold, ...pos(o) }} />
        ))}
        <View style={{ position: 'absolute', width: 14, height: 14, borderRadius: 7, marginLeft: 7, marginTop: 7, backgroundColor: C.text, borderWidth: 2, borderColor: C.jade, ...pos(p) }} />
      </View>
      <Row gap={S.xl}>
        <Mono color={C.muted}>Lap {Math.min(spec.laps, lap + 1)} / {spec.laps}</Mono>
        <Mono color={C.muted}>{Math.round(p * 400)} m</Mono>
        <Mono color={C.gold}>{orbs} orbs</Mono>
      </Row>
      <Pressable
        onPressIn={() => setWalking(true)}
        onPressOut={() => setWalking(false)}
        style={{ paddingVertical: 16, paddingHorizontal: 36, borderRadius: 40, borderWidth: 1, borderColor: C.jade, backgroundColor: walking ? alpha(C.jade, 0.3) : alpha(C.jade, 0.1) }}
      >
        <Mono color={C.jade}>{walking ? 'Walking…' : 'Hold to walk'}</Mono>
      </Pressable>
      <Italic size={13}>On a phone, your real footsteps move the marker.</Italic>
    </View>
  );
}

// ---- Sacrifice: the Sisyphean stone ----
export function BoulderGame({ onDone }: Props<'boulder'>) {
  const [h, setH] = useState(0);
  const [done, setDone] = useState(false);
  useInterval(() => setH((v) => Math.max(0, v - 0.9)), done ? null : 100);
  useEffect(() => {
    if (h >= 100 && !done) {
      setDone(true);
      onDone(1, 'The stone reached the summit. It will roll back tomorrow.');
    }
  }, [h]);
  return (
    <View style={{ gap: S.lg, alignItems: 'center' }}>
      <View style={{ width: 220, height: 200, borderBottomWidth: 1, borderColor: C.line }}>
        {/* the slope */}
        <View style={{ position: 'absolute', left: -20, bottom: 88, width: 260, height: 2, backgroundColor: C.muted, transform: [{ rotate: '-38deg' }] }} />
        <View style={{ position: 'absolute', left: 12 + h * 1.6, bottom: 8 + h * 1.25, width: 30, height: 30, borderRadius: 15, backgroundColor: C.raised, borderWidth: 2, borderColor: C.gold }} />
        <Label style={{ position: 'absolute', right: 0, top: 0 }}>summit</Label>
      </View>
      <View style={{ width: 220 }}><Bar value={h} color={C.gold} /></View>
      <Btn kind="primary" title="Push" onPress={() => setH((v) => Math.min(100, v + 5))} style={{ minWidth: 160 }} />
      <Italic size={13}>Stop pushing and the stone rolls back.</Italic>
      <Btn kind="quiet" small title="Give up" onPress={() => onDone((h / 100) * 0.5, 'You let the stone go.')} />
    </View>
  );
}

// ---- Meditation: go somewhere and be still ----
export function StillGame({ spec, onDone }: Props<'still'>) {
  const [phase, setPhase] = useState<'travel' | 'arrived'>('travel');
  const [t, setT] = useState(0);
  const [holding, setHolding] = useState(false);
  const [breaks, setBreaks] = useState(0);
  useInterval(() => setT((v) => v + 0.1), holding ? 100 : null);
  useEffect(() => {
    if (t >= spec.seconds) {
      setHolding(false);
      onDone(Math.max(0.5, 1 - breaks * 0.1), breaks ? `Still, after ${breaks} false start${breaks > 1 ? 's' : ''}.` : 'Perfectly still.');
    }
  }, [t >= spec.seconds]);
  if (phase === 'travel') {
    return (
      <View style={{ gap: S.lg }}>
        <GpsNote text={`Navigating to ${spec.place} (simulated)`} />
        <Body>Go to {spec.place}. When the app sees you within 15 meters, you may begin.</Body>
        <Btn kind="primary" title="I have arrived" onPress={() => setPhase('arrived')} />
      </View>
    );
  }
  return (
    <View style={{ gap: S.lg, alignItems: 'center' }}>
      <GpsNote text="Within 9 m of target · motion sensor armed" />
      <Pressable
        onPressIn={() => setHolding(true)}
        onPressOut={() => {
          if (t < spec.seconds) {
            setHolding(false);
            if (t > 0.3) setBreaks((b) => b + 1);
            setT(0);
          }
        }}
        style={{ width: 180, height: 180, borderRadius: 90, borderWidth: 2, borderColor: holding ? C.lapis : C.line, backgroundColor: alpha(C.lapis, holding ? 0.18 : 0.05), alignItems: 'center', justifyContent: 'center', gap: 6 }}
      >
        <Display size={34} color={C.lapis}>{Math.max(0, spec.seconds - t).toFixed(1)}</Display>
        <Label color={C.lapis}>{holding ? 'be still' : 'hold to begin'}</Label>
      </Pressable>
      <View style={{ width: 220 }}><Bar value={t} max={spec.seconds} color={C.lapis} /></View>
      {breaks > 0 && <Italic size={13}>You moved. Begin again. ({breaks})</Italic>}
    </View>
  );
}

// ---- Jnana: a riddle (optionally answered by your attached solver) ----
export function RiddleGame({ spec, onDone }: Props<'riddle'>) {
  const g = useG();
  const riddle = RIDDLES[spec.riddleId];
  const [answer, setAnswer] = useState('');
  const [tries, setTries] = useState(0);
  const [hint, setHint] = useState(false);
  const [msg, setMsg] = useState('');
  const submit = (a = answer) => {
    const ok = riddle.a.includes(a.trim().toLowerCase().replace(/[.!?]$/, ''));
    if (ok) return onDone([1, 0.8, 0.6][tries] ?? 0.6, `Answer: ${riddle.a[0]}.`);
    const n = tries + 1;
    setTries(n);
    if (n >= 3) return onDone(0.15, `The answer was "${riddle.a[0]}".`);
    setMsg(`Not that. ${3 - n} attempt${3 - n > 1 ? 's' : ''} left.`);
  };
  return (
    <View style={{ gap: S.lg }}>
      <Display size={22}>{riddle.q}</Display>
      <TextInput
        id="riddle-answer"
        value={answer}
        onChangeText={setAnswer}
        onSubmitEditing={() => submit()}
        placeholder="Your answer"
        placeholderTextColor={C.faint}
        style={s.input}
        autoFocus
      />
      {!!msg && <Italic color={C.ember}>{msg}</Italic>}
      {hint && <Italic>Hint: {riddle.hint}</Italic>}
      <Row wrap>
        <Btn kind="primary" title="Answer" onPress={() => submit()} disabled={!answer.trim()} />
        {!hint && (
          <Btn
            title={`Hint (${COSTS.hint} wisdom)`}
            disabled={g.wisdomPoints < COSTS.hint}
            onPress={() => act((gg) => buyOmenHint(gg)) && setHint(true)}
          />
        )}
        {g.solverAttached && (
          <Btn
            title="Run solver API"
            color={C.lapis}
            onPress={() => {
              const r = runSolver(spec.riddleId);
              setAnswer(r.answer);
              setMsg(`Solver returned "${r.answer}" (confidence ${r.correct ? 0.91 : 0.44}).`);
            }}
          />
        )}
      </Row>
    </View>
  );
}

// ---- Jnana: visit a place, read the placard, answer ----
export function PlacardGame({ spec, onDone }: Props<'placard'>) {
  const pl = PLACARDS[spec.placardId];
  const [arrived, setArrived] = useState(false);
  if (!arrived) {
    return (
      <View style={{ gap: S.lg }}>
        <GpsNote text={`Navigating to ${spec.place} (simulated)`} />
        <Body>Go to {spec.place}. A placard there holds what your god wants you to know.</Body>
        <Btn kind="primary" title="Check in" onPress={() => setArrived(true)} />
      </View>
    );
  }
  return (
    <View style={{ gap: S.lg }}>
      <GpsNote text={`Checked in at ${spec.place}`} />
      <View style={{ backgroundColor: C.paper, padding: S.lg, borderRadius: 2, borderWidth: 1, borderColor: C.line }}>
        <Label color={C.paperMuted}>Placard</Label>
        <Body color={C.paperText} style={{ marginTop: 6 }}>{pl.text}</Body>
      </View>
      <Body style={{ fontFamily: F.bodyBold }}>{pl.q}</Body>
      <View style={{ gap: S.sm }}>
        {pl.choices.map((c, i) => (
          <Btn key={c} title={c} onPress={() => onDone(i === pl.a ? 1 : 0.4, i === pl.a ? 'You read carefully.' : `The answer was "${pl.choices[pl.a]}".`)} />
        ))}
      </View>
    </View>
  );
}

// ---- Dharma: be present at a place of duty ----
export function PresenceGame({ spec, onDone }: Props<'presence'>) {
  const total = spec.minutes * 60;
  const [phase, setPhase] = useState<'travel' | 'present' | 'reflect'>('travel');
  const [secs, setSecs] = useState(0);
  const [note, setNote] = useState('');
  // Ten minutes compressed into about twelve seconds for the mockup.
  useInterval(() => setSecs((v) => Math.min(total, v + total / 120)), phase === 'present' ? 100 : null);
  useEffect(() => {
    if (secs >= total && phase === 'present') setPhase('reflect');
  }, [secs]);
  const left = total - secs;
  const mmss = `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(Math.floor(left % 60)).padStart(2, '0')}`;
  if (phase === 'travel') {
    return (
      <View style={{ gap: S.lg }}>
        <GpsNote text={`Navigating to ${spec.place} (simulated)`} />
        <Body>Go to {spec.place} and stay at least {spec.minutes} minutes. Help if you can. Listen if you can't.</Body>
        <Btn kind="primary" title="Check in" color={C.jade} onPress={() => setPhase('present')} />
      </View>
    );
  }
  if (phase === 'present') {
    return (
      <View style={{ gap: S.lg, alignItems: 'center' }}>
        <GpsNote text={`Presence detected at ${spec.place}`} />
        <Display size={52} color={C.jade}>{mmss}</Display>
        <View style={{ width: 240 }}><Bar value={secs} max={total} color={C.jade} /></View>
        <Italic size={13}>Time runs fast in the mockup. In the field this is a real ten minutes.</Italic>
        <Btn kind="quiet" small title="Leave early" onPress={() => onDone(Math.max(0.2, secs / total) * 0.6, 'You left before your time was up.')} />
      </View>
    );
  }
  return (
    <View style={{ gap: S.lg }}>
      <Body>Your time is served. What did you see? (Optional, kept private.)</Body>
      <TextInput id="dharma-note" value={note} onChangeText={setNote} multiline placeholder="A sentence or two" placeholderTextColor={C.faint} style={[s.input, { minHeight: 80, textAlignVertical: 'top' }]} />
      <Btn kind="primary" color={C.jade} title="Complete duty" onPress={() => onDone(1, 'Duty done. Charity money released.')} />
    </View>
  );
}

// ---- Honor: tell what happened; a random pilgrim judges believability ----
function judge(story: string) {
  let stars = 2;
  if (story.length > 120) stars += 1;
  if (/["“”]|said|told|asked|smiled|laughed/i.test(story)) stars += 0.6;
  if (/\d|[a-z]\s[A-Z][a-z]+/.test(story)) stars += 0.6;
  if (/(amazing|incredible|best ever|literally)/i.test(story)) stars -= 0.8;
  stars += Math.random() * 1.6 - 0.8;
  return Math.max(1, Math.min(5, Math.round(stars)));
}
const VERDICTS = ['', 'I don\'t buy it.', 'Maybe. Felt thin.', 'Believable enough.', 'I could picture it.', 'This happened. I\'m sure of it.'];

export function StoryGame({ spec, onDone }: Props<'story'>) {
  const [text, setText] = useState('');
  const [phase, setPhase] = useState<'write' | 'judging' | 'judged'>('write');
  const [stars, setStars] = useState(0);
  const [pilgrim] = useState(() => `Pilgrim #${randInt(1000, 9999)}`);
  useEffect(() => {
    if (phase !== 'judging') return;
    const id = setTimeout(() => { setStars(judge(text)); setPhase('judged'); }, 2200);
    return () => clearTimeout(id);
  }, [phase]);
  if (phase === 'write') {
    return (
      <View style={{ gap: S.lg }}>
        <Body style={{ fontFamily: F.bodyBold }}>{spec.prompt}</Body>
        <Body color={C.muted}>Do it for real, then describe what actually happened. Specifics are more believable than adjectives.</Body>
        <TextInput id="honor-story" value={text} onChangeText={setText} multiline placeholder="What happened?" placeholderTextColor={C.faint} style={[s.input, { minHeight: 120, textAlignVertical: 'top' }]} />
        <Row style={{ justifyContent: 'space-between' }}>
          <Mono size={11} color={text.length >= 40 ? C.jade : C.faint}>{text.length} / 40 characters minimum</Mono>
          <Btn kind="primary" title="Send for judgment" disabled={text.trim().length < 40} onPress={() => setPhase('judging')} />
        </Row>
      </View>
    );
  }
  if (phase === 'judging') {
    return (
      <View style={{ gap: S.md, alignItems: 'center', paddingVertical: S.xl }}>
        <Display size={20}>Sent to a random pilgrim…</Display>
        <Italic>They will never know who you are.</Italic>
      </View>
    );
  }
  return (
    <View style={{ gap: S.lg }}>
      <Label>{pilgrim} judged your story</Label>
      <Display size={36} color={C.gold}>{'★'.repeat(stars)}<Display size={36} color={C.line}>{'★'.repeat(5 - stars)}</Display></Display>
      <Italic>“{VERDICTS[stars]}”</Italic>
      <Btn kind="primary" title="Accept judgment" onPress={() => onDone(stars / 5, `${pilgrim} gave ${stars} of 5 stars.`)} />
    </View>
  );
}

// ---- Custom rituals: a checklist ----
export function ChecklistGame({ spec, onDone }: Props<'checklist'>) {
  const [done, setDone] = useState<boolean[]>(spec.items.map(() => false));
  const n = done.filter(Boolean).length;
  return (
    <View style={{ gap: S.md }}>
      {spec.items.map((it, i) => (
        <Pressable key={it} onPress={() => setDone((d) => d.map((v, j) => (j === i ? !v : v)))} style={{ flexDirection: 'row', alignItems: 'center', gap: S.md, paddingVertical: 8, paddingHorizontal: S.md, borderWidth: 1, borderColor: done[i] ? C.jade : C.line, borderRadius: 3, backgroundColor: done[i] ? alpha(C.jade, 0.1) : 'transparent' }}>
          <View style={{ width: 18, height: 18, borderWidth: 1.5, borderColor: done[i] ? C.jade : C.muted, backgroundColor: done[i] ? C.jade : 'transparent', borderRadius: 2 }} />
          <Body style={{ textDecorationLine: done[i] ? 'line-through' : 'none' }} color={done[i] ? C.muted : C.text}>{it}</Body>
        </Pressable>
      ))}
      <Row style={{ justifyContent: 'space-between' }}>
        <Btn kind="quiet" small title="Finish partly" disabled={n === 0} onPress={() => onDone(n / spec.items.length, `${n} of ${spec.items.length} done.`)} />
        <Btn kind="primary" title="Complete" disabled={n < spec.items.length} onPress={() => onDone(1, 'Every set done.')} />
      </Row>
    </View>
  );
}

// ---- Rival rite: sing the hymn (typed in the mockup) ----
function similarity(a: string, b: string) {
  const norm = (x: string) => x.toLowerCase().replace(/[^a-z ]/g, '').split(/\s+/).filter(Boolean);
  const A = norm(a);
  const B = norm(b);
  let hit = 0;
  B.forEach((w, i) => { if (A[i] === w || A.includes(w)) hit++; });
  return B.length ? hit / B.length : 0;
}
export function ChantGame({ spec, onDone }: Props<'chant'>) {
  const [text, setText] = useState('');
  return (
    <View style={{ gap: S.lg }}>
      <View style={{ borderLeftWidth: 2, borderColor: C.ember, paddingLeft: S.md }}>
        <Italic size={18} color={C.text}>{spec.hymn}</Italic>
      </View>
      <Body color={C.muted}>On a phone you would sing this into the microphone and an AI judge would score your pitch and devotion. Here, type it from memory or by sight.</Body>
      <TextInput id="chant" value={text} onChangeText={setText} placeholder="Sing…" placeholderTextColor={C.faint} style={s.input} />
      <Btn
        kind="primary"
        title="Sing"
        disabled={!text.trim()}
        onPress={() => {
          const q = similarity(text, spec.hymn);
          onDone(q, `AI judge: ${Math.round(q * 100)}% faithful to the hymn.`);
        }}
      />
    </View>
  );
}

// ---- Live duel for border challenges ----
export function DuelGame({ target, rivalName, onDone }: { target: number; rivalName: string; onDone: (won: boolean, taps: number) => void }) {
  const [phase, setPhase] = useState<'ready' | 'go' | 'over'>('ready');
  const [taps, setTaps] = useState(0);
  const [left, setLeft] = useState(5);
  useInterval(() => setLeft((v) => Math.max(0, v - 0.1)), phase === 'go' ? 100 : null);
  useEffect(() => {
    if (phase === 'go' && left <= 0) {
      setPhase('over');
      onDone(taps > target, taps);
    }
  }, [left]);
  return (
    <View style={{ gap: S.lg, alignItems: 'center' }}>
      <Row gap={S.xxl}>
        <View style={{ alignItems: 'center' }}><Label>you</Label><Display size={40} color={C.gold}>{taps}</Display></View>
        <View style={{ alignItems: 'center' }}><Label>{rivalName}</Label><Display size={40} color={C.ember}>{phase === 'ready' ? '?' : Math.round(target * Math.min(1, (5 - left) / 5))}</Display></View>
      </Row>
      <Mono color={C.muted}>{left.toFixed(1)} s</Mono>
      {phase === 'ready' && <Btn kind="primary" title="Begin the duel" onPress={() => setPhase('go')} />}
      {phase === 'go' && (
        <Pressable onPress={() => setTaps((t) => t + 1)} style={({ pressed }) => ({ width: 170, height: 170, borderRadius: 85, borderWidth: 2, borderColor: C.gold, alignItems: 'center', justifyContent: 'center', backgroundColor: alpha(C.gold, pressed ? 0.35 : 0.12) })}>
          <Display size={22} color={C.gold}>Invoke!</Display>
        </Pressable>
      )}
      <Italic size={13}>Tap faster than your rival's devotion for five seconds.</Italic>
    </View>
  );
}
