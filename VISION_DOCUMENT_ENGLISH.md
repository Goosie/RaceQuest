# 🌍 Grounded — Vision Document (English)

## 1. Executive Summary

Grounded is an open, Bitcoin-native platform for verifiable real-world interaction. It enables routes, team challenges, races, and rewards that only work if participants are physically present. By combining geofencing, NFC, Bitcoin Lightning, Nostr, and RGB, Grounded turns real-world activity into verifiable, transferable, and fraud-resistant value — without proprietary maps, licenses, or centralized game servers.

## 2. The Problem

Today, several systems exist in isolation:

**Digital games & apps**  
Fun, but detached from physical reality.

**Local business promotions**  
Coupons are easy to fake, hard to measure, and not auditable.

**Bitcoin & crypto systems**  
Powerful, but rarely connected to real physical action.

Additionally:
- GPS spoofing undermines check-ins
- Proprietary map APIs create cost and lock-in
- Scores, rewards, and ownership usually depend on a central authority

Grounded connects these worlds and makes physical presence provable, scarce, and economically meaningful.

## 3. Core Vision

> **Real presence deserves real value.**

In Grounded:
- Routes are purchased using Bitcoin Lightning
- Physical presence is proven using geofencing + NFC
- Rewards are time-, location-, and action-bound
- Achievements are client-side verifiable
- Sponsor agreements and coupons are enforced using RGB contracts

## 4. Non-Negotiable Principles

### 1. You must be there
No presence = no score = no reward.

### 2. Bitcoin-native
- Lightning for payments and zaps
- RGB for rights, scarcity, and contracts
- No fiat dependency

### 3. Open stack only
- Leaflet + OpenStreetMap
- Overpass API
- Nostr for identity and events
- No Google Maps, no Mapbox, no licensed APIs

### 4. Client-side validation
Users must be able to prove locally:
- where they were
- what they activated
- what they earned

No central authority required.

### 5. Offline-first
Must work on mountains, in forests, and in cities with poor connectivity.

## 5. Brand Architecture

### 🌐 Grounded — Umbrella Brand
The quality seal:
> *"If it's Grounded, you were really there."*

### 🎮 RaceQuest — Consumer App
The app players use to:
- buy routes
- form teams
- compete in races
- earn rewards

### 📍 IWasHere — Proof Moment
The verification experience:
- NFC tap
- geofence confirmation
- score & reward activation

## 6. Bitcoin & Lightning in Grounded

### A. Route access
- Routes can be free or paid
- Paid access uses Lightning
- Payment grants access rights
- Revenue can be split between:
  - route creators
  - sponsors
  - platform

### B. Zaps between players
- Players can send zaps to:
  - teammates
  - competitors
- Zaps are optional, peer-to-peer, and non-custodial
- No artificial point systems — sats are real

### C. Micro-incentives
- Bonus sats for:
  - fastest team
  - full completion
  - sponsor-specific challenges

## 7. RGB: Rights, Scarcity, and Contracts

### A. Coupon inventory (hard scarcity)
- Each coupon is an RGB unit
- Total supply is fixed
- Redeeming a coupon consumes one unit
- Double spending is impossible

### B. Transferable coupons
- Coupons can be transferred between players
- Useful for group purchases (e.g. coffee, food)
- Ownership is cryptographically verifiable

### C. Sponsor contracts
- Sponsor agreements are represented as RGB contracts
- Contracts define:
  - inventory limits
  - validity periods
  - revenue splits
- Auditable without trusting a central party

### D. Client-side proof
Players can locally demonstrate:
- which checkpoints were activated
- when they were activated
- which rights they own or consumed

## 8. Routes & Checkpoints

### Routes
- Manually drawn
- Or automatically generated:
  - along walking paths
  - along city streets
  - on ski pistes using OSM + Overpass

### Checkpoints
Each checkpoint supports modular actions:
- geofence
- NFC activation
- question or task
- sponsor reward

**Lifecycle**  
`locked → seen → active (NFC) → redeemed | expired`

Only active checkpoints count.

## 9. Teams & Race Windows

### TeamTour (co-op)
- Teams collaborate
- A checkpoint counts when any member activates it

### Race Window (competition)
- Defined start and end time
- Ranking rules:
  - number of unique checkpoints
  - tie-breaker: elapsed time

Leaderboards are deterministic and computed from events — no realtime server.

## 10. Sponsors & Merchants

### Grounded for Partners
Each sponsor gets:
- **dashboard showing:**
  - coupons issued, activated, redeemed
  - remaining inventory
  - validity periods
- **ability to:**
  - pause offers
  - top up inventory (Lightning)
  - verify redeems

### Coupon flow
1. Player reaches checkpoint
2. NFC tap → coupon becomes active
3. Countdown visible (e.g. 60 minutes)
4. Redeem via QR or NFC at merchant

Live status updates are reflected in the app.

## 11. Technology Overview

### Geo
- Leaflet
- OpenStreetMap
- Overpass API
- OSRM (self-hosted later)

### App
- React + TypeScript
- Capacitor (Android & iOS)
- Background geofencing
- NFC
- Offline caching

### Protocols
- **Nostr** — events, identity, proofs
- **Bitcoin Lightning** — payments, zaps
- **RGB** — rights, contracts, scarcity

## 12. MVP: Winter Sports Pilot

- 3 teams × 2 players
- One RaceQuest route
- ~50 checkpoints on ski pistes
- TeamTour + Race Window
- Route purchased via Lightning
- NFC activation
- Simple sponsor reward

**Success means:**
- works offline
- no spoofing
- fair competition
- sats flow

## 13. What Grounded Is Not

- Not a Web2 check-in app
- Not an NFT marketing gimmick
- Not a closed ecosystem
- Not dependent on big-tech maps

## 14. Long-Term Vision

Grounded becomes an open physical interaction layer for Bitcoin:
- sports & events
- education & city games
- local economies
- verifiable achievements
- trust-minimized contracts

## Final Statement

> **Grounded makes physical presence verifiable, scarce, and economically fair — with Bitcoin as its foundation.**

---

*This document serves as the authoritative vision for all Grounded development, partnerships, and strategic decisions.*