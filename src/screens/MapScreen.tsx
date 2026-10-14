import React, { useState } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { TRUTH_SHARE } from '../game/data';
import {
  build, BUILDING_NAMES, buildingCost, buildWall, COSTS, crusade, followersOf, godById, landTiles, might, neighbors,
  PLAYER, recruit, sendMissionaries, tilesOf,
} from '../game/engine';
import { act, useG } from '../game/store';
import type { Tile } from '../game/types';
import { alpha, C, F, S } from '../theme';
import { Bar, Body, Btn, Display, GodMark, Italic, Label, Mono, Panel, Row } from '../ui/kit';
import { useUi } from '../ui/nav';

const TERRAIN_BG: Record<Tile['terrain'], string> = { plain: '#2C2620', forest: '#232B1F', hill: '#352D25', desert: '#3A3122', water: '#141C26' };
const TERRAIN_MARK: Partial<Record<Tile['terrain'], string>> = { hill: '▲', forest: '♣', desert: '∴' };
const NUMERALS = ['', 'Ⅰ', 'Ⅱ', 'Ⅲ'];

export function MapScreen() {
  const g = useG();
  const { wide } = useUi();
  const { width } = useWindowDimensions();
  const [boxW, setBoxW] = useState<number | null>(null);
  const [sel, setSel] = useState<number | null>(tilesOf(g, PLAYER)[0]?.id ?? null);
  const [msg, setMsg] = useState<string | null>(null);

  const avail = (boxW ?? (wide ? width * 0.55 : width - S.lg * 2)) - S.sm * 2 - 2;
  const cell = Math.max(18, Math.min(64, Math.floor(avail / (g.map.w + 0.5))));
  const rowH = Math.round(cell * 0.88);

  const tile = sel != null ? g.map.tiles[sel] : null;
  const owners = [g.player, ...g.gods].map((god) => ({ god, tiles: tilesOf(g, god.id).length, followers: followersOf(g, god.id) })).filter((x) => x.tiles > 0 || x.god.id === PLAYER);
  const land = landTiles(g).length;
  const mine = tilesOf(g, PLAYER).length;

  return (
    <ScrollView contentContainerStyle={{ padding: S.lg, gap: S.lg }}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }} wrap>
        <View style={{ gap: 2 }}>
          <Label>Planet {g.planet.index + 1}</Label>
          <Display size={32}>{g.planet.name}</Display>
        </View>
        <View style={{ minWidth: 220, gap: 4 }}>
          <Mono size={11} color={C.muted}>{mine} of {land} lands · Truth at {Math.round(TRUTH_SHARE * 100)}%</Mono>
          <Bar value={mine} max={land * TRUTH_SHARE} color={C.gold} />
        </View>
      </Row>

      <View style={{ flexDirection: wide ? 'row' : 'column', gap: S.lg, alignItems: 'flex-start' }}>
        <View onLayout={(e) => setBoxW(e.nativeEvent.layout.width)} style={{ flex: wide ? 1.8 : undefined, width: wide ? undefined : '100%', padding: S.sm, backgroundColor: C.sunken, borderWidth: 1, borderColor: C.line, borderRadius: 4, alignItems: 'center' }}>
          <View style={{ width: cell * (g.map.w + 0.5), height: rowH * (g.map.h - 1) + cell }}>
            {g.map.tiles.map((t) => (
              <TileView key={t.id} t={t} cell={cell} rowH={rowH} selected={t.id === sel} onPress={() => { setSel(t.id); setMsg(null); }} />
            ))}
          </View>
        </View>

        <View style={{ flex: 1, gap: S.lg, width: wide ? undefined : '100%', minWidth: wide ? 300 : undefined, maxWidth: wide ? 380 : undefined }}>
          {tile && <TilePanel tile={tile} msg={msg} setMsg={setMsg} />}
          <Panel title="Gods of this world">
            {owners.sort((a, b) => b.tiles - a.tiles).map(({ god, tiles, followers }) => {
              const rel = g.relations[god.id];
              return (
                <Row key={god.id} gap={S.sm}>
                  <View style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: god.color }} />
                  <Body size={14} style={{ flex: 1, fontFamily: god.id === PLAYER ? F.bodyBold : F.body }} numberOfLines={1}>
                    {god.name}{god.id === PLAYER ? ' (you)' : ''}{rel?.kin ? ` · ${rel.kin}` : ''}
                  </Body>
                  <Mono size={11} color={C.muted}>{tiles} · {followers.toLocaleString()}</Mono>
                </Row>
              );
            })}
            <Mono size={10} color={C.faint}>villages · followers</Mono>
          </Panel>
          <Panel title="Army">
            <Row style={{ justifyContent: 'space-between' }}>
              <Body>{g.army} soldiers</Body>
              <Btn small title={`Recruit · ${COSTS.soldier}`} disabled={g.relics < COSTS.soldier} onPress={() => act(recruit)} />
            </Row>
            <Italic size={13}>Borders also shift on their own every hour. The computer resolves each clash from the gods' attributes plus chance.</Italic>
          </Panel>
        </View>
      </View>
    </ScrollView>
  );
}

function TileView({ t, cell, rowH, selected, onPress }: { t: Tile; cell: number; rowH: number; selected: boolean; onPress: () => void }) {
  const g = useG();
  const owner = godById(g, t.owner);
  const mineTile = t.owner === PLAYER;
  const bg = t.terrain === 'water' ? TERRAIN_BG.water : owner ? alpha(owner.color, mineTile ? 0.78 : 0.5) : TERRAIN_BG[t.terrain];
  const left = t.x * cell + (t.y % 2 ? cell / 2 : 0);
  const top = t.y * rowH;
  return (
    <Pressable
      onPress={t.terrain === 'water' ? undefined : onPress}
      accessibilityLabel={`${t.terrain} tile ${t.x},${t.y}${owner ? `, held by ${owner.name}` : ''}`}
      style={(st) => ({
        position: 'absolute', left, top, width: cell - 2, height: cell - 2,
        borderRadius: cell * 0.32,
        backgroundColor: bg,
        borderWidth: selected ? 2 : t.wall ? 2 : 1,
        borderColor: selected ? C.text : t.wall ? '#E7DCC6' : mineTile ? C.gold : (st as { hovered?: boolean }).hovered && t.terrain !== 'water' ? C.muted : 'rgba(0,0,0,0.25)',
        alignItems: 'center', justifyContent: 'center',
      })}
    >
      {t.building > 0 ? (
        <Text style={{ fontFamily: F.display, fontSize: cell * 0.38, color: C.text }}>{NUMERALS[t.building]}</Text>
      ) : TERRAIN_MARK[t.terrain] && !owner ? (
        <Text style={{ fontSize: cell * 0.3, color: alpha(C.text, 0.22) }}>{TERRAIN_MARK[t.terrain]}</Text>
      ) : mineTile && cell > 26 ? (
        <Text style={{ fontSize: cell * 0.34, color: C.sunken }}>{g.player.glyph}</Text>
      ) : null}
    </Pressable>
  );
}

function TilePanel({ tile, msg, setMsg }: { tile: Tile; msg: string | null; setMsg: (s: string | null) => void }) {
  const g = useG();
  const owner = godById(g, tile.owner);
  const mine = tile.owner === PLAYER;
  const adjacent = neighbors(g.map, tile).some((n) => n.owner === PLAYER);
  const cost = buildingCost(tile);
  const rel = owner && !mine ? g.relations[owner.id] : null;
  return (
    <Panel title="Selected land" tone={owner?.color}>
      <Row gap={S.md}>
        {owner ? <GodMark glyph={owner.glyph} color={owner.color} size={40} /> : <View style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: C.line, borderStyle: 'dashed' }} />}
        <View style={{ flex: 1 }}>
          <Body style={{ fontFamily: F.bodyBold }}>{owner ? (mine ? 'Your faithful' : `Faithful of ${owner.name}`) : 'Unaligned souls'}</Body>
          <Mono size={11} color={C.muted}>{tile.terrain} · {tile.pop} souls · {BUILDING_NAMES[tile.building]}{tile.wall ? ' · walled' : ''}</Mono>
          {owner && !mine && <Mono size={11} color={C.faint}>might {Math.round(might(owner))} vs yours {Math.round(might(g.player))}{rel?.kin ? ` · your ${rel.kin}` : ''}</Mono>}
        </View>
      </Row>
      {mine && (
        <View style={{ gap: S.sm }}>
          <Row wrap>
            <Btn small title={`Build walls · ${COSTS.wall}`} disabled={tile.wall || g.relics < COSTS.wall} onPress={() => act((gg) => buildWall(gg, tile.id))} />
            {tile.building < 3 && (
              <Btn small kind="primary" title={`${BUILDING_NAMES[tile.building + 1]} · ${cost}`} disabled={g.relics < cost} onPress={() => act((gg) => build(gg, tile.id))} />
            )}
          </Row>
          <Italic size={13}>Walls and holy buildings defend a village. Buildings also grow its population and spread your faith to neighbors.</Italic>
        </View>
      )}
      {!mine && adjacent && (
        <View style={{ gap: S.sm }}>
          <Row wrap>
            <Btn small kind="primary" title={`Send missionaries · ${COSTS.missionary}`} disabled={g.relics < COSTS.missionary} onPress={() => {
              const ok = act((gg) => sendMissionaries(gg, tile.id));
              setMsg(ok ? 'The village converts.' : 'Your missionaries were turned away.');
            }} />
            {owner && (
              <Btn small kind="danger" title={`Crusade (${g.army}/3 soldiers)`} disabled={g.army < 3} onPress={() => {
                const r = act((gg) => crusade(gg, tile.id));
                if (r) setMsg(r.text);
              }} />
            )}
          </Row>
          {rel?.kin && <Italic size={13} color={C.ember}>This is your kin. A crusade breaks your pantheon.</Italic>}
        </View>
      )}
      {!mine && !adjacent && <Italic size={13}>Too far away. Missionaries and armies can only reach lands that border yours.</Italic>}
      {msg && <Body size={14} color={C.gold}>{msg}</Body>}
    </Panel>
  );
}
