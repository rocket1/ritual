# Ritual

*Doing, not believing.* A god game played from the follower's side: you create a god, then serve it by performing rituals.

This is a **mockup**. It's built with Expo (React Native) and runs on iOS, Android and the web from one codebase. Nothing connects to a backend. The whole game lives in memory, other players are simulated as AI rival gods, and GPS, the microphone and payments are stubbed with on-screen stand-ins.

## Run it

```bash
npm install
npm run web       # desktop browser at http://localhost:8081
npm run ios       # iOS simulator / Expo Go
npm run android   # Android emulator / Expo Go
```

If `npm install` fails with `EACCES` in `~/.npm`, your npm cache has root-owned files. Fix it with `sudo chown -R $(id -u):$(id -g) ~/.npm`.

## Build for hosting

```bash
npm run build:web
```

This writes a static site to `dist/` (about 1.6 MB). `dist/` is committed on purpose so the site can be hosted straight from the repo with no build step, so rebuild and commit it whenever the source changes. The script also adds `.nojekyll`, which GitHub Pages needs in order to serve the `_expo` folder. Upload that folder to any static host: Netlify, Vercel, Cloudflare Pages, GitHub Pages, S3 or your own server. No server code is needed. The game is a single page, so no URL rewrite rules are needed either.

The build expects to be served from the root of a domain (`https://example.com/`). To serve it from a subfolder, for example a GitHub Pages project site at `https://you.github.io/ritual/`, add `"experiments": { "baseUrl": "/ritual" }` to `app.json` and rebuild.

## What's in the mockup

| Area | What it does |
|---|---|
| **Create** | Ten starting myths (Mayan, Shinto, Buddha, Shiva, Yoruba, Norse, …). Spend 1,000 relics on Wisdom, Power, Charisma and Evidence. Set benevolence, tithe and your sign. |
| **Temple** | Your god, tier ladder (Prophet → Cult → Religion → Nation → Truth), attributes you can raise with relics, omens to interpret, live border challenges, requests for grace, the daily horoscope with its "feeling lucky" rite, and alerts. |
| **Rituals** | The five orders, each with its own mini-game: Sacrifice (GPS walk or the Sisyphean stone), Meditation (go somewhere and hold still), Jnana (museum placard quiz or riddle), Dharma (ten minutes of presence, which releases charity money) and Honor (a story rated by a random pilgrim). Perform now for full relics, or queue at 75%. A broken queued promise brings a natural disaster. Also covers rites of neighboring gods, custom and trainer-assigned rituals, and a mock solver API for programmable rituals. |
| **Map** | Hex "cells" on a fictional planet. Borders shift every hour based on each god's attributes plus chance. Build walls and churches, temples and cathedrals; send missionaries; recruit an army and crusade. At Truth your god becomes real and travels to a new planet. |
| **Pantheon** | Rival gods with player handles. Make offerings, then propose kinship (Brother, Mother, Consort…) with negotiable terms: tithe share, non-aggression, mutual defense. Rivals accept, counter or refuse. |
| **Myth** | A chronicle of the myth changing on its own: daily drift, turning wrathful, new epithets, schisms that spawn an offspring sect, and fusions. |
| **Wisdom** | Scrolls of real wisdom literature, unsealed by tiers and relic milestones. They grant wisdom points. |
| **Charity** | Free or Devotee plan, the shared pool, how your releases are split, and a ledger. |

The world clock runs at one game hour every 4 seconds. Use **×4** to speed it up, **Pass 8 h** to skip ahead, and the pause button to stop it. The clock holds still while a ritual is open.

## Code map

- `src/game/types.ts`: the game state model
- `src/game/data.ts`: content (prototypes, riddles, placards, omens, scrolls, charities)
- `src/game/engine.ts`: all the rules: map generation, battles, rituals, omens, myth changes, horoscope, diplomacy
- `src/game/store.ts`: a tiny in-memory store (swap it for a real backend later)
- `src/rituals/`: the ritual mini-games and the ritual player modal
- `src/screens/`: one file per tab; `src/Shell.tsx` handles navigation (a sidebar on desktop, bottom tabs on phones)
