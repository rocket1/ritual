import React, { useMemo, useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import Svg, { G, Line, Path, Polygon, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import { TRUTH_SHARE } from '../game/data';
import {
  build, BUILDING_NAMES, buildingCost, buildWall, COSTS, crusade, followersOf, godById, hasRoad, landTiles, might,
  neighbors, PLAYER, recruit, sendMissionaries, settlement, tilesOf,
} from '../game/engine';
import { act, useG } from '../game/store';
import type { GameState, Tile } from '../game/types';
import { C, F, fs, mix, S } from '../theme';
import { Bar, Body, Btn, Display, GodMark, Italic, Label, Mono, Panel, Row } from '../ui/kit';
import { useUi } from '../ui/nav';

// Natural hues, blended into each theme's land color so every theme gets a
// map that still reads as forest, rock and sand.
const HUE = { forest: '#4E9A5C', rock: '#9C948A', sand: '#D9B26F', snow: '#FFFFFF', river: '#5B9BD5' };

function mapColors() {
  const land = C.land;
  return {
    plain: land,
    forest: mix(land, HUE.forest, 0.22),
    hill: mix(land, HUE.rock, 0.16),
    mountain: mix(land, HUE.rock, 0.32),
    desert: mix(land, HUE.sand, 0.3),
    water: C.water,
    grid: mix(land, C.text, 0.08),
    shore: mix(C.water, C.text, 0.35),
    wave: mix(C.water, C.text, 0.22),
    tree: mix(land, HUE.forest, 0.7),
    ink: mix(land, C.text, 0.45),
    peak: mix(land, HUE.rock, 0.75),
    snow: mix(HUE.snow, land, 0.08),
    dune: mix(land, HUE.sand, 0.75),
    river: mix(C.water, HUE.river, 0.6),
    road: mix(land, C.text, 0.5),
    house: mix(C.text, land, 0.1),
    houseEdge: C.sunken,
  };
}
type Colors = ReturnType<typeof mapColors>;

// Pointy-top hexes on an odd-row offset grid. Each edge is listed with the
// neighbor it faces: [cornerA, cornerB, dxEven, dyEven, dxOdd, dyOdd].
type Edge = [number, number, number, number, number, number];
const EDGES: Edge[] = [
  [0, 1, 0, -1, 1, -1], // NE
  [1, 2, 1, 0, 1, 0], // E
  [2, 3, 0, 1, 1, 1], // SE
  [3, 4, -1, 1, 0, 1], // SW
  [4, 5, -1, 0, -1, 0], // W
  [5, 0, -1, -1, 0, -1], // NW
];

function geometry(R: number) {
  const w = Math.sqrt(3) * R;
  const center = (t: Tile) => ({ x: w * (t.x + 0.5 + (t.y % 2 ? 0.5 : 0)), y: R + t.y * 1.5 * R });
  const corners = (t: Tile, scale = 1) => {
    const { x, y } = center(t);
    return [0, 1, 2, 3, 4, 5].map((k) => {
      const a = (Math.PI / 180) * (60 * k - 90);
      return { x: x + R * scale * Math.cos(a), y: y + R * scale * Math.sin(a) };
    });
  };
  const pts = (cs: { x: number; y: number }[]) => cs.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  return { w, center, corners, pts };
}

function across(map: GameState['map'], t: Tile, e: Edge) {
  const x = t.x + (t.y % 2 ? e[4] : e[2]);
  const y = t.y + (t.y % 2 ? e[5] : e[3]);
  return x >= 0 && y >= 0 && x < map.w && y < map.h ? map.tiles[y * map.w + x] : null;
}

// Stable per-tile offsets so features don't sit in a perfect grid.
const jitter = (id: number, k: number) => ((id * 9301 + k * 49297) % 233280) / 233280 - 0.5;

export function MapScreen() {
  const g = useG();
  const { wide } = useUi();
  const { width } = useWindowDimensions();
  const [boxW, setBoxW] = useState<number | null>(null);
  const [sel, setSel] = useState<number | null>(tilesOf(g, PLAYER)[0]?.id ?? null);
  const [msg, setMsg] = useState<string | null>(null);

  const avail = (boxW ?? (wide ? width * 0.55 : width - S.lg * 2)) - S.sm * 2 - 2;
  const R = Math.max(11, Math.min(46, avail / (Math.sqrt(3) * (g.map.w + 0.5))));

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
        <View
          onLayout={(e) => setBoxW(e.nativeEvent.layout.width)}
          style={{ flex: wide ? 1.8 : undefined, width: wide ? undefined : '100%', padding: S.sm, gap: S.sm, backgroundColor: C.sunken, borderWidth: 1, borderColor: C.line, borderRadius: 4, alignItems: 'center' }}
        >
          <HexMap g={g} R={R} sel={sel} onSelect={(id) => { setSel(id); setMsg(null); }} />
          <Legend />
        </View>

        <View style={{ flex: 1, gap: S.lg, width: wide ? undefined : '100%', minWidth: wide ? fs(300) : undefined, maxWidth: wide ? fs(380) : undefined }}>
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
            <Mono size={10} color={C.faint}>settlements · followers</Mono>
          </Panel>
          <Panel title="Army">
            <Row style={{ justifyContent: 'space-between' }}>
              <Body>{g.army} soldiers</Body>
              <Btn small title={`Recruit · ${COSTS.soldier}`} disabled={g.relics < COSTS.soldier} onPress={() => act(recruit)} />
            </Row>
            <Italic size={13}>Borders also shift on their own every hour. The computer resolves each clash from the gods' attributes plus chance. Faith travels faster along roads; mountains resist it.</Italic>
          </Panel>
        </View>
      </View>
    </ScrollView>
  );
}

function HexMap({ g, R, sel, onSelect }: { g: GameState; R: number; sel: number | null; onSelect: (id: number) => void }) {
  const col = mapColors();
  const { w, center, corners, pts } = geometry(R);
  const width = w * (g.map.w + 0.5);
  const height = R * (1.5 * (g.map.h - 1) + 2);
  const tiles = g.map.tiles;
  const labelSize = Math.max(fs(9), R * 0.36);
  // Terrain only changes with the map, size or theme, so skip rebuilding it every hour.
  const terrain = useMemo(() => <TerrainLayer g={g} R={R} col={col} />, [g.map, R, C.land, C.water, C.text]);

  return (
    <Svg width={width} height={height} accessibilityLabel={`Map of ${g.planet.name}`}>
      {terrain}

      {/* territory tint */}
      {tiles.map((t) => {
        const owner = godById(g, t.owner);
        if (!owner) return null;
        return <Polygon key={`o${t.id}`} points={pts(corners(t))} fill={owner.color} fillOpacity={t.owner === PLAYER ? 0.4 : 0.28} />;
      })}

      {/* borders between faiths, drawn just inside each side */}
      {tiles.map((t) => {
        const owner = godById(g, t.owner);
        if (!owner) return null;
        const cs = corners(t, 0.9);
        return EDGES.map((e, i) => {
          const n = across(g.map, t, e);
          if (n && (n.owner === t.owner || n.terrain === 'water')) return null;
          return <Line key={`b${t.id}-${i}`} x1={cs[e[0]].x} y1={cs[e[0]].y} x2={cs[e[1]].x} y2={cs[e[1]].y} stroke={owner.color} strokeWidth={t.owner === PLAYER ? R * 0.16 : R * 0.11} strokeLinecap="round" />;
        });
      })}

      {/* walls */}
      {tiles.filter((t) => t.wall).map((t) => (
        <Polygon key={`w${t.id}`} points={pts(corners(t, 0.62))} fill="none" stroke={col.ink} strokeWidth={R * 0.1} strokeDasharray={`${R * 0.16},${R * 0.08}`} />
      ))}

      {/* settlements and holy buildings */}
      {tiles.map((t) => (t.terrain === 'water' ? null : <Settlement key={`s${t.id}`} t={t} R={R} col={col} c={center(t)} />))}

      {/* names of towns, cities and holy places */}
      {R >= 20 && tiles.filter((t) => t.terrain !== 'water' && (t.pop >= 28 || t.building > 0)).map((t) => {
        const c = center(t);
        const props = { x: c.x, y: c.y + R * 0.78, fontSize: labelSize, fontFamily: F.body, textAnchor: 'middle' as const };
        return (
          <G key={`l${t.id}`}>
            <SvgText {...props} stroke={C.sunken} strokeWidth={3} strokeLinejoin="round" fill={C.sunken}>{t.name}</SvgText>
            <SvgText {...props} fill={t.owner === PLAYER ? C.text : col.ink}>{t.name}</SvgText>
          </G>
        );
      })}

      {/* selection */}
      {sel != null && <Polygon points={pts(corners(tiles[sel], 0.97))} fill="none" stroke={C.text} strokeWidth={2.5} />}

      {/* hit targets */}
      {tiles.map((t) => (t.terrain === 'water' ? null : (
        <Polygon key={`h${t.id}`} points={pts(corners(t))} fill={C.bg} fillOpacity={0.001} onPress={() => onSelect(t.id)} />
      )))}
    </Svg>
  );
}

function TerrainLayer({ g, R, col }: { g: GameState; R: number; col: Colors }) {
  const { center, corners, pts } = geometry(R);
  const tiles = g.map.tiles;
  return (
    <G>
      {tiles.map((t) => (
        <Polygon key={`t${t.id}`} points={pts(corners(t))} fill={col[t.terrain]} stroke={t.terrain === 'water' ? col.water : col.grid} strokeWidth={0.6} />
      ))}

      {/* coastlines */}
      {tiles.filter((t) => t.terrain !== 'water').map((t) => {
        const cs = corners(t);
        return EDGES.map((e, i) => {
          const n = across(g.map, t, e);
          if (n && n.terrain !== 'water') return null;
          return <Line key={`c${t.id}-${i}`} x1={cs[e[0]].x} y1={cs[e[0]].y} x2={cs[e[1]].x} y2={cs[e[1]].y} stroke={col.shore} strokeWidth={Math.max(1.2, R * 0.07)} strokeLinecap="round" />;
        });
      })}

      {/* waves */}
      {tiles.filter((t) => t.terrain === 'water' && (t.id * 7) % 3 === 0).map((t) => {
        const { x, y } = center(t);
        const s = R * 0.22;
        return <Path key={`v${t.id}`} d={`M${x - s * 1.5},${y} q${s * 0.75},${-s * 0.6} ${s * 1.5},0 t${s * 1.5},0`} fill="none" stroke={col.wave} strokeWidth={Math.max(1, R * 0.05)} strokeLinecap="round" />;
      })}

      {/* terrain features, set toward the top of the hex to leave room for towns */}
      {tiles.map((t) => <Feature key={`f${t.id}`} t={t} R={R} col={col} c={center(t)} />)}

      {/* rivers */}
      {g.map.rivers.map((path, i) => (
        <Polyline
          key={`r${i}`}
          points={path.map((id, k) => {
            const c = center(tiles[id]);
            const end = k === 0 || k === path.length - 1;
            return `${(c.x + (end ? 0 : jitter(id, 1) * R * 0.5)).toFixed(1)},${(c.y + (end ? 0 : jitter(id, 2) * R * 0.5)).toFixed(1)}`;
          }).join(' ')}
          fill="none"
          stroke={col.river}
          strokeWidth={Math.max(1.5, R * 0.14)}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}

      {/* roads */}
      {g.map.roads.map(([a, b]) => {
        const p = center(tiles[a]);
        const q = center(tiles[b]);
        return <Line key={`d${a}-${b}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={col.road} strokeWidth={Math.max(1, R * 0.08)} strokeDasharray={`${R * 0.22},${R * 0.14}`} strokeLinecap="round" />;
      })}
    </G>
  );
}

function Feature({ t, R, col, c }: { t: Tile; R: number; col: Colors; c: { x: number; y: number } }) {
  const s = R * 0.2;
  const j = (k: number) => jitter(t.id, k) * R * 0.12;
  const sw = (k: number) => Math.max(0.8, R * k);
  switch (t.terrain) {
    case 'forest':
      return (
        <G>
          {[[-0.38, -0.22], [0, -0.42], [0.36, -0.2], [-0.12, 0.02]].map(([dx, dy], i) => {
            const x = c.x + dx * R + j(i);
            const y = c.y + dy * R + j(i + 5);
            return <Polygon key={i} points={`${x},${y - s} ${x - s * 0.65},${y + s * 0.55} ${x + s * 0.65},${y + s * 0.55}`} fill={col.tree} />;
          })}
        </G>
      );
    case 'hill':
      return (
        <G>
          {[[-0.3, -0.25], [0.22, -0.38]].map(([dx, dy], i) => {
            const x = c.x + dx * R + j(i);
            const y = c.y + dy * R;
            return <Path key={i} d={`M${x - s * 1.1},${y + s * 0.4} Q${x},${y - s * 0.9} ${x + s * 1.1},${y + s * 0.4}`} fill="none" stroke={col.ink} strokeWidth={sw(0.06)} strokeLinecap="round" />;
          })}
        </G>
      );
    case 'mountain': {
      const peak = (x: number, y: number, h: number, k: number) => (
        <G key={k}>
          <Polygon points={`${x},${y - h} ${x - h * 0.9},${y + h * 0.6} ${x + h * 0.9},${y + h * 0.6}`} fill={col.peak} stroke={col.ink} strokeWidth={sw(0.04)} strokeLinejoin="round" />
          <Polygon points={`${x},${y - h} ${x - h * 0.3},${y - h * 0.45} ${x + h * 0.3},${y - h * 0.45}`} fill={col.snow} />
        </G>
      );
      return <G>{peak(c.x - R * 0.2, c.y - R * 0.05, R * 0.42, 0)}{peak(c.x + R * 0.28, c.y + R * 0.05, R * 0.3, 1)}</G>;
    }
    case 'desert':
      return (
        <G>
          {[[-0.35, -0.3], [0.15, -0.4], [0.3, -0.12]].map(([dx, dy], i) => {
            const x = c.x + dx * R + j(i);
            const y = c.y + dy * R;
            return <Path key={i} d={`M${x - s},${y} q${s * 0.5},${-s * 0.5} ${s},0 t${s},0`} fill="none" stroke={col.dune} strokeWidth={sw(0.06)} strokeLinecap="round" />;
          })}
        </G>
      );
    case 'plain':
      // farmland around the larger settlements
      if (t.pop < 25) return null;
      return (
        <G>
          {[0, 1, 2].map((i) => {
            const x = c.x - R * 0.55 + i * R * 0.13;
            const y = c.y - R * 0.35;
            return <Line key={i} x1={x} y1={y} x2={x + R * 0.18} y2={y + R * 0.3} stroke={col.ink} strokeOpacity={0.5} strokeWidth={sw(0.04)} />;
          })}
        </G>
      );
    default:
      return null;
  }
}

const NUMERALS = ['', 'Ⅰ', 'Ⅱ', 'Ⅲ'];

function Settlement({ t, R, col, c }: { t: Tile; R: number; col: Colors; c: { x: number; y: number } }) {
  const size = settlement(t);
  const h = R * 0.13;
  const house = (dx: number, dy: number, k: number, scale = 1) => (
    <Rect key={k} x={c.x + dx * R - (h * scale) / 2} y={c.y + dy * R - (h * scale) / 2} width={h * scale} height={h * scale} fill={col.house} stroke={col.houseEdge} strokeWidth={0.6} />
  );
  let marks: React.ReactNode[];
  if (size === 'hamlet') marks = t.terrain === 'mountain' ? [] : [house(0.05, 0.22, 0, 0.8)];
  else if (size === 'village') marks = [house(-0.08, 0.2, 0), house(0.12, 0.28, 1)];
  else if (size === 'town') marks = [house(-0.14, 0.18, 0), house(0.06, 0.12, 1), house(0.18, 0.3, 2), house(-0.02, 0.34, 3)];
  else marks = [
    house(-0.2, 0.22, 0, 1.1), house(0, 0.12, 1, 1.2), house(0.2, 0.22, 2, 1.1), house(-0.1, 0.38, 3), house(0.12, 0.4, 4),
    <Rect key="tower" x={c.x - h * 0.4} y={c.y - R * 0.12} width={h * 0.8} height={h * 1.6} fill={col.house} stroke={col.houseEdge} strokeWidth={0.6} />,
  ];
  return (
    <G>
      {marks}
      {t.building > 0 && (
        <SvgText x={c.x - R * 0.42} y={c.y + R * 0.38} fontSize={R * 0.42} fontFamily={F.display} fill={C.gold} stroke={C.sunken} strokeWidth={0.8} textAnchor="middle">{NUMERALS[t.building]}</SvgText>
      )}
    </G>
  );
}

function Legend() {
  const col = mapColors();
  const item = (label: string, icon: React.ReactNode) => (
    <Row key={label} gap={6}>
      <Svg width={22} height={14}>{icon}</Svg>
      <Mono size={10} color={C.muted}>{label}</Mono>
    </Row>
  );
  return (
    <Row wrap gap={S.md} style={{ justifyContent: 'center', paddingVertical: 4 }}>
      {item('road', <Line x1={1} y1={7} x2={21} y2={7} stroke={col.road} strokeWidth={2} strokeDasharray="4,3" />)}
      {item('river', <Path d="M1,9 q5,-6 10,0 t10,0" fill="none" stroke={col.river} strokeWidth={2.5} />)}
      {item('city', <G><Rect x={5} y={5} width={5} height={5} fill={col.house} /><Rect x={12} y={7} width={5} height={5} fill={col.house} /><Rect x={9} y={1} width={3} height={7} fill={col.house} /></G>)}
      {item('village', <G><Rect x={6} y={5} width={4} height={4} fill={col.house} /><Rect x={12} y={7} width={4} height={4} fill={col.house} /></G>)}
      {item('forest', <Polygon points="11,1 6,12 16,12" fill={col.tree} />)}
      {item('mountain', <Polygon points="11,1 4,13 18,13" fill={col.peak} />)}
      {item('walls', <Rect x={4} y={2} width={14} height={10} fill="none" stroke={col.ink} strokeWidth={1.5} strokeDasharray="3,2" />)}
      {item('church · temple · cathedral', <SvgText x={11} y={12} fontSize={12} fontFamily={F.display} fill={C.gold} textAnchor="middle">Ⅰ</SvgText>)}
    </Row>
  );
}

function TilePanel({ tile, msg, setMsg }: { tile: Tile; msg: string | null; setMsg: (s: string | null) => void }) {
  const g = useG();
  const owner = godById(g, tile.owner);
  const mine = tile.owner === PLAYER;
  const adjacent = neighbors(g.map, tile).some((n) => n.owner === PLAYER);
  const cost = buildingCost(tile);
  const rel = owner && !mine ? g.relations[owner.id] : null;
  const onRoad = neighbors(g.map, tile).some((n) => hasRoad(g.map, tile.id, n.id));
  const features = [tile.terrain, tile.river ? 'on a river' : null, onRoad ? 'on the road' : null].filter(Boolean).join(' · ');
  return (
    <Panel title="Selected land" tone={owner?.color}>
      <Row gap={S.md}>
        {owner ? <GodMark glyph={owner.glyph} color={owner.color} size={40} /> : <View style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: C.line, borderStyle: 'dashed' }} />}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Display size={20}>{tile.name}</Display>
          <Body size={14} color={C.muted}>A {settlement(tile)} of {tile.pop} souls · {owner ? (mine ? 'your faithful' : `faithful to ${owner.name}`) : 'unaligned'}</Body>
          <Mono size={11} color={C.faint}>{features} · {BUILDING_NAMES[tile.building]}{tile.wall ? ' · walled' : ''}</Mono>
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
          <Italic size={13}>Walls and holy buildings defend a settlement. Buildings also grow its population and spread your faith to neighbors.</Italic>
        </View>
      )}
      {!mine && adjacent && (
        <View style={{ gap: S.sm }}>
          <Row wrap>
            <Btn small kind="primary" title={`Send missionaries · ${COSTS.missionary}`} disabled={g.relics < COSTS.missionary} onPress={() => {
              const ok = act((gg) => sendMissionaries(gg, tile.id));
              setMsg(ok ? `${tile.name} converts.` : `${tile.name} turned your missionaries away.`);
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
