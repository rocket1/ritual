import React, { useRef } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { KIND_INFO, KIND_ORDER, TIERS, TRUTH_SHARE } from '../game/data';
import { ATTR_RANGE, ATTRS, COSTS } from '../game/engine';
import { C, F, fs, KIND_COLOR, S } from '../theme';
import { Body, Display, Italic, Label, Mono, Row } from '../ui/kit';

// The in-game instructions. Numbers come from the game's own constants where
// they exist, so the guide stays true when the balance changes.

const SECTIONS = [
  ['idea', 'The idea'],
  ['start', 'Creating your god'],
  ['clock', 'Time'],
  ['rituals', 'Rituals'],
  ['games', 'The ritual tasks'],
  ['growth', 'Growing your faith'],
  ['map', 'The map'],
  ['war', 'Spreading the faith'],
  ['signs', 'Omens, grace and stars'],
  ['pantheon', 'The pantheon'],
  ['myth', 'The myth'],
  ['wisdom', 'Wisdom'],
  ['charity', 'Charity'],
  ['tips', 'Tips'],
  ['mock', 'About this mockup'],
] as const;
type SectionId = (typeof SECTIONS)[number][0];

/** The full guide as a scrolling screen with a table of contents. */
export function Guide() {
  const scroll = useRef<ScrollView>(null);
  // Measure where a section actually is when its link is clicked; stored
  // layout positions go stale on the web as tables finish laying out.
  const content = useRef<View>(null);
  const sections = useRef<Partial<Record<SectionId, View | null>>>({});
  const jump = (id: SectionId) => {
    const node = sections.current[id];
    if (!node || !content.current) return;
    node.measureLayout(content.current, (_x, y) => scroll.current?.scrollTo({ y: Math.max(0, y + S.lg - S.sm), animated: true }), () => {});
  };

  return (
    <ScrollView ref={scroll} contentContainerStyle={{ padding: S.lg, alignItems: 'center' }}>
      <View ref={content} style={{ width: '100%', maxWidth: fs(820), gap: S.xl }}>
        <View style={{ gap: S.sm }}>
          <Display size={34}>How to play</Display>
          <Body color={C.muted}>Everything in Ritual, from your first ritual to carrying your god to another world.</Body>
          <Row wrap gap={6} style={{ marginTop: S.sm }}>
            {SECTIONS.map(([id, title]) => (
              <Pressable key={id} onPress={() => jump(id)} accessibilityRole="link" style={(st) => ({ paddingHorizontal: 9, paddingVertical: 4, borderRadius: 3, borderWidth: 1, borderColor: C.line, backgroundColor: (st as { hovered?: boolean }).hovered ? C.raised : 'transparent' })}>
                <Text style={{ fontFamily: F.mono, fontSize: fs(11), color: C.muted }}>{title}</Text>
              </Pressable>
            ))}
          </Row>
        </View>
        <GuideContent onSection={(id, node) => { sections.current[id] = node; }} />
      </View>
    </ScrollView>
  );
}

/** The guide's sections, without a scroll view, for use inside a sheet too. */
export function GuideContent({ onSection }: { onSection?: (id: SectionId, node: View | null) => void }) {
  return (
    <View style={{ gap: S.xl }}>
      <Sec onSection={onSection} id="idea">
        <P>You create a god, then play as its first follower. Your god grows stronger when you perform its <B>rituals</B>: small tasks that are good for you anyway, like a walk, a moment of stillness, a visit to a museum, an hour of service, or an honorable act.</P>
        <P>Rituals earn <B>relics</B>, the game's currency. Relics strengthen your god, and a stronger god wins followers from rival gods on the map. The goal is to convert the whole world.</P>
        <Quote>"The Roman religion was a religion of doing, not believing." What counts is that the rite gets done.</Quote>
      </Sec>

      <Sec onSection={onSection} id="start">
        <P>Pick one of ten starting myths, each loosely inspired by a world tradition, then make it yours:</P>
        <Bullets items={[
          <><B>Name, epithet and profile.</B> Leave them blank to keep the myth's own.</>,
          <><B>Color.</B> Used for your territory on the map.</>,
          <><B>Your sign.</B> Feeds the daily horoscope.</>,
          <><B>1,000 relics</B> to spend on four attributes, at 10 relics a point. Whatever you don't spend carries into the game, plus 120 relics to start.</>,
          <><B>Benevolence</B>, from −100 (wrathful) to +100 (kind).</>,
          <><B>Tithe</B>, the share of devotion you collect from followers each day.</>,
        ]} />
        <Table
          head={['Attribute', 'Range', 'What it does']}
          rows={[
            ['Power', `${ATTR_RANGE.power[0]} → ${ATTR_RANGE.power[1]}`, 'The biggest part of your might in border battles.'],
            ['Charisma', `${ATTR_RANGE.charisma[0]} → ${ATTR_RANGE.charisma[1]}`, 'How likely people are to join you. Drives conversion of unaligned settlements and missionary success.'],
            ['Wisdom', `${ATTR_RANGE.wisdom[0]} → ${ATTR_RANGE.wisdom[1]}`, 'Adds to might and improves your luck in the horoscopic rite.'],
            ['Evidence', `${ATTR_RANGE.evidence[0]} → ${ATTR_RANGE.evidence[1]}`, 'How grounded your myth is. Makes battle results steadier and less left to chance.'],
          ]}
        />
        <P>Might in battle is roughly 45% power, 20% charisma, 20% wisdom and 15% evidence. A <B>wrathful</B> god (negative benevolence) fights harder; a <B>kind</B> one converts unaligned people more easily. A tithe above 15% brings in more relics but costs 1 charisma a day.</P>
        <P>Not sure? <B>Quick start</B> makes a balanced god for you.</P>
      </Sec>

      <Sec onSection={onSection} id="clock">
        <P>The world runs on its own clock: one game hour every 4 seconds. The top bar shows the time and day.</P>
        <Bullets items={[
          <><B>Pause</B> (❚❚) stops time.</>,
          <><B>×4</B> runs it four times faster.</>,
          <><B>Pass 8 h</B> skips ahead (desktop).</>,
          <>Time stands still while a ritual or a duel is open, so nothing expires mid-rite.</>,
          <>Each new day brings a fresh horoscope, your tithes, and possibly a change in your god's myth.</>,
        ]} />
      </Sec>

      <Sec onSection={onSection} id="rituals">
        <P>Your god demands rituals throughout the day; they appear under <B>Rituals</B> and on the Temple. There are five orders. The rarer the order, the more it's worth:</P>
        <Table
          head={['Order', 'Relics', 'What you do']}
          rows={KIND_ORDER.map((k) => [
            <Text key={k} style={{ fontFamily: F.bodyBold, fontSize: fs(14), color: KIND_COLOR[k] }}>{KIND_INFO[k].label}</Text>,
            `${KIND_INFO[k].base[0]}–${KIND_INFO[k].base[1]}`,
            KIND_INFO[k].blurb,
          ])}
        />
        <P><B>Perform now or queue it.</B> Performing earns the full value. Queuing locks in 75% and gives you 24 more hours, but a queued ritual is a promise: miss its deadline and a <B>natural disaster</B> strikes (you lose 30–80 relics and either a settlement loses its faith or your followers shrink). Offers you simply ignore fade away with no penalty. You never have to do any particular ritual.</P>
        <P><B>How well you do matters.</B> Most tasks score your performance, and your reward scales with it (never below 15%).</P>
        <P><B>Bonuses.</B> The order favored by today's horoscope pays ×1.5. Completing one of your god's rituals also has an even chance of raising an attribute: Sacrifice raises power, Meditation wisdom, Jnana evidence, Dharma and Honor charisma. Dharma rituals release money from the charity pool.</P>
        <P><B>Other kinds of ritual</B></P>
        <Bullets items={[
          <><B>Rival rites.</B> Sometimes you wander into another god's domain. Their rite (a hymn) earns 40–70 relics and raises that god's favor toward you. It lasts 6 hours and can't be queued.</>,
          <><B>Assigned and custom rituals.</B> A trainer, teacher or friend can assign you a routine (a sample trainer assigns a daily circuit), and you can write your own checklists under <B>Create a ritual</B>.</>,
          <><B>Programmable rituals.</B> Attach a solver through the open API and it can answer riddles for you.</>,
        ]} />
      </Sec>

      <Sec onSection={onSection} id="games">
        <P>Each ritual opens a short task. Some offer a choice of task.</P>
        <Table
          head={['Task', 'How it works', 'Scoring']}
          flex={[1, 2.6, 1.6]}
          rows={[
            ['Walk the block', 'Hold the button to walk your laps, gathering relic orbs. On a phone, real footsteps would move you.', 'Full on finishing.'],
            ['Push the stone', 'Tap Push to roll the stone uphill. Stop, and it rolls back.', 'Full at the summit; giving up pays half your progress.'],
            ['Be still', 'Travel to the place, then hold the circle without letting go for the full count.', 'Each false start costs 10% (minimum 50%).'],
            ['Visit and read', 'Check in at the museum or library, read the placard, answer its question.', 'Right 100%, wrong 40%.'],
            ['Riddle', 'Type the answer. Three tries. A hint costs 5 wisdom points.', '100%, 80%, 60% by try; 15% if unsolved.'],
            ['Serve', 'Check in and stay ten minutes (about 12 seconds in the mockup), then reflect.', 'Full; leaving early pays less.'],
            ['Tell your story', 'Do the honorable act, then describe it in at least 40 characters. A hidden pilgrim rates it 1–5 stars. Specific details are believable; gushing adjectives are not.', 'Stars ÷ 5.'],
            ['Checklist', 'Tick off each step of a custom or assigned routine.', 'Share of steps done.'],
            ['Hymn', 'Sing a rival god\'s hymn (typed here; spoken on a phone).', 'How faithful your words are.'],
          ]}
        />
      </Sec>

      <Sec onSection={onSection} id="growth">
        <P>Your faith grows through five tiers, measured by how many settlements on the map follow you:</P>
        <Table
          head={['Tier', 'Needs', '']}
          rows={TIERS.map((t, i) => [
            <Text key={t.name} style={{ fontFamily: F.bodyBold, fontSize: fs(14), color: C.gold }}>{t.name}</Text>,
            i === 4 ? `${Math.round(TRUTH_SHARE * 100)}% of all land` : i === 0 ? 'Just you' : `${t.minTiles} settlements`,
            t.blurb,
          ])}
        />
        <P>Each new tier unseals a scroll of wisdom. Reaching <B>Truth</B> makes your god real, and you travel to a new planet: you keep your god's attributes and relics, start again as a Prophet, and face stronger rivals.</P>
        <P><B>Spending relics.</B> On the Temple, raise any attribute by 1 for 15 relics plus its current value (raising 50 to 51 costs 65). Relics also buy walls, holy buildings, missionaries, soldiers and offerings, covered below.</P>
        <P><B>Income.</B> Besides rituals, you collect tithes at each dawn: your followers × your tithe rate × 0.6, minus any share you've promised to kin.</P>
      </Sec>

      <Sec onSection={onSection} id="map">
        <P>The <B>Map</B> shows the world as a grid of hex cells over the landscape. Each land cell is a settlement with a name and a population. Cells tinted in a god's color follow that god; yours have the thickest border. Click any cell to see it.</P>
        <Table
          head={['Land', 'Effect']}
          rows={[
            ['Plains', 'The most people. Grows the largest settlements.'],
            ['Forest', 'Moderate population.'],
            ['Hills', 'Fewer people; +6 to defense.'],
            ['Mountains', 'Very few people; +14 to defense; conversion there is 60% harder.'],
            ['Desert', 'Sparse; conversion is 40% harder.'],
            ['Rivers', 'Settlements on a river hold more people and grow larger.'],
          ]}
        />
        <P><B>The borders move on their own.</B> Every hour the computer picks several border clashes. Unaligned settlements may convert to a neighbor (more likely with high charisma, kindness and holy buildings next door). Settlements held by rival gods may be fought over, decided by each side's might plus chance, with defenses added. Population grows every few hours, faster with holy buildings.</P>
      </Sec>

      <Sec onSection={onSection} id="war">
        <P>Select one of your own settlements to fortify it, or a neighboring one to take it.</P>
        <Table
          head={['Action', 'Cost', 'Effect']}
          flex={[1.3, 0.8, 2.6]}
          rows={[
            ['Walls', `${COSTS.wall}`, '+18 defense. Lost if the settlement falls.'],
            ['Church Ⅰ → Temple Ⅱ → Cathedral Ⅲ', COSTS.buildings.join(' / '), '+8 defense per level, larger population, and faith spreading to neighbors. A captured settlement loses one level.'],
            ['Missionaries', `${COSTS.missionary}`, 'Try to convert a settlement next to yours. Easier for unaligned people, harder against a charismatic god or holy buildings.'],
            ['Recruit a soldier', `${COSTS.soldier}`, 'Adds to your army.'],
            ['Crusade', '3+ soldiers', 'Attack a rival settlement next to yours with your might plus 4 per soldier. Win and you take it (losing 1–3 soldiers); lose and 2–5 fall.'],
          ]}
        />
        <P><B>Live challenges.</B> Sometimes another player challenges you for a border settlement. Duel them on the spot (tap Invoke faster than their devotion for five seconds) to win one of their settlements, or let the gods' attributes decide. You have 4 hours to answer.</P>
        <P>Attacking your own kin breaks your pantheon.</P>
      </Sec>

      <Sec onSection={onSection} id="signs">
        <P><B>Omens.</B> Strange signs appear on the Temple. Choose the right interpretation within 8 hours for 40 relics and +2 to a random attribute. Choose wrongly and you lose 25 relics. If you're unsure, ask for insight for {COSTS.hint} wisdom points.</P>
        <P><B>Requests for grace.</B> Other players perform rituals in your god's honor and ask for grace. You can't see how devoted they really are:</P>
        <Bullets items={[
          <><B>Extend grace</B>: costs 10 relics, raises your charisma by 1, and adds followers.</>,
          <><B>Refuse</B>: their hidden devotion is revealed. Refuse a true devotee (above 60) and your own god punishes you for most of their score in relics. Refuse a half-hearted one and your god rewards your discernment with 10 relics.</>,
        ]} />
        <P><B>The horoscope.</B> Each day the horoscope engine reads your sign and the planets. It names a <B>favored order</B> (those rituals pay ×1.5 and appear more often), a lucky attribute, and your luck out of 100. Once a day you can perform the <B>horoscopic rite</B> and let the stars decide: a windfall of 150 relics, a modest 60, a token 5, or, if you push your luck, a loss of 40. Wisdom tilts the odds.</P>
      </Sec>

      <Sec onSection={onSection} id="pantheon">
        <P>Every other god was created by another player. On the <B>Pantheon</B> screen you can see their attributes, might, lands and how they feel about you.</P>
        <Bullets items={[
          <><B>Offerings</B> ({COSTS.offering} relics) raise a god's favor by 12. Their rival rites raise it too.</>,
          <><B>Propose kinship.</B> Ask to become their Brother, Sister, Father, Mother, Son, Daughter or Consort, and set the terms: a share of your tithes, non-aggression, and mutual defense. They accept, make a counter-offer, or refuse.</>,
          <>They're more willing when they like you, when your benevolence is similar, when your terms are generous, and when they aren't much mightier than you. Claiming to be someone's Father or Mother is much harder unless you're mightier.</>,
          <><B>Kin</B> with non-aggression never attack you. With mutual defense, a fifth of their might is added when your lands are attacked. Your first kin founds your pantheon, which you can rename.</>,
          <>Dissolving a kinship costs 20 favor.</>,
        ]} />
      </Sec>

      <Sec onSection={onSection} id="myth">
        <P>Your god's attributes together are its <B>myth</B>, and the myth changes on its own. Every day an attribute drifts a little. From day 2, there's about a one-in-three chance each day of something bigger:</P>
        <Bullets items={[
          <><B>A change of heart.</B> Benevolence swings. Below −30 your god turns wrathful.</>,
          <><B>Relics unearthed or doubted.</B> Evidence rises or falls.</>,
          <><B>A new name.</B> The faithful start calling your god something new.</>,
          <><B>Schism.</B> Once you hold four or more settlements, your god may split. An offspring god is born, takes about a quarter of your settlements, and will fight you.</>,
          <><B>Fusion.</B> An offspring may fuse back into your god, returning its lands and leaving your myth stronger and stranger.</>,
        ]} />
        <P>The <B>Myth</B> screen keeps the chronicle. Its mockup button forces a change so you can see one.</P>
      </Sec>

      <Sec onSection={onSection} id="wisdom">
        <P>Each new tier, and every 400 relics you earn over the game, unseals a <B>scroll</B> of real wisdom literature and grants 10 wisdom points. Spend wisdom points on omen insight ({COSTS.hint}), riddle hints ({COSTS.hint}), or contemplation ({COSTS.contemplate} points for +1 wisdom).</P>
      </Sec>

      <Sec onSection={onSection} id="charity">
        <P>In the full game, most of what players pay goes into a shared <B>charity pool</B>. Dharma rituals, and some meditations, release money from it to the charities you choose. On the Charity screen you pick a plan (Free or Devotee), set how your releases are split, and see a ledger of what your rituals have given.</P>
      </Sec>

      <Sec onSection={onSection} id="tips">
        <Bullets items={[
          <>Perform rituals right away when you can; queue only what you're sure you'll finish.</>,
          <>Check the horoscope each morning and favor its order.</>,
          <>Early on, charisma wins unaligned settlements cheaply. Later, power wins wars.</>,
          <>Wall and build up your border settlements; buildings also make your faith spread.</>,
          <>A kin with mutual defense is a cheap army.</>,
          <>Watch for live challenges and omens. Both reward a quick response.</>,
          <>Use <B>Appearance</B> (in the sidebar, or ◐ on phones) to change the theme or make the text larger.</>,
        ]} />
      </Sec>

      <Sec onSection={onSection} id="mock">
        <P>This is a playable mockup. A few things are simulated:</P>
        <Bullets items={[
          <>Rival gods are played by the computer, standing in for other players.</>,
          <>GPS, the motion sensor and the microphone are replaced by on-screen stand-ins.</>,
          <>No money changes hands and the charity pool is illustrative.</>,
          <>Nothing is saved: reloading the page starts over. Only your theme and text size are remembered.</>,
        ]} />
      </Sec>
    </View>
  );
}

function Sec({ id, onSection, children }: { id: SectionId; onSection?: (id: SectionId, node: View | null) => void; children: React.ReactNode }) {
  return (
    <View ref={(node) => onSection?.(id, node)} style={{ gap: S.md, paddingTop: S.lg, borderTopWidth: 1, borderColor: C.lineSoft }}>
      <Display size={24}>{SECTIONS.find((x) => x[0] === id)![1]}</Display>
      {children}
    </View>
  );
}
function P({ children }: { children: React.ReactNode }) {
  return <Body style={{ maxWidth: fs(720) }}>{children}</Body>;
}
function B({ children }: { children: React.ReactNode }) {
  return <Text style={{ fontFamily: F.bodyBold }}>{children}</Text>;
}
function Quote({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ borderLeftWidth: 2, borderColor: C.gold, paddingLeft: S.md }}>
      <Italic size={17} color={C.text}>{children}</Italic>
    </View>
  );
}
function Bullets({ items }: { items: React.ReactNode[] }) {
  return (
    <View style={{ gap: S.sm, maxWidth: fs(720) }}>
      {items.map((it, i) => (
        <Row key={i} gap={S.sm} style={{ alignItems: 'flex-start' }}>
          <Text style={{ color: C.gold, fontSize: fs(15), lineHeight: fs(22) }}>◆</Text>
          <Body style={{ flex: 1 }}>{it}</Body>
        </Row>
      ))}
    </View>
  );
}
function Table({ head, rows, flex = head.length === 2 ? [1, 3] : [1.1, 1, 2.6] }: { head: string[]; rows: React.ReactNode[][]; flex?: number[] }) {
  const { width } = useWindowDimensions();
  const cellOf = (cell: React.ReactNode, ci: number) =>
    typeof cell === 'string'
      ? ci === 0 ? <Body size={14} style={{ fontFamily: F.bodyBold }}>{cell}</Body> : ci === 1 && head.length === 3 && cell.length <= 24 ? <Mono size={12} color={C.muted}>{cell}</Mono> : <Body size={14} color={C.muted}>{cell}</Body>
      : cell;
  // Too narrow for columns: stack each row so long words never split mid-word.
  if (width < 640) {
    return (
      <View style={{ borderWidth: 1, borderColor: C.line, borderRadius: 4, overflow: 'hidden' }}>
        {rows.map((r, ri) => (
          <View key={ri} style={{ paddingHorizontal: S.md, paddingVertical: S.sm, gap: 4, borderTopWidth: ri ? 1 : 0, borderColor: C.lineSoft }}>
            <Row gap={S.md} wrap style={{ alignItems: 'baseline', rowGap: 4 }}>
              {cellOf(r[0], 0)}
              {r.length === 3 && r[1] !== '' && cellOf(r[1], 1)}
            </Row>
            {r.slice(r.length === 3 ? 2 : 1).map((cell, ci) => <View key={ci}>{cellOf(cell, ci + (r.length === 3 ? 2 : 1))}</View>)}
          </View>
        ))}
      </View>
    );
  }
  return (
    <View style={{ borderWidth: 1, borderColor: C.line, borderRadius: 4, overflow: 'hidden' }}>
      <View style={{ flexDirection: 'row', backgroundColor: C.raised, paddingHorizontal: S.md, paddingVertical: S.sm, gap: S.md }}>
        {head.map((h, i) => <View key={i} style={{ flex: flex[i] }}><Label>{h}</Label></View>)}
      </View>
      {rows.map((r, ri) => (
        <View key={ri} style={{ flexDirection: 'row', paddingHorizontal: S.md, paddingVertical: S.sm, gap: S.md, borderTopWidth: 1, borderColor: C.lineSoft }}>
          {r.map((cell, ci) => (
            <View key={ci} style={{ flex: flex[ci], minWidth: 0 }}>
              {cellOf(cell, ci)}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}
