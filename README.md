# 82-0

Draft NHL legends across random franchises and decades, fill six positions, and chase a perfect **82-0** season.

Fan-made. Not affiliated with the NHL.

## Modes

- **Classic** — stats on, team/decade skips, local leaderboard (70+ wins)
- **Ice IQ** — blind draft
- **Salary Cap** — $88M soft cap; tier + HOF set salaries
- **One Franchise** — lock a club, spin decades only
- **Toughest Team** — penalty minutes and sandpaper drive the sim
- **Daily Challenge** — same UTC-seeded spins, no skips, global board via `/api/daily`
- **Challenge a friend** — shareable codes / `#c=` links, identical spins

## Career

Local career stats, daily streaks, and unlockable achievements live on the Career screen (this device only).

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

Vite · React · TypeScript · Vercel serverless (`api/daily.ts`) · PWA · client-only game logic
