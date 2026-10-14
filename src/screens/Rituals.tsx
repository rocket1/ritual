import React, { useState } from 'react';
import { ScrollView, Switch, TextInput, View } from 'react-native';
import { KIND_INFO, KIND_ORDER } from '../game/data';
import { clockOf, createCustomRitual, dayOf, godById, hoursLeft, queueRitual, ritualValue } from '../game/engine';
import { act, useG } from '../game/store';
import type { Ritual } from '../game/types';
import { kindColor, kindLabel } from '../rituals/RitualPlayer';
import { alpha, C, F, KIND_COLOR, S } from '../theme';
import { Body, Btn, Chip, Display, Italic, Label, Mono, Panel, Row, s, Stepper } from '../ui/kit';
import { useUi } from '../ui/nav';

export function RitualRow({ r, compact }: { r: Ritual; compact?: boolean }) {
  const g = useG();
  const { openRitual } = useUi();
  const left = hoursLeft(g, r.deadline);
  const color = kindColor(r);
  const forGod = godById(g, r.forGodId ?? null);
  const urgent = left <= 3;
  return (
    <View style={{ flexDirection: 'row', gap: S.md, paddingVertical: S.md, borderTopWidth: 1, borderColor: C.lineSoft, alignItems: 'center', flexWrap: 'wrap' }}>
      <View style={{ width: 3, alignSelf: 'stretch', backgroundColor: color, borderRadius: 2 }} />
      <View style={{ flex: 1, minWidth: 180, gap: 4 }}>
        <Row wrap gap={6}>
          <Chip text={kindLabel(r)} color={color} />
          {r.status === 'queued' && <Chip text="Queued" color={C.muted} filled />}
          {r.source === 'god' && r.kind === g.horoscope.favored && <Chip text="Stars ×1.5" color={C.gold} />}
          {forGod && <Mono size={10} color={forGod.color}>for {forGod.name}</Mono>}
        </Row>
        <Body style={{ fontFamily: F.bodyBold }}>{r.title}</Body>
        {!compact && <Body size={14} color={C.muted}>{r.description}</Body>}
        <Mono size={11} color={urgent ? C.ember : C.faint}>
          {left > 0 ? `${left} h left` : 'due now'}{r.status === 'queued' ? ' · a broken promise brings disaster' : ''}{r.assignedBy ? ` · from ${r.assignedBy}` : ''}
        </Mono>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        <Mono color={C.gold}>{ritualValue(g, r)} ✦</Mono>
        <Row gap={6}>
          {r.status === 'offered' && r.source !== 'rival' && <Btn small kind="quiet" title="Queue" onPress={() => act((gg) => queueRitual(gg, r.id))} />}
          <Btn small kind="primary" title="Perform" onPress={() => openRitual(r.id)} />
        </Row>
      </View>
    </View>
  );
}

export function Rituals() {
  const g = useG();
  const { wide } = useUi();
  const active = g.rituals.filter((r) => r.status === 'offered' || r.status === 'queued');
  const past = g.rituals.filter((r) => r.status !== 'offered' && r.status !== 'queued');
  const fromGod = active.filter((r) => r.source === 'god');
  const assigned = active.filter((r) => r.source === 'custom');
  const rival = active.filter((r) => r.source === 'rival');

  return (
    <ScrollView contentContainerStyle={{ padding: S.lg, gap: S.lg }}>
      <View style={{ gap: 4 }}>
        <Display size={32}>Rituals</Display>
        <Body color={C.muted} style={{ maxWidth: 680 }}>
          Perform now for full relics, or queue for later at three quarters. A queued ritual is a promise: break it and a natural disaster follows. Ignored offers simply fade.
        </Body>
      </View>

      <View style={{ flexDirection: wide ? 'row' : 'column', gap: S.lg, alignItems: 'flex-start' }}>
        <View style={{ flex: 2, gap: S.lg, width: wide ? undefined : '100%' }}>
          <Panel title={`Demanded by ${g.player.name}`} right={<Mono size={11} color={C.faint}>{fromGod.length} open</Mono>}>
            {fromGod.length ? fromGod.map((r) => <RitualRow key={r.id} r={r} />) : <Italic>Your god is quiet. New demands arrive throughout the day.</Italic>}
          </Panel>
          {rival.length > 0 && (
            <Panel title="Rites of neighboring gods" tone={C.ember}>
              <Body size={14} color={C.muted}>You have crossed into another god's domain. Their rite earns relics and their favor.</Body>
              {rival.map((r) => <RitualRow key={r.id} r={r} />)}
            </Panel>
          )}
          <Panel title="Assigned to you">
            {assigned.length ? assigned.map((r) => <RitualRow key={r.id} r={r} />) : <Italic>No custom rituals waiting.</Italic>}
          </Panel>
          <Panel title="Recently">
            {past.length === 0 && <Italic>Nothing yet.</Italic>}
            {past.slice(0, 12).map((r) => (
              <Row key={r.id} style={{ justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: 1, borderColor: C.lineSoft }}>
                <Body size={14} style={{ flex: 1 }} color={r.status === 'done' ? C.text : C.faint} numberOfLines={1}>{r.title}</Body>
                <Mono size={12} color={r.status === 'done' ? C.gold : r.status === 'failed' ? C.ember : C.faint}>
                  {r.status === 'done' ? `+${r.earned}` : r.status === 'failed' ? 'broken' : 'faded'}
                </Mono>
              </Row>
            ))}
          </Panel>
        </View>

        <View style={{ flex: 1, gap: S.lg, width: wide ? undefined : '100%' }}>
          <Panel title="The five orders">
            {KIND_ORDER.map((k) => (
              <View key={k} style={{ gap: 2, paddingVertical: 4 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Body style={{ fontFamily: F.bodyBold }} color={KIND_COLOR[k]}>{KIND_INFO[k].label}</Body>
                  <Mono size={11} color={C.muted}>{KIND_INFO[k].base[0]}–{KIND_INFO[k].base[1]} ✦</Mono>
                </Row>
                <Body size={13} color={C.muted}>{KIND_INFO[k].blurb}</Body>
              </View>
            ))}
            <Italic size={13}>Rarer orders are worth more.</Italic>
          </Panel>
          <CustomRitualForm />
          <SolverPanel />
        </View>
      </View>
    </ScrollView>
  );
}

function CustomRitualForm() {
  const [title, setTitle] = useState('');
  const [steps, setSteps] = useState('');
  const [by, setBy] = useState('');
  const [relics, setRelics] = useState(40);
  const items = steps.split('\n').map((x) => x.trim()).filter(Boolean);
  return (
    <Panel title="Create a ritual">
      <Body size={14} color={C.muted}>Your own goals, or a routine a trainer, teacher or friend assigns you.</Body>
      <TextInput id="custom-title" value={title} onChangeText={setTitle} placeholder="Evening stretch" placeholderTextColor={C.faint} style={s.input} />
      <TextInput id="custom-steps" value={steps} onChangeText={setSteps} multiline placeholder={'One step per line\n10 minutes of yoga\nDrink a glass of water'} placeholderTextColor={C.faint} style={[s.input, { minHeight: 84, textAlignVertical: 'top' }]} />
      <TextInput id="custom-by" value={by} onChangeText={setBy} placeholder="Assigned by (optional)" placeholderTextColor={C.faint} style={s.input} />
      <Row style={{ justifyContent: 'space-between' }}>
        <Label>Relics</Label>
        <Stepper value={relics} onMinus={() => setRelics(Math.max(10, relics - 10))} onPlus={() => setRelics(Math.min(150, relics + 10))} />
      </Row>
      <Btn
        kind="primary"
        title="Add ritual"
        disabled={!title.trim() || items.length === 0}
        onPress={() => {
          act((g) => createCustomRitual(g, title.trim(), items, relics, by.trim()));
          setTitle(''); setSteps(''); setBy('');
        }}
      />
    </Panel>
  );
}

function SolverPanel() {
  const g = useG();
  return (
    <Panel title="Programmable rituals" tone={C.lapis}>
      <Body size={14} color={C.muted}>Some rituals accept answers from your own programs through the open API. Attach a solver and it can answer riddles for you.</Body>
      <View style={{ backgroundColor: C.sunken, padding: S.md, borderRadius: 3, borderWidth: 1, borderColor: C.lineSoft }}>
        <Mono size={11} color={C.muted}>{'POST /v1/rituals/{id}/solve\n{ "answer": "echo",\n  "solver": "my-riddler@1.2" }\n→ 200 { "accepted": true }'}</Mono>
      </View>
      <Row style={{ justifyContent: 'space-between' }}>
        <Body size={14}>Attach my-riddler@1.2</Body>
        <Switch
          value={g.solverAttached}
          onValueChange={(v) => act((gg) => { gg.solverAttached = v; })}
          trackColor={{ true: alpha(C.lapis, 0.6), false: C.line }}
          thumbColor={g.solverAttached ? C.lapis : C.muted}
        />
      </Row>
      <Mono size={10} color={C.faint}>Mock endpoint · day {dayOf(g.hour)} {clockOf(g.hour)}</Mono>
    </Panel>
  );
}
