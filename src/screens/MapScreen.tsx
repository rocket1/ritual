import React, { useMemo, useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, G, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';
import { TRUTH_SHARE } from '../game/data';
import {
  build, BUILDING_NAMES, buildingCost, buildWall, COSTS, crusade, followersOf, godById, landTiles, might, neighbors,
  PLAYER, recruit, sendMissionaries, settlement, tilesOf,
} from '../game/engine';
import { act, useG } from '../game/store';
import type { GameState, Terrain, Tile } from '../game/types';
import { C, F, fs, mix, S } from '../theme';
import { Bar, Body, Btn, Display, GodMark, Italic, Label, Mono, Panel, Row } from '../ui/kit';
import { useUi } from '../ui/nav';

// The map is drawn in two layers. Underneath is a continuous landscape:
// rounded coastlines, forests and mountain ranges as masses that run across
// cell edges, and rivers. On top sits the hex grid that the game is played on.

// Natural hues, blended into each theme's land color so every theme gets a
// map that still reads as forest, rock and sand.
const HUE = { forest: '#4E9A5C', rock: '#9C948A', sand: '#D9B26F', snow: '#FFFFFF', river: '#5B9BD5' };

function mapColors() {
  const land = C.land;
  return {
    land,
    water: C.water,
    forest: mix(land, HUE.forest, 0.26),
    hill: mix(land, HUE.rock, 0.14),
    mountain: mix(land, HUE.rock, 0.3),
    desert: mix(land, HUE.sand, 0.3),
    grid: mix(land, C.text, 0.5),
    wave: mix(C.water, C.text, 0.2),
    tree: mix(land, HUE.forest, 0.62),
    treeDark: mix(mix(land, HUE.forest, 0.62), C.sunken, 0.35),
    ink: mix(land, C.text, 0.42),
    peak: mix(land, HUE.rock, 0.7),
    peakShade: mix(mix(land, HUE.rock, 0.7), C.sunken, 0.3),
    snow: mix(HUE.snow, land, 0.08),
    dune: mix(land, HUE.sand, 0.7),
    river: mix(C.water, HUE.river, 0.6),
    silt: mix(land, HUE.sand, 0.45),
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

/** A small seeded generator per tile, so the landscape is stable between renders. */
function tileRand(id: number) {
  let s = Math.imul(id + 1, 2654435761);
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

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
          style={{ flex: wide ? 1.8 : undefined, width: wide ? undefined : '100%', padding: S.sm, gap: S.sm, backgroundColor: C.water, borderWidth: 1, borderColor: C.line, borderRadius: 4, alignItems: 'center' }}
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
            <Italic size={13}>Borders also shift on their own every hour. The computer resolves each clash from the gods' attributes plus chance. Mountains resist conversion and are easier to defend.</Italic>
          </Panel>
        </View>
      </View>
    </ScrollView>
  );
}

function HexMap({ g, R, sel, onSelect }: { g: GameState; R: number; sel: number | null; onSelect: (id: number) => void }) {
  const col = mapColors();
  const { w, corners, pts } = geometry(R);
  const width = w * (g.map.w + 0.5);
  const height = R * (1.5 * (g.map.h - 1) + 2);
  const tiles = g.map.tiles;
  // The landscape only changes with the map, size or theme, so skip rebuilding it every hour.
  const landscape = useMemo(() => <Landscape g={g} R={R} col={col} />, [g.map, R, C.land, C.water, C.text]);

  return (
    <Svg width={width} height={height} accessibilityLabel={`Map of ${g.planet.name}`}>
      {landscape}

      {/* the game grid, laid lightly over the land */}
      {tiles.map((t) => (t.terrain === 'water' ? null : (
        <Polygon key={`g${t.id}`} points={pts(corners(t))} fill="none" stroke={col.grid} strokeOpacity={0.22} strokeWidth={0.8} />
      )))}

      {/* territory tint */}
      {tiles.map((t) => {
        const owner = godById(g, t.owner);
        if (!owner) return null;
        return <Polygon key={`o${t.id}`} points={pts(corners(t))} fill={owner.color} fillOpacity={t.owner === PLAYER ? 0.38 : 0.26} />;
      })}

      {/* borders between faiths, drawn just inside each side */}
      {tiles.map((t) => {
        const owner = godById(g, t.owner);
        if (!owner) return null;
        const cs = corners(t, 0.9);
        return EDGES.map((e, i) => {
          const n = across(g.map, t, e);
          if (n && (n.owner === t.owner || n.terrain === 'water')) return null;
          return <Path key={`b${t.id}-${i}`} d={`M${cs[e[0]].x},${cs[e[0]].y} L${cs[e[1]].x},${cs[e[1]].y}`} stroke={owner.color} strokeWidth={t.owner === PLAYER ? R * 0.16 : R * 0.11} strokeLinecap="round" />;
        });
      })}

      {/* walls */}
      {tiles.filter((t) => t.wall).map((t) => (
        <Polygon key={`w${t.id}`} points={pts(corners(t, 0.62))} fill="none" stroke={col.ink} strokeWidth={R * 0.1} strokeDasharray={`${R * 0.16},${R * 0.08}`} />
      ))}

      {/* holy buildings */}
      {tiles.filter((t) => t.building > 0).map((t) => <Building key={`k${t.id}`} t={t} R={R} />)}

      {/* selection */}
      {sel != null && <Polygon points={pts(corners(tiles[sel], 0.97))} fill="none" stroke={C.text} strokeWidth={2.5} />}

      {/* hit targets */}
      {tiles.map((t) => (t.terrain === 'water' ? null : (
        <Polygon key={`h${t.id}`} points={pts(corners(t))} fill={C.bg} fillOpacity={0.001} onPress={() => onSelect(t.id)} />
      )))}
    </Svg>
  );
}

type Mark = { y: number; el: React.ReactElement };

function Landscape({ g, R, col }: { g: GameState; R: number; col: Colors }) {
  const { center } = geometry(R);
  const tiles = g.map.tiles;
  const land = tiles.filter((t) => t.terrain !== 'water');
  const of = (...kinds: Terrain[]) => land.filter((t) => kinds.includes(t.terrain));

  // Several overlapping circles per cell merge into soft, irregular masses
  // that ignore the hex edges. `r` is the overall reach in cell radii.
  const blobs = (list: Tile[], fill: string, r: number, key: string, parts = 4) => list.flatMap((t) => {
    const rnd = tileRand(t.id * 7 + key.charCodeAt(0));
    const c = center(t);
    return Array.from({ length: parts }, (_, i) => {
      const a = rnd() * Math.PI * 2;
      const d = parts === 1 ? 0 : R * r * 0.42 * rnd();
      return <Circle key={`${key}${t.id}-${i}`} cx={c.x + Math.cos(a) * d} cy={c.y + Math.sin(a) * d} r={R * r * (0.62 + rnd() * 0.18)} fill={fill} />;
    });
  });

  // Symbols scattered across each region and drawn back to front, so forests
  // and ranges read as continuous areas rather than one icon per cell.
  const marks: Mark[] = [];
  for (const t of of('forest')) {
    const rnd = tileRand(t.id);
    const c = center(t);
    for (let i = 0; i < 7; i++) {
      const x = c.x + (rnd() - 0.5) * R * 1.7;
      const y = c.y + (rnd() - 0.5) * R * 1.5;
      const s = R * (0.16 + rnd() * 0.08);
      marks.push({ y, el: (
        <G key={`tr${t.id}-${i}`}>
          <Polygon points={`${x},${y - s * 1.6} ${x - s * 0.75},${y + s * 0.3} ${x + s * 0.75},${y + s * 0.3}`} fill={col.tree} />
          <Polygon points={`${x},${y - s * 1.6} ${x + s * 0.75},${y + s * 0.3} ${x},${y + s * 0.3}`} fill={col.treeDark} />
        </G>
      ) });
    }
  }
  for (const t of of('mountain')) {
    const rnd = tileRand(t.id + 5000);
    const c = center(t);
    for (let i = 0; i < 4; i++) {
      const x = c.x + (rnd() - 0.5) * R * 1.6;
      const y = c.y + (rnd() - 0.5) * R * 1.1;
      const h = R * (0.45 + rnd() * 0.3);
      marks.push({ y, el: <Peak key={`pk${t.id}-${i}`} x={x} y={y} h={h} col={col} snow /> });
    }
  }
  for (const t of of('hill')) {
    const rnd = tileRand(t.id + 7000);
    const c = center(t);
    for (let i = 0; i < 3; i++) {
      const x = c.x + (rnd() - 0.5) * R * 1.6;
      const y = c.y + (rnd() - 0.5) * R * 1.3;
      const s = R * (0.22 + rnd() * 0.12);
      marks.push({ y, el: <Path key={`hl${t.id}-${i}`} d={`M${x - s * 1.2},${y} Q${x},${y - s * 1.1} ${x + s * 1.2},${y}`} fill="none" stroke={col.ink} strokeOpacity={0.55} strokeWidth={Math.max(1, R * 0.06)} strokeLinecap="round" /> });
    }
    // the occasional foothill peak where hills meet mountains
    if (neighbors(g.map, t).some((n) => n.terrain === 'mountain') && rnd() < 0.7) {
      marks.push({ y: c.y, el: <Peak key={`fh${t.id}`} x={c.x + (rnd() - 0.5) * R} y={c.y} h={R * 0.32} col={col} /> });
    }
  }
  for (const t of of('desert')) {
    const rnd = tileRand(t.id + 9000);
    const c = center(t);
    for (let i = 0; i < 3; i++) {
      const x = c.x + (rnd() - 0.5) * R * 1.6;
      const y = c.y + (rnd() - 0.5) * R * 1.4;
      const s = R * 0.2;
      marks.push({ y, el: <Path key={`dn${t.id}-${i}`} d={`M${x - s},${y} q${s * 0.5},${-s * 0.5} ${s},0 t${s},0`} fill="none" stroke={col.dune} strokeWidth={Math.max(1, R * 0.06)} strokeLinecap="round" /> });
    }
  }
  marks.sort((a, b) => a.y - b.y);

  return (
    <G>
      {/* sea */}
      <Rect x={0} y={0} width={9999} height={9999} fill={col.water} />
      {tiles.filter((t) => t.terrain === 'water' && t.id % 3 === 0).map((t) => {
        const { x, y } = center(t);
        const s = R * 0.22;
        return <Path key={`v${t.id}`} d={`M${x - s * 1.5},${y} q${s * 0.75},${-s * 0.6} ${s * 1.5},0 t${s * 1.5},0`} fill="none" stroke={col.wave} strokeWidth={Math.max(1, R * 0.05)} strokeLinecap="round" />;
      })}

      {/* land with a rounded coast, then the terrain masses */}
      {land.map((t) => {
        const c = center(t);
        return <Circle key={`ld${t.id}`} cx={c.x} cy={c.y} r={R * 1.08} fill={col.land} />;
      })}
      {blobs(of('desert'), col.desert, 1.15, 'ds')}
      {blobs(of('hill', 'mountain'), col.hill, 1.2, 'hi')}
      {blobs(of('forest'), col.forest, 1.2, 'fo')}
      {blobs(of('mountain'), col.mountain, 1.1, 'mo')}

      {/* rivers, with their deltas */}
      {g.map.rivers.map((path, i) => <River key={`r${i}`} path={path.map((id) => tiles[id])} R={R} col={col} seed={i} center={center} />)}

      {marks.map((m) => m.el)}
    </G>
  );
}

type Pt = { x: number; y: number };

/** Midpoint-smoothed path through a list of points. */
function smooth(p: Pt[], close = false) {
  let d = `M${p[0].x.toFixed(1)},${p[0].y.toFixed(1)}`;
  for (let k = 1; k < p.length - 1; k++) {
    const mx = (p[k].x + p[k + 1].x) / 2;
    const my = (p[k].y + p[k + 1].y) / 2;
    d += ` Q${p[k].x.toFixed(1)},${p[k].y.toFixed(1)} ${mx.toFixed(1)},${my.toFixed(1)}`;
  }
  d += ` L${p[p.length - 1].x.toFixed(1)},${p[p.length - 1].y.toFixed(1)}`;
  return close ? `${d} Z` : d;
}

/**
 * Turn a coarse line into a meandering one: each stretch between control
 * points bows out to alternating sides, with a smaller ripple on top.
 */
function meander(p: Pt[], R: number, rnd: () => number, amp: number, steps = 12): Pt[] {
  const out: Pt[] = [p[0]];
  let side = rnd() < 0.5 ? 1 : -1;
  for (let k = 0; k < p.length - 1; k++) {
    const a = p[k];
    const b = p[k + 1];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const bow = R * amp * (0.6 + rnd() * 0.6) * side;
    const ripple = R * amp * 0.55 * (rnd() < 0.5 ? -1 : 1) * (0.5 + rnd() * 0.5);
    for (let i = 1; i <= steps; i++) {
      const u = i / steps;
      const off = bow * Math.sin(Math.PI * u) + ripple * Math.sin(4 * Math.PI * u);
      out.push({ x: a.x + dx * u + nx * off, y: a.y + dy * u + ny * off });
    }
    side = -side;
  }
  return out;
}

/** A filled channel whose half-width runs from w0 at the start to w1 at the end. */
function ribbon(p: Pt[], w0: number, w1: number) {
  const left: Pt[] = [];
  const right: Pt[] = [];
  p.forEach((pt, k) => {
    const a = p[Math.max(0, k - 1)];
    const b = p[Math.min(p.length - 1, k + 1)];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const t = k / (p.length - 1);
    const hw = w0 + (w1 - w0) * Math.pow(t, 0.8);
    left.push({ x: pt.x - (dy / len) * hw, y: pt.y + (dx / len) * hw });
    right.push({ x: pt.x + (dy / len) * hw, y: pt.y - (dx / len) * hw });
  });
  return smooth([...left, ...right.reverse()], true);
}

function River({ path, R, col, seed, center }: { path: Tile[]; R: number; col: Colors; seed: number; center: (t: Tile) => Pt }) {
  const rnd = tileRand(path[0].id * 31 + seed);
  const toSea = path[path.length - 1].terrain === 'water';
  const land = toSea ? path.slice(0, -1) : path;

  // Control points: cell centers, nudged off the grid.
  const ctrl: Pt[] = land.map((t, k) => {
    const c = center(t);
    if (k === 0) return c;
    return { x: c.x + (rnd() - 0.5) * R * 0.5, y: c.y + (rnd() - 0.5) * R * 0.5 };
  });

  // Where the river meets the sea, and which way the sea lies.
  let mouth: Pt | null = null;
  let dir: Pt = { x: 0, y: 1 };
  if (toSea) {
    const last = center(land[land.length - 1]);
    const sea = center(path[path.length - 1]);
    const len = Math.hypot(sea.x - last.x, sea.y - last.y) || 1;
    dir = { x: (sea.x - last.x) / len, y: (sea.y - last.y) / len };
    mouth = { x: last.x + dir.x * R * 0.6, y: last.y + dir.y * R * 0.6 };
    ctrl.push(mouth);
  }
  if (ctrl.length < 2) return null;

  const main = meander(ctrl, R, rnd, 0.42);
  const wEnd = R * 0.11;

  // The delta: a silt fan pushing into the sea, cut by fanning distributaries.
  const delta: React.ReactNode[] = [];
  if (mouth) {
    const rot = (v: Pt, deg: number) => {
      const a = (deg * Math.PI) / 180;
      return { x: v.x * Math.cos(a) - v.y * Math.sin(a), y: v.x * Math.sin(a) + v.y * Math.cos(a) };
    };
    const reach = R * (1.15 + rnd() * 0.3);
    const fan: Pt[] = [mouth];
    for (let a = -62; a <= 62; a += 8) {
      const v = rot(dir, a);
      const r = reach * (1.05 - Math.abs(a) / 150) * (0.88 + rnd() * 0.24);
      fan.push({ x: mouth.x + v.x * r, y: mouth.y + v.y * r });
    }
    fan.push(mouth);
    delta.push(<Path key="fan" d={smooth(fan, true)} fill={col.silt} />);

    const arms = 4 + (rnd() < 0.5 ? 1 : 0);
    for (let k = 0; k < arms; k++) {
      const ang = -48 + (96 * k) / (arms - 1) + (rnd() - 0.5) * 12;
      const v = rot(dir, ang);
      const len = reach * (0.75 + rnd() * 0.3) * (1 - Math.abs(ang) / 260);
      const end = { x: mouth.x + v.x * len, y: mouth.y + v.y * len };
      const mid = { x: (mouth.x + end.x) / 2, y: (mouth.y + end.y) / 2 };
      const arm = meander([mouth, mid, end], R, rnd, 0.06, 6);
      delta.push(<Path key={`arm${k}`} d={ribbon(arm, wEnd * 0.7, R * 0.045)} fill={col.river} />);
    }
  }

  return (
    <G>
      {delta.length > 0 && delta[0]}
      <Path d={ribbon(main, R * 0.025, wEnd)} fill={col.river} />
      {delta.slice(1)}
    </G>
  );
}

function Peak({ x, y, h, col, snow }: { x: number; y: number; h: number; col: Colors; snow?: boolean }) {
  return (
    <G>
      <Polygon points={`${x},${y - h} ${x - h * 0.95},${y + h * 0.35} ${x + h * 0.95},${y + h * 0.35}`} fill={col.peak} />
      <Polygon points={`${x},${y - h} ${x + h * 0.95},${y + h * 0.35} ${x + h * 0.15},${y + h * 0.35}`} fill={col.peakShade} />
      {snow && <Polygon points={`${x},${y - h} ${x - h * 0.3},${y - h * 0.58} ${x + h * 0.32},${y - h * 0.58}`} fill={col.snow} />}
    </G>
  );
}

const NUMERALS = ['', 'Ⅰ', 'Ⅱ', 'Ⅲ'];

function Building({ t, R }: { t: Tile; R: number }) {
  const { center } = geometry(R);
  const c = center(t);
  return (
    <SvgText x={c.x} y={c.y + R * 0.18} fontSize={R * 0.55} fontFamily={F.display} fill={C.gold} stroke={C.sunken} strokeWidth={1} textAnchor="middle">
      {NUMERALS[t.building]}
    </SvgText>
  );
}

function Legend() {
  const col = mapColors();
  const item = (label: string, icon: React.ReactNode) => (
    <Row key={label} gap={6}>
      <Svg width={22} height={16}>{icon}</Svg>
      <Mono size={10} color={C.text}>{label}</Mono>
    </Row>
  );
  return (
    <Row wrap gap={S.md} style={{ justifyContent: 'center', paddingVertical: 4, paddingHorizontal: S.sm, backgroundColor: C.surface, borderRadius: 3 }}>
      {item('forest', <Polygon points="11,1 5,14 17,14" fill={col.tree} />)}
      {item('mountains', <G><Polygon points="8,3 1,15 15,15" fill={col.peak} /><Polygon points="15,6 9,15 21,15" fill={col.peakShade} /></G>)}
      {item('hills', <Path d="M2,13 Q11,2 20,13" fill="none" stroke={col.ink} strokeWidth={1.5} />)}
      {item('desert', <Path d="M1,10 q5,-5 10,0 t10,0" fill="none" stroke={col.dune} strokeWidth={1.5} />)}
      {item('river', <Path d="M1,10 q5,-6 10,0 t10,0" fill="none" stroke={col.river} strokeWidth={2.5} />)}
      {item('walls', <Rect x={4} y={3} width={14} height={10} fill="none" stroke={col.ink} strokeWidth={1.5} strokeDasharray="3,2" />)}
      {item('church Ⅰ · temple Ⅱ · cathedral Ⅲ', <SvgText x={11} y={13} fontSize={13} fontFamily={F.display} fill={C.gold} textAnchor="middle">Ⅰ</SvgText>)}
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
  const features = [tile.terrain, tile.river ? 'on a river' : null].filter(Boolean).join(' · ');
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
