# 🌍 Grounded / RaceQuest

> **"If it's Grounded, you were really there."**

A Bitcoin-native, location-based team challenge platform that makes physical presence verifiable, transferable, and economically meaningful.

## 🎯 What is Grounded?

**Grounded** is the umbrella brand for verifiable real-world interaction systems.  
**RaceQuest** is the consumer mobile app for team challenges and races.  
**IWasHere** is the proof moment when geofencing + NFC confirms your presence.

## ⚡ Key Features

- **Bitcoin-native**: Lightning payments, peer-to-peer zaps, RGB rights layer
- **Anti-spoofing**: Geofencing + NFC required for all scoring
- **Offline-first**: Works on mountains, in forests, with poor connectivity
- **Open stack**: Leaflet + OpenStreetMap, no proprietary APIs
- **Client-side validation**: Users can prove achievements locally

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Mobile**: Capacitor (Android & iOS)
- **Maps**: Leaflet + OpenStreetMap + Overpass API
- **Identity**: Nostr events and relays
- **Payments**: Bitcoin Lightning Network
- **Rights**: RGB for coupons, contracts, and scarcity
- **Styling**: Tailwind CSS

### Core Components
- **Route Creation**: Manual drawing + auto-placement on OSM paths
- **Checkpoints**: Geofence + NFC + questions + sponsor rewards
- **Teams & Races**: Collaborative and competitive modes
- **Sponsor Dashboard**: Merchant coupon management
- **Rights Layer**: Transferable coupons with hard scarcity

## 📋 Project Documentation

### 🚀 Getting Started
- **[Bootstrap Prompt](OPENHANDS_BOOTSTRAP_PROMPT.md)** - Complete setup instructions for OpenHands
- **[Vision Document](VISION_DOCUMENT_ENGLISH.md)** - Full project vision and principles

### 🔧 Technical Specifications
- **[Nostr Schema](NOSTR_SCHEMA_COMPLETE.md)** - Complete event types, tags, and relay strategy
- **[RGB Rights Layer](RGB_RIGHTS_LAYER.md)** - Asset schemas, transfers, and validation

## 🎮 Use Cases

### Winter Sports Pilot (MVP)
- 3 teams × 2 players
- ~50 auto-placed checkpoints on ski pistes
- TeamTour + Race Window competition
- NFC activation required for scoring
- Lightning route purchases + peer-to-peer zaps

### Future Applications
- City treasure hunts
- Educational tours
- Running/cycling challenges
- Corporate team building
- Tourism gamification

## 🏪 Business Model

### For Route Creators
- Sell access to premium routes
- Earn from sponsor partnerships
- Revenue sharing with platform

### For Sponsors/Merchants
- Verifiable foot traffic
- Time-bound, location-specific promotions
- Transferable coupons with hard inventory limits
- Detailed analytics and fraud prevention

### For Players
- Earn sats through achievements
- Transfer/trade coupons with teammates
- Prove accomplishments cryptographically

## 🛡️ Anti-Fraud Design

- **Geofencing + NFC**: Dual proof required for activation
- **RGB scarcity**: Coupons have hard limits, no double-spending
- **Client-side validation**: Users can verify without trusting servers
- **Merchant verification**: Cryptographic proof of redemption rights

## 🌐 Open Source & Standards

- **License**: MIT (maximum freedom)
- **Maps**: OpenStreetMap (no vendor lock-in)
- **Protocols**: Nostr (decentralized), Bitcoin (permissionless)
- **No dependencies**: Google Maps, Mapbox, or proprietary APIs

## 🚀 Development Status

**Current Phase**: Documentation & Architecture  
**Next Phase**: Bootstrap implementation with OpenHands  
**Target**: Winter sports pilot with 3 teams

## 🤝 Contributing

This project is designed to be built collaboratively with AI assistance. The bootstrap prompt provides complete setup instructions for getting started.

## 📞 Contact

Built with ❤️ for the Bitcoin and Nostr communities.

---

*Grounded makes physical presence verifiable, scarce, and economically fair — with Bitcoin as its foundation.*