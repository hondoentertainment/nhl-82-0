# 82-0

Draft NHL legends across random franchises and decades, fill six positions, and chase a perfect **82-0** season.

Fan-made. Not affiliated with the NHL.

**Play:** [nhl82.vercel.app](https://nhl82.vercel.app)

## Modes

- **Classic** — stats on, team/decade skips, local leaderboard (70+ wins)
- **Ice IQ** — blind draft
- **Salary Cap** — $88M soft cap; tier + HOF set salaries
- **One Franchise** — lock a club, spin decades only
- **Era Lock** — lock a decade, spin franchises only
- **Toughest Team** — penalty minutes and sandpaper drive the sim
- **Daily Challenge** — same UTC-seeded spins, no skips, verified global board via `/api/daily`
- **Challenge a friend** — shareable codes / `/c/CODE` links, rematch board via `/api/challenge-board`

## After the draft

The 82-game sim still scores wins and losses only. A short **season tape** lists headline games (shutouts, blowouts, one-goal, overtime) on the result screen and in the Career log. 44+ wins also run a Stanley Cup — Daily and Challenge still post the regular-season record.

## Career

Local career stats, daily streaks, a season log, unlockable achievements, and an optional board name live on the Career screen (this device only). Search the encyclopedia from Home to practice Ice IQ.

## Local

```bash
npm install
npm run dev
```

```bash
npm test          # Vitest unit tests
npm run test:e2e  # Playwright (builds + preview)
npm run test:all  # unit + e2e
```

## Global daily board

Uses [Vercel Blob](https://vercel.com/docs/storage/vercel-blob). Production needs `BLOB_READ_WRITE_TOKEN`. Without it, Daily still plays locally; the global board returns unavailable.

## Stack

Vite · React · TypeScript · Vercel serverless (`api/`) · PWA · client-only game logic
