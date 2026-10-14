import React, { useState } from 'react';
import { ScrollView, Switch, TextInput, View } from 'react-native';
import { KINSHIPS } from '../game/data';
import {
  ATTRS, COSTS, dissolveKinship, followersOf, makeOffering, might, PLAYER, Proposal, proposeKinship, Terms, tilesOf,
} from '../game/engine';
import { act, useG } from '../game/store';
import type { God, Kinship } from '../game/types';
import { alpha, C, F, S } from '../theme';
import { Bar, Body, Btn, Chip, Display, GodMark, Italic, Label, Mono, Panel, Row, s, Sheet, Stepper } from '../ui/kit';
import { useUi } from '../ui/nav';

export function Pantheon() {
  const g = useG();
  const { wide } = useUi();
  const [negotiating, setNegotiating] = useState<God | null>(null);
  const kin = g.gods.filter((x) => g.relations[x.id]?.kin);
  const others = g.gods.filter((x) => !g.relations[x.id]?.kin);

  return (
    <ScrollView contentContainerStyle={{ padding: S.lg, gap: S.lg }}>
      <View style={{ gap: 4 }}>
        <Display size={32}>Pantheon</Display>
        <Body color={C.muted} style={{ maxWidth: 700 }}>
          Every other god here was created by another player. Ask to become their brother, mother or consort and negotiate the terms. Kin share tithes and do not attack each other. Gods with mutual defense stand with you at the border.
        </Body>
      </View>

      <Panel tone={C.gold} title="Your pantheon">
        {g.pantheonName ? (
          <View style={{ gap: S.sm }}>
            <TextInput id="pantheon-name" value={g.pantheonName} onChangeText={(v) => act((gg) => { gg.pantheonName = v; })} style={[s.input, { fontFamily: F.display, fontSize: 22 }]} />
            <Row wrap gap={S.md}>
              <Chip text={`${g.player.name} · you`} color={g.player.color} filled />
              {kin.map((k) => <Chip key={k.id} text={`${k.name} · ${g.relations[k.id].kin}`} color={k.color} filled />)}
            </Row>
          </View>
        ) : (
          <Italic>You stand alone. Propose kinship to a neighboring god to found a pantheon.</Italic>
        )}
      </Panel>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: S.lg }}>
        {[...kin, ...others].map((god) => (
          <GodCard key={god.id} god={god} wide={wide} onPropose={() => setNegotiating(god)} />
        ))}
      </View>

      {negotiating && <Negotiation god={negotiating} onClose={() => setNegotiating(null)} />}
    </ScrollView>
  );
}

function GodCard({ god, wide, onPropose }: { god: God; wide: boolean; onPropose: () => void }) {
  const g = useG();
  const rel = g.relations[god.id];
  const tiles = tilesOf(g, god.id).length;
  const offspring = god.parentId === PLAYER;
  return (
    <Panel style={{ flexGrow: 1, flexBasis: wide ? '30%' : '100%', borderColor: rel.kin ? alpha(god.color, 0.7) : C.line }}>
      <Row gap={S.md} style={{ alignItems: 'flex-start' }}>
        <GodMark glyph={god.glyph} color={god.color} size={48} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Display size={19}>{god.name}</Display>
          <Italic size={13}>{god.epithet}</Italic>
          <Mono size={11} color={C.faint}>{offspring ? 'your offspring · born of schism' : `created by ${god.handle}`}</Mono>
        </View>
      </Row>
      <Row wrap gap={6}>
        {rel.kin && <Chip text={`Your ${rel.kin}`} color={god.color} filled />}
        {rel.terms?.mutualDefense && <Chip text="Mutual defense" color={C.jade} />}
        {rel.terms && <Chip text={`Tithe share ${rel.terms.titheShare}%`} color={C.muted} />}
        {god.benevolence < -30 && <Chip text="Wrathful" color={C.ember} />}
        {tiles === 0 && <Chip text="No lands" color={C.faint} />}
      </Row>
      <Body size={13} color={C.muted} numberOfLines={3}>{god.profile}</Body>
      <View style={{ gap: 4 }}>
        {ATTRS.map((a) => (
          <Row key={a} gap={S.sm}>
            <Mono size={10} color={C.faint} style={{ width: 70, textTransform: 'uppercase' }}>{a}</Mono>
            <View style={{ flex: 1 }}><Bar value={god.attrs[a]} color={god.color} height={4} /></View>
            <Mono size={10} color={C.muted} style={{ width: 24, textAlign: 'right' }}>{god.attrs[a]}</Mono>
          </Row>
        ))}
      </View>
      <Row style={{ justifyContent: 'space-between' }}>
        <Mono size={11} color={C.muted}>might {Math.round(might(god))} · {tiles} villages · {followersOf(g, god.id)} souls</Mono>
      </Row>
      <View style={{ gap: 4 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Label size={10}>Favor toward you</Label>
          <Mono size={11} color={rel.favor < 0 ? C.ember : C.jade}>{rel.favor > 0 ? '+' : ''}{rel.favor}</Mono>
        </Row>
        <Bar value={rel.favor + 100} max={200} color={rel.favor < 0 ? C.ember : C.jade} height={4} />
      </View>
      <Row wrap>
        <Btn small title={`Offering · ${COSTS.offering}`} disabled={g.relics < COSTS.offering} onPress={() => act((gg) => makeOffering(gg, god.id))} />
        {rel.kin ? (
          <Btn small kind="danger" title="Dissolve kinship" onPress={() => act((gg) => dissolveKinship(gg, god.id))} />
        ) : (
          <Btn small kind="primary" title="Propose kinship" onPress={onPropose} />
        )}
      </Row>
    </Panel>
  );
}

function Negotiation({ god, onClose }: { god: God; onClose: () => void }) {
  const [kin, setKin] = useState<Kinship>('Sister');
  const [terms, setTerms] = useState<Terms>({ titheShare: 5, nonAggression: true, mutualDefense: false });
  const [reply, setReply] = useState<Proposal | null>(null);

  const propose = (t: Terms) => setReply(act((gg) => proposeKinship(gg, god.id, kin, t)));
  const acceptCounter = () => {
    if (!reply?.counter) return;
    // A counter-offer the proposer accepts is binding.
    act((gg) => {
      const rel = gg.relations[god.id];
      rel.kin = kin;
      rel.terms = reply.counter!;
      if (!gg.pantheonName) gg.pantheonName = `The House of ${gg.player.name.replace(/^The /, '')}`;
    });
    setReply({ result: 'accepted', message: `You accepted ${god.handle}'s terms. You are now their ${kin}.` });
  };

  return (
    <Sheet visible onClose={onClose}>
      <Row gap={S.md}>
        <GodMark glyph={god.glyph} color={god.color} size={48} />
        <View style={{ flex: 1 }}>
          <Label>Negotiate with {god.handle}</Label>
          <Display size={24}>{god.name}</Display>
        </View>
      </Row>
      {!reply || reply.result === 'rejected' ? (
        <>
          <View style={{ gap: S.sm }}>
            <Label>I ask to be {god.name}'s…</Label>
            <Row wrap gap={6}>
              {KINSHIPS.map((k) => <Btn key={k} small title={k} kind={k === kin ? 'primary' : 'ghost'} onPress={() => setKin(k)} />)}
            </Row>
            {(kin === 'Father' || kin === 'Mother') && <Italic size={13}>Elders must be mightier than the god they claim.</Italic>}
          </View>
          <Row style={{ justifyContent: 'space-between' }}>
            <View><Body style={{ fontFamily: F.bodyBold }}>Share of my tithes</Body><Mono size={10} color={C.faint}>paid to them daily</Mono></View>
            <Stepper value={`${terms.titheShare}%`} width={44} onMinus={() => setTerms({ ...terms, titheShare: Math.max(0, terms.titheShare - 5) })} onPlus={() => setTerms({ ...terms, titheShare: Math.min(30, terms.titheShare + 5) })} />
          </Row>
          <Row style={{ justifyContent: 'space-between' }}>
            <Body style={{ fontFamily: F.bodyBold }}>Non-aggression</Body>
            <Switch value={terms.nonAggression} onValueChange={(v) => setTerms({ ...terms, nonAggression: v })} trackColor={{ true: alpha(C.gold, 0.6), false: C.line }} thumbColor={terms.nonAggression ? C.gold : C.muted} />
          </Row>
          <Row style={{ justifyContent: 'space-between' }}>
            <Body style={{ fontFamily: F.bodyBold }}>Mutual defense</Body>
            <Switch value={terms.mutualDefense} onValueChange={(v) => setTerms({ ...terms, mutualDefense: v })} trackColor={{ true: alpha(C.gold, 0.6), false: C.line }} thumbColor={terms.mutualDefense ? C.gold : C.muted} />
          </Row>
          {reply && <Body color={C.ember}>{reply.message}</Body>}
          <Row>
            <Btn kind="primary" title="Send proposal" onPress={() => propose(terms)} />
            <Btn kind="quiet" title="Cancel" onPress={onClose} />
          </Row>
        </>
      ) : reply.result === 'countered' ? (
        <>
          <Label color={C.gold}>Counter-offer</Label>
          <Body>{reply.message}</Body>
          <Row>
            <Btn kind="primary" title="Accept their terms" onPress={acceptCounter} />
            <Btn title="Walk away" onPress={onClose} />
          </Row>
        </>
      ) : (
        <>
          <Label color={C.jade}>Agreed</Label>
          <Body>{reply.message}</Body>
          <Btn kind="primary" title="Done" onPress={onClose} />
        </>
      )}
    </Sheet>
  );
}
