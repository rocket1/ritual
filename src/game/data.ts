import type { Attrs, RitualKind, Sign, Tier, Kinship } from './types';

export interface Prototype {
  id: string;
  archetype: string; // the tradition it is loosely inspired by
  name: string; // default name, editable at creation
  epithet: string;
  glyph: string;
  color: string;
  attrs: Attrs;
  benevolence: number;
  profile: string;
}

// Ten starting points. Names are original; archetypes nod to the traditions
// listed in the design doc. Base attributes sum to 80; the 1000 starting
// relics buy 100 more points at creation.
export const PROTOTYPES: Prototype[] = [
  { id: 'warrior', archetype: 'Native American warrior princess', name: 'The Storm Daughter', epithet: 'She Who Rides the Thunderhead', glyph: '➹', color: '#C9704A', attrs: { wisdom: 15, power: 30, charisma: 20, evidence: 15 }, benevolence: 30, profile: 'A huntress of the high plains whose arrows are lightning. She honors courage and the long walk home.' },
  { id: 'maize', archetype: 'Mayan', name: 'The Jade Maize Lord', epithet: 'Keeper of the Long Count', glyph: '✣', color: '#5FA36A', attrs: { wisdom: 25, power: 15, charisma: 15, evidence: 25 }, benevolence: 20, profile: 'He dies with every harvest and rises with every planting. He counts days the way others count coins.' },
  { id: 'kami', archetype: 'Japanese Shinto', name: 'The Mountain Kami', epithet: 'Spirit of the Cedar Slope', glyph: '△', color: '#8BB3C9', attrs: { wisdom: 20, power: 15, charisma: 20, evidence: 25 }, benevolence: 50, profile: 'Present in the stone, the waterfall and the swept threshold. Purity before petition.' },
  { id: 'awakened', archetype: 'Buddha', name: 'The Awakened One', epithet: 'Who Sat Until the Morning Star', glyph: '☸', color: '#E0B252', attrs: { wisdom: 35, power: 5, charisma: 25, evidence: 15 }, benevolence: 80, profile: 'Asks for nothing but attention. Followers gather slowly and leave rarely.' },
  { id: 'dancer', archetype: 'Shiva', name: 'The Cosmic Dancer', epithet: 'Who Ends Worlds in Rhythm', glyph: '✺', color: '#7C6BD0', attrs: { wisdom: 25, power: 30, charisma: 15, evidence: 10 }, benevolence: 0, profile: 'Destruction as renewal. The drum in one hand, the flame in another.' },
  { id: 'river', archetype: 'African (Yoruba orisha)', name: 'The River Mother', epithet: 'Sweet Water, Bright Brass', glyph: '≋', color: '#3FA3A0', attrs: { wisdom: 15, power: 15, charisma: 35, evidence: 15 }, benevolence: 60, profile: 'Healer, lover, keeper of fresh water. Generous to the faithful, fierce to the faithless.' },
  { id: 'wanderer', archetype: 'Norse', name: 'The One-Eyed Wanderer', epithet: 'Who Hung Nine Nights', glyph: 'ᛟ', color: '#8F9AA8', attrs: { wisdom: 35, power: 20, charisma: 10, evidence: 15 }, benevolence: -10, profile: 'Traded an eye for knowledge. Rewards the curious and the cunning.' },
  { id: 'sundisk', archetype: 'Egyptian', name: 'The Sun Disk', epithet: 'Who Crosses the Sky in a Boat', glyph: '☥', color: '#E3963E', attrs: { wisdom: 20, power: 25, charisma: 20, evidence: 15 }, benevolence: 25, profile: 'Every dawn is a victory over the serpent of night. Order, light, and rigid ceremony.' },
  { id: 'thunder', archetype: 'Greek Olympian', name: 'The Thunder Throne', epithet: 'Cloud-Gatherer', glyph: 'ϟ', color: '#C24E5C', attrs: { wisdom: 10, power: 35, charisma: 25, evidence: 10 }, benevolence: -20, profile: 'Mighty, jealous and easily flattered. Temples rise quickly in his name.' },
  { id: 'green', archetype: 'Celtic earth mother', name: 'The Green Mother', epithet: 'Of the Oak and the Well', glyph: '❦', color: '#7FA650', attrs: { wisdom: 20, power: 10, charisma: 25, evidence: 25 }, benevolence: 70, profile: 'Every grove is her chapel. She remembers each tree planted in her name.' },
];

export const SIGNS: Sign[] = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

export const GOD_COLORS = ['#D8A94F', '#C9704A', '#5FA36A', '#8BB3C9', '#7C6BD0', '#3FA3A0', '#E3963E', '#C24E5C', '#B07AA1', '#7FA650'];

export const TIERS: Tier[] = [
  { name: 'Prophet', minTiles: 0, blurb: 'Just you, speaking to anyone who will listen.' },
  { name: 'Cult', minTiles: 3, blurb: 'A small circle that meets in back rooms.' },
  { name: 'Religion', minTiles: 10, blurb: 'Congregations in many towns. Your rites have names.' },
  { name: 'Nation', minTiles: 24, blurb: 'Your faith is law within your borders.' },
  { name: 'Truth', minTiles: -1, blurb: 'Your god is real. The planet is yours. Look to the next.' },
];
export const TRUTH_SHARE = 0.55; // share of land tiles needed for Truth

export const KIND_INFO: Record<RitualKind, { label: string; weight: number; base: [number, number]; blurb: string }> = {
  sacrifice: { label: 'Sacrifice', weight: 40, base: [20, 40], blurb: 'Give up time and comfort where you stand.' },
  meditation: { label: 'Meditation', weight: 26, base: [50, 80], blurb: 'Go somewhere specific and be still.' },
  jnana: { label: 'Jnana', weight: 17, base: [100, 150], blurb: 'Seek knowledge. Engage your surroundings.' },
  dharma: { label: 'Dharma', weight: 10, base: [200, 300], blurb: 'Do your duty among other people.' },
  honor: { label: 'Honor', weight: 7, base: [110, 160], blurb: 'Do something honorable. Tell it truly.' },
};
export const KIND_ORDER: RitualKind[] = ['sacrifice', 'meditation', 'jnana', 'dharma', 'honor'];

export const STILL_PLACES = [
  'the old oak in the nearest park',
  'the footbridge over the creek',
  'the fountain in the town square',
  'the top of the tallest hill nearby',
  'the steps of the public library',
  'the edge of the community garden',
];
export const KNOWLEDGE_PLACES = ['the art museum', 'the public library', 'the natural history museum', 'the historical society', 'the botanical garden'];
export const DUTY_PLACES = ['the homeless shelter', 'the food bank', 'the animal shelter', 'the senior center', 'the community kitchen'];

export const HONOR_PROMPTS = [
  'Compliment a stranger on their outfit, sincerely.',
  'Thank a worker by name and tell them what they did well.',
  'Let someone go ahead of you in line.',
  'Call someone you have not spoken to in a year.',
  'Pick up litter on a street that is not yours.',
  'Admit a mistake to someone before they discover it.',
];

export const RIDDLES = [
  { q: 'What has keys but can open no locks?', a: ['piano', 'a piano', 'keyboard'], hint: 'It makes music.' },
  { q: 'The more you take, the more you leave behind. What am I?', a: ['footsteps', 'steps', 'footprints'], hint: 'Walk and look back.' },
  { q: 'What has to be broken before you can use it?', a: ['egg', 'an egg'], hint: 'Breakfast.' },
  { q: 'I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?', a: ['echo', 'an echo'], hint: 'Shout into a canyon.' },
  { q: 'What gets wetter the more it dries?', a: ['towel', 'a towel'], hint: 'Found after a bath.' },
  { q: 'What can travel around the world while staying in a corner?', a: ['stamp', 'a stamp', 'postage stamp'], hint: 'On an envelope.' },
  { q: 'What has a head and a tail but no body?', a: ['coin', 'a coin'], hint: 'Flip it.' },
  { q: 'What runs but never walks, has a mouth but never talks?', a: ['river', 'a river'], hint: 'It has a bed but never sleeps.' },
  { q: 'What belongs to you, but others use it more than you do?', a: ['name', 'your name', 'my name'], hint: 'They call you by it.' },
  { q: 'The person who makes it sells it. The person who buys it never uses it. The person who uses it never knows. What is it?', a: ['coffin', 'a coffin', 'casket'], hint: 'A final purchase.' },
  { q: 'What month of the year has 28 days?', a: ['all', 'all of them', 'every month', 'all months'], hint: 'Think again about the question.' },
  { q: 'Feed me and I live. Give me a drink and I die. What am I?', a: ['fire', 'a fire', 'flame'], hint: 'It crackles.' },
];

export const PLACARDS = [
  { text: 'Katsushika Hokusai published "The Great Wave off Kanagawa" around 1831 as part of the series Thirty-six Views of Mount Fuji. The mountain appears small, framed by the curling wave.', q: 'Which mountain gives the series its name?', choices: ['Mount Fuji', 'Mount Kailash', 'Mount Olympus'], a: 0 },
  { text: 'The Rosetta Stone, found in 1799, carries the same decree in three scripts: hieroglyphic, Demotic, and ancient Greek. Comparing them let scholars decipher hieroglyphs.', q: 'How many scripts are carved on the stone?', choices: ['Two', 'Three', 'Five'], a: 1 },
  { text: 'The Library of Alexandria was founded under the Ptolemies in the 3rd century BCE. Ships docking in the harbor were searched for books, which were copied for the collection.', q: 'What happened to books found on ships?', choices: ['They were burned', 'They were copied', 'They were taxed'], a: 1 },
  { text: 'Ginkgo biloba is a living fossil. Its lineage dates back over 200 million years, and six ginkgo trees survived the Hiroshima bombing within two kilometers of the blast.', q: 'Why is the ginkgo called a living fossil?', choices: ['It grows on rocks', 'Its lineage is extremely old', 'It petrifies when cut'], a: 1 },
  { text: 'The Antikythera mechanism, recovered from a shipwreck in 1901, is a Greek geared device from around 100 BCE used to predict eclipses and the positions of the planets.', q: 'What did the mechanism predict?', choices: ['Tides and storms', 'Eclipses and planetary positions', 'Harvest yields'], a: 1 },
  { text: 'Vincent van Gogh painted "The Starry Night" in 1889 from his room at the asylum in Saint-Rémy. The village in the painting was added from imagination.', q: 'Where was van Gogh living when he painted it?', choices: ['Paris', 'An asylum in Saint-Rémy', 'Amsterdam'], a: 1 },
  { text: 'The Codex Gigas, the "Devil\'s Bible," is the largest surviving medieval manuscript. It is said to have been written by a single monk, and it takes two people to lift it.', q: 'How many people does it take to lift?', choices: ['One', 'Two', 'Six'], a: 1 },
  { text: 'Roman religion centered on orthopraxy, correct practice. A rite performed with a single misspoken word could be repeated from the start to keep the peace of the gods, the pax deorum.', q: 'What did Roman religion emphasize?', choices: ['Correct belief', 'Correct practice', 'Private prayer'], a: 1 },
];

export const HYMNS = [
  'Sun on the stone and salt on the sea, I keep your rite and the rite keeps me',
  'Nine nights hanging, nine runes won, wisdom is bought and never begun',
  'Water remembers what the river forgets, bright brass and honey and no regrets',
  'Thunder to cloud and cloud to rain, every temple rises again',
  'Drum and fire and the turning dance, nothing is lost and nothing is chance',
  'Oak and well and the long green hill, the root is patient, the root is still',
];

export const OMENS = [
  { text: 'A crow lands three times on your windowsill, each time facing west.', options: [{ label: 'Walk west and speak to the first person you meet', correct: true }, { label: 'Close the shutters and wait out the day', correct: false }, { label: 'Offer it bread and ask its name', correct: false }], hint: 'Crows carry messages. Three is an invitation, not a warning.' },
  { text: 'Your candle gutters, then burns twice as tall.', options: [{ label: 'Your god is restless; perform a ritual now', correct: true }, { label: 'A rival is near; build walls', correct: false }, { label: 'Nothing; trim the wick', correct: false }], hint: 'Fire that leaps is hunger.' },
  { text: 'All the clocks in the house stop at 3:17.', options: [{ label: 'Time is short; queue nothing today', correct: false }, { label: 'Rest. The god asks for stillness', correct: true }, { label: 'Wind them and ignore it', correct: false }], hint: 'Stopped clocks are a request.' },
  { text: 'A stranger leaves a key on your doorstep with no note.', options: [{ label: 'Open your temple doors to outsiders', correct: true }, { label: 'Change your locks', correct: false }, { label: 'Bury the key', correct: false }], hint: 'A key is for opening.' },
  { text: 'You dream of a river flowing uphill into a city.', options: [{ label: 'Send missionaries upstream', correct: true }, { label: 'Fear a flood', correct: false }, { label: 'Fast for a day', correct: false }], hint: 'Water that climbs carries something with it.' },
  { text: 'Every bird in the square takes flight at once and circles twice.', options: [{ label: 'A schism is coming', correct: false }, { label: 'Neighbors will seek your favor', correct: true }, { label: 'Hide your relics', correct: false }], hint: 'Circling is courting.' },
  { text: 'Milk sours in the jar the moment you pour it.', options: [{ label: 'Your god is displeased by a broken promise', correct: true }, { label: 'Buy fresher milk', correct: false }, { label: 'A wedding is near', correct: false }], hint: 'Spoilage follows neglect.' },
  { text: 'A moth refuses to leave your open book.', options: [{ label: 'Seek knowledge today', correct: true }, { label: 'Burn the book', correct: false }, { label: 'Travel far away', correct: false }], hint: 'It is reading over your shoulder.' },
];

export const DISASTERS = [
  { name: 'Flood', text: 'The rivers rise against your neglect.' },
  { name: 'Locust swarm', text: 'The fields are stripped bare overnight.' },
  { name: 'Drought', text: 'The wells run dry in your villages.' },
  { name: 'Earthquake', text: 'A temple wall cracks from foundation to roof.' },
  { name: 'Eclipse panic', text: 'The sun goes dark and the faithful scatter.' },
  { name: 'Plague of frogs', text: 'Unpleasant, and an obvious sign.' },
];

export const SCROLLS = [
  { title: 'On Practice', source: 'Of the Roman rite', text: 'The Romans did not ask what you believed. They asked whether the rite had been done, and done correctly. Pietas was not a feeling but a habit, kept like a hearth.' },
  { title: 'The First Step', source: 'Tao Te Ching, ch. 64', text: 'A journey of a thousand li begins beneath one\'s feet.' },
  { title: 'The River', source: 'Heraclitus, fragment', text: 'No one steps in the same river twice, for it is not the same river and they are not the same person.' },
  { title: 'On Being Good', source: 'Marcus Aurelius, Meditations X.16', text: 'Waste no more time arguing about what a good man should be. Be one.' },
  { title: 'On Action', source: 'Bhagavad Gita 2.47', text: 'You have a right to your actions, but never to the fruits of your actions. Act without attachment.' },
  { title: 'The Eternal Rule', source: 'Dhammapada 5', text: 'Hatred is never appeased by hatred in this world. By non-hatred alone is hatred appeased. This is an eternal law.' },
  { title: 'On Imagination', source: 'Seneca, Letters 13', text: 'We suffer more often in imagination than in reality.' },
  { title: 'Knowing', source: 'Tao Te Ching, ch. 33', text: 'Knowing others is intelligence. Knowing yourself is true wisdom. Mastering others is strength. Mastering yourself is true power.' },
  { title: 'Seasons', source: 'Ecclesiastes 3:1', text: 'To every thing there is a season, and a time to every purpose under the heaven.' },
  { title: 'On Good Speech', source: 'Maxims of Ptahhotep', text: 'Good speech is more hidden than greenstone, yet it is found among the women at the grindstones.' },
  { title: 'On Thought', source: 'Marcus Aurelius, Meditations V.16', text: 'The soul becomes dyed with the color of its thoughts.' },
  { title: 'On Reactions', source: 'Epictetus, Enchiridion 5', text: 'People are disturbed not by things, but by the views they take of things.' },
];

export const CHARITIES = [
  { id: 'givedirectly', name: 'GiveDirectly', cause: 'Cash transfers to families in poverty' },
  { id: 'amf', name: 'Against Malaria Foundation', cause: 'Bed nets that prevent malaria' },
  { id: 'msf', name: 'Doctors Without Borders', cause: 'Emergency medical care' },
  { id: 'feeding', name: 'Feeding America', cause: 'Food bank network' },
  { id: 'water', name: 'charity: water', cause: 'Clean water projects' },
  { id: 'local', name: 'Your local shelter', cause: 'Chosen by you' },
];

// Mock co-players behind the rival gods.
export const HANDLES = ['@marisol_k', '@thandiwe.m', '@kenji_w', '@okafor_e', '@lindqvist', '@ana.paiva', '@devraj', '@noor.h'];

export const KINSHIPS: Kinship[] = ['Brother', 'Sister', 'Father', 'Mother', 'Son', 'Daughter', 'Consort'];

export const PLANET_NAMES = ['Terra Prima', 'Vesperine', 'Okeanos IV', 'Halcyon Drift', 'Marrow', 'Seventh Lantern'];

export const ASPECTS = ['Mars trine Jupiter', 'Venus square Saturn', 'Moon conjunct Neptune', 'Mercury sextile Venus', 'Sun opposite the Moon', 'Saturn trine Uranus', 'Mercury retrograde in Virgo', 'Jupiter conjunct the Sun', 'Moon void of course', 'Venus trine Mars'];

export const READING_OPEN = [
  'The sky leans in your favor today,',
  'A slow planet turns its face toward you,',
  'Today asks more of your feet than your words,',
  'Restless energies gather at your borders,',
  'A quiet day on the surface,',
  'The stars are blunt this morning:',
];
export const READING_CLOSE = [
  'so do what you would rather postpone.',
  'so listen before you speak to rivals.',
  'and what you start before noon will hold.',
  'though luck favors the patient over the bold.',
  'and strangers will be kinder than expected.',
  'and a small debt will be repaid.',
];
