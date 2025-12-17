# OpenHands Bootstrap Prompt — Grounded/RaceQuest (Complete Setup)

You are building **Grounded/RaceQuest**, a Bitcoin-native, location-based team challenge platform from scratch.

**IMPORTANT**: Do not use or copy code from gitlab.com/chad.curtis/treasures (AGPL license). Build everything from a clean new codebase. Reuse only general concepts.

## Project Overview

**Grounded** = umbrella brand and quality label ("If it's Grounded, you were really there")
**RaceQuest** = consumer mobile app for players
**IWasHere** = proof moment (geofence + NFC verification)

## Non-Negotiable Principles

1. **You must be there** — no physical presence = no score = no reward
2. **Bitcoin-native** — Lightning for payments/zaps, RGB for rights/scarcity
3. **Open stack only** — Leaflet + OpenStreetMap, no proprietary APIs
4. **Client-side validation** — users can prove achievements locally
5. **Offline-first** — must work on mountains, in forests, with poor connectivity

## Fixed Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Mobile**: Capacitor (Android first, iOS compatible)
- **Maps**: Leaflet + OpenStreetMap tiles + Overpass API
- **Identity & Events**: Nostr (with NIP-44/59 encryption)
- **Payments**: Bitcoin Lightning + zaps
- **Rights Layer**: RGB (coupons, contracts, scarcity)
- **Styling**: Tailwind CSS
- **State**: Zustand or React Context

## Repository Structure to Create

```
grounded/
├── README.md
├── LICENSE (MIT)
├── package.json (workspace root)
├── apps/
│   ├── racequest/              # Main mobile app
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── capacitor.config.ts
│   │   ├── src/
│   │   ├── android/
│   │   └── ios/ (placeholder)
│   └── partners/               # Merchant dashboard (web)
│       ├── package.json
│       ├── vite.config.ts
│       └── src/
├── packages/
│   ├── grounded-core/          # Shared utilities
│   ├── grounded-nostr/         # Nostr event handling
│   ├── grounded-rgb/           # RGB rights interfaces
│   └── grounded-geo/           # Map, routing, sampling
└── docs/
    ├── vision.md
    ├── nostr-schema.md
    ├── rgb-rights-layer.md
    └── architecture.md
```

## Core Features to Implement (Phase 1)

### 1. Route Creation & Auto-Placement
- **Freehand mode**: Draw/edit polylines on map
- **Auto-placement wizard**:
  - Input: number of checkpoints (e.g. 50), min distance (e.g. 100m), radius (e.g. 30m)
  - Area: current map viewport (bounding box)
  - Fetch OSM paths via Overpass API (pistes, footways, tracks)
  - Sample points along OSM ways with minimum distance enforcement
  - Create draft checkpoints with drag/drop editing
  - Publish converts drafts to Nostr events

### 2. Checkpoints (Extensible Actions)
```typescript
interface Checkpoint {
  id: string;
  lat: number;
  lng: number;
  radius_m: number;
  actions: Array<{
    type: 'geofence' | 'nfc' | 'question' | 'reward';
    tag_id?: string;
    prompt?: string;
    choices?: string[];
    offer_id?: string;
  }>;
}
```

**Lifecycle (strictly enforced)**:
`locked → seen → active (NFC) → redeemed | expired`

Only `active` state counts for scoring.

### 3. IWasHere (Proof System)
- **Background geofencing** using Capacitor plugins
- **Local notifications** when entering checkpoint radius
- **NFC activation** required to transition `seen → active`
- **Anti-spoofing**: geofence + NFC combination required
- **Offline queue**: store proofs locally, sync when online

### 4. TeamTour + Race Window
- **TeamTour (co-op)**: teams collaborate, any member can activate checkpoints
- **Race Window (competition)**: time-bounded challenges
- **Scoring**: 
  - Score = unique checkpoints activated by team
  - Tie-break = elapsed time (first activation → last activation)
- **Leaderboard**: deterministic, computed client-side from Nostr events
- **No realtime server**: polling-based updates only

### 5. Bitcoin & Lightning Integration
- **Route access**: routes can be free or paid via Lightning
- **Zaps**: peer-to-peer sats between players (optional, social)
- **Micro-incentives**: bonus sats for achievements
- Use LNURL/Lightning-native flows where possible

### 6. RGB Rights Layer (Interfaces + Stubs)
**Phase 1**: Define interfaces, implement stubs
**Phase 2**: Full RGB implementation

**Assets to define**:
1. `COUPON:<merchant>:<offer>` (fungible units)
2. `PASS:<route>:<challenge>` (access rights)
3. `CONTRACT:<merchant>:<route>` (sponsor agreements)

**Key flows**:
- Coupon transfer between players
- Merchant redemption (consume units)
- Inventory hard limits (no double-spend)

### 7. Sponsor Dashboard (Grounded for Partners)
- **Web interface** for merchants
- **Features**:
  - Create offers with inventory limits
  - Set validity periods and redeem windows
  - Pause/resume offers
  - View analytics (issued/activated/redeemed)
  - QR/NFC redemption interface

### 8. Offline Support
- **Cache**: routes, checkpoints, team state
- **Queue**: proof events, team joins, activations
- **Sync**: when connectivity returns
- **Status indicators**: queued/sent/confirmed/failed

## Nostr Event Schema (Key Events)

### Route Definition (Addressable)
```
kind: 30880
d-tag: "route:<routeId>"
content: {
  "schema": "grounded.route.v1",
  "name": "Route Name",
  "mode": "ski|walk|run",
  "polyline_geojson": {...},
  "distance_m": 8200,
  "checkpoint_set_a": "30881:<pubkey>:route:<id>:checkpoints"
}
```

### Checkpoint Set (Addressable)
```
kind: 30881
d-tag: "route:<routeId>:checkpoints"
content: {
  "schema": "grounded.checkpoints.v1",
  "checkpoints": [...]
}
```

### Challenge/Race Window (Addressable)
```
kind: 30882
d-tag: "challenge:<id>"
content: {
  "schema": "grounded.challenge.v1",
  "route_a": "30880:...",
  "start": 1767181200,
  "end": 1767206400,
  "scoring": {"unique_checkpoints": true, "tiebreak": "elapsed"}
}
```

### Team Definition (Addressable)
```
kind: 30883
d-tag: "team:<challengeId>:<teamId>"
content: {
  "schema": "grounded.team.v1",
  "challenge_a": "30882:...",
  "team_id": "team-red",
  "name": "Red Rockets",
  "captain": "<pubkey>"
}
```

### Proof Event (Regular)
```
kind: 20880
tags: [
  ["a", "30882:<pubkey>:challenge:<id>"],
  ["a", "30883:<pubkey>:team:<challengeId>:<teamId>"],
  ["checkpoint", "cp001"],
  ["method", "geofence"],
  ["method", "nfc"]
]
content: {
  "schema": "grounded.proof.v1",
  "state": "seen|active|redeemed",
  "ts": 1767185552,
  "nfc": {"tag_id": "04a224...", "nonce": "..."}
}
```

## Capacitor Plugins Required

```bash
npm install @capacitor/geolocation
npm install @capacitor/local-notifications
npm install @capacitor/background-mode
npm install capacitor-nfc
npm install @capacitor-community/background-geolocation
```

## Development Workflow

### Phase 1: Bootstrap (This Task)
1. Create monorepo structure
2. Set up React + Vite + Capacitor for RaceQuest app
3. Add Leaflet map with basic route drawing
4. Implement Nostr event builders and basic relay connection
5. Create sponsor dashboard skeleton
6. Add Capacitor Android platform
7. Basic geofencing proof-of-concept

### Phase 2: Core Features
1. Auto-placement wizard with Overpass API
2. Full checkpoint lifecycle implementation
3. Team creation and joining
4. Background geofencing + NFC integration
5. Lightning payment integration
6. Offline queue and sync

### Phase 3: Rights Layer
1. RGB interface implementation
2. Coupon transfer UI
3. Merchant redemption flow
4. Contract verification

## Deliverables for This Bootstrap Task

1. **Working monorepo** with all packages and apps
2. **RaceQuest app** with:
   - React + Vite + TypeScript setup
   - Capacitor configured for Android
   - Leaflet map displaying OpenStreetMap
   - Basic route drawing functionality
   - Nostr connection and event publishing
3. **Partners dashboard** with basic UI
4. **Documentation** in `/docs/` folder
5. **README** with setup instructions
6. **Working Android build** (`npx cap run android`)

## Explicit Exclusions (Do NOT Build)

- No Google Maps or Mapbox
- No centralized game server
- No NFT marketing features
- No Web2 authentication systems
- No proprietary map APIs

## Success Criteria

- `npm install` works in root and all packages
- `npm run dev` starts RaceQuest app on localhost
- `npx cap run android` builds and runs on Android
- Map displays with OpenStreetMap tiles
- Basic route can be drawn and saved as Nostr event
- All TypeScript compiles without errors
- Clear architecture for adding RGB and Lightning later

## Pre-Implementation Requirements

Before writing any code:

1. **Analyze current workspace** and confirm clean slate
2. **Propose exact package.json dependencies** for each package
3. **Confirm Capacitor plugin compatibility** with latest versions
4. **Present step-by-step implementation plan** with checkpoints

Only start coding after this analysis is complete.

## Project Mantra

**"If it's Grounded, you were really there."**

---

## License

Use MIT License for maximum freedom and commercial compatibility.

## Git Strategy

- Initialize with clean git history
- Use conventional commits
- Create `.gitignore` for Node.js, Capacitor, and IDE files
- Do not commit `node_modules/`, `dist/`, `android/app/build/`