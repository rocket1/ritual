import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { KIND_INFO } from '../game/data';
import { completeRitual, godById, ritualValue } from '../game/engine';
import { act, holdClock, useG } from '../game/store';
import type { Ritual, RitualOption } from '../game/types';
import { C, KIND_COLOR, S } from '../theme';
import { Body, Btn, Chip, Display, Italic, Label, Mono, Row, Sheet } from '../ui/kit';
import {
  BoulderGame, ChantGame, ChecklistGame, Done, PlacardGame, PresenceGame, RiddleGame, StillGame, StoryGame, WalkGame,
} from './Games';

export function kindLabel(r: Ritual) {
  if (r.source === 'rival') return 'Rival rite';
  if (r.source === 'custom') return 'Custom';
  return KIND_INFO[r.kind].label;
}
export function kindColor(r: Ritual) {
  return r.source === 'rival' ? KIND_COLOR.rival : r.source === 'custom' ? KIND_COLOR.custom : KIND_COLOR[r.kind];
}

function GameFor({ option, onDone }: { option: RitualOption; onDone: Done }) {
  const spec = option.game;
  switch (spec.type) {
    case 'walk': return <WalkGame spec={spec} onDone={onDone} />;
    case 'boulder': return <BoulderGame spec={spec} onDone={onDone} />;
    case 'still': return <StillGame spec={spec} onDone={onDone} />;
    case 'riddle': return <RiddleGame spec={spec} onDone={onDone} />;
    case 'placard': return <PlacardGame spec={spec} onDone={onDone} />;
    case 'presence': return <PresenceGame spec={spec} onDone={onDone} />;
    case 'story': return <StoryGame spec={spec} onDone={onDone} />;
    case 'checklist': return <ChecklistGame spec={spec} onDone={onDone} />;
    case 'chant': return <ChantGame spec={spec} onDone={onDone} />;
  }
}

export function RitualPlayer({ ritualId, onClose }: { ritualId: string | null; onClose: () => void }) {
  const g = useG();
  const r = g.rituals.find((x) => x.id === ritualId) ?? null;
  const [option, setOption] = useState<RitualOption | null>(null);
  const [result, setResult] = useState<{ earned: number; note?: string } | null>(null);

  useEffect(() => {
    if (!ritualId) return;
    setOption(null);
    setResult(null);
    holdClock(true);
    return () => holdClock(false);
  }, [ritualId]);

  useEffect(() => {
    if (r && !option && r.options.length === 1) setOption(r.options[0]);
  }, [r?.id, option]);

  if (!r) return null;
  const color = kindColor(r);
  const forGod = godById(g, r.forGodId ?? null);
  const favored = r.source === 'god' && r.kind === g.horoscope.favored;

  const finish: Done = (quality, note) => {
    const earned = act((gg) => completeRitual(gg, r.id, quality));
    setResult({ earned, note });
  };

  return (
    <Sheet visible onClose={onClose} dismissable={!option || !!result}>
      <Row style={{ justifyContent: 'space-between' }} wrap>
        <Row>
          <Chip text={kindLabel(r)} color={color} filled />
          {favored && <Chip text="Favored by the stars ×1.5" color={C.gold} />}
          {r.status === 'queued' && <Chip text="Queued ×0.75" color={C.muted} />}
        </Row>
        <Mono color={C.gold}>{ritualValue(g, r)} relics</Mono>
      </Row>
      <Display size={26}>{r.title}</Display>
      {!result && <Body color={C.muted}>{r.description}</Body>}
      {forGod && !result && <Italic size={14}>In honor of {forGod.name}, worshipped by {forGod.handle}.</Italic>}
      {r.assignedBy && !result && <Label>Assigned by {r.assignedBy}</Label>}

      {result ? (
        <View style={{ gap: S.md, paddingTop: S.sm }}>
          <Label color={C.jade}>Ritual complete</Label>
          <Display size={44} color={C.gold}>+{result.earned}</Display>
          <Mono color={C.muted}>relics offered to {g.player.name}</Mono>
          {result.note && <Italic>{result.note}</Italic>}
          <Btn kind="primary" title="Return" onPress={onClose} style={{ marginTop: S.sm }} />
        </View>
      ) : !option ? (
        <View style={{ gap: S.sm }}>
          <Label>Choose your task</Label>
          {r.options.map((o) => (
            <Btn key={o.label} title={o.label} color={color} onPress={() => setOption(o)} />
          ))}
          <Btn kind="quiet" title="Not now" onPress={onClose} />
        </View>
      ) : (
        <View style={{ gap: S.lg, paddingTop: S.sm }}>
          <GameFor option={option} onDone={finish} />
          <Btn kind="quiet" small title="Abandon (no penalty yet)" onPress={onClose} />
        </View>
      )}
    </Sheet>
  );
}
