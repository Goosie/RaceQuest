# Grounded - Bitcoin-Native Location-Based Team Challenges

Grounded is an open, Bitcoin-native platform for verifiable real-world interaction. It enables routes, team challenges, races, and rewards that only work if participants are physically present.

## 🌍 Vision

**If it's Grounded, you were really there.**

Grounded makes physical presence verifiable, scarce, and economically meaningful — with Bitcoin as its foundation.

## 🏗️ Architecture

This is a monorepo containing:

- **`apps/racequest/`** - React + Capacitor mobile app for players
- **`apps/partners/`** - Web dashboard for merchants/sponsors  
- **`packages/core/`** - Shared utilities, types, and business logic
- **`packages/geo/`** - Geographic utilities, Overpass API, routing

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm 10+
- For Android builds: Android Studio + SDK

### Installation

```bash
# Clone the repository
git clone https://github.com/Goosie/RaceQuest.git
cd RaceQuest

# Install dependencies
npm install

# Build all packages
npm run build
```

### Development

#### RaceQuest Mobile App

```bash
# Start development server
cd apps/racequest
npm run dev

# Open in browser: http://localhost:12000
```

#### Partners Dashboard

```bash
# Start development server  
cd apps/partners
npm run dev

# Open in browser: http://localhost:12001
```

#### Android Development

```bash
cd apps/racequest

# Build the app
npm run build

# Sync with Android
npx cap sync android

# Open in Android Studio
npx cap open android
```

## 🎯 Core Features

### For Players (RaceQuest App)

- **Route Discovery**: Browse and purchase routes with Bitcoin Lightning
- **Team Formation**: Create teams and invite friends via QR codes
- **Real-World Proof**: Geofencing + NFC verification prevents spoofing
- **Race Windows**: Time-bounded team competitions
- **Peer-to-Peer Zaps**: Send sats to teammates and competitors
- **Offline-First**: Works in mountains, forests, poor connectivity areas

### For Merchants (Partners Dashboard)

- **Offer Management**: Create and manage coupon campaigns
- **Inventory Control**: Set limits, validity periods, redeem windows
- **Analytics**: Track claims, redeems, conversion rates
- **RGB Integration**: Hard scarcity for coupons (no double-spending)
- **Lightning Payments**: Receive payments for sponsored checkpoints

### For Route Creators

- **Route Builder**: Draw routes manually or auto-place checkpoints
- **OSM Integration**: Automatically place checkpoints on ski pistes, walking paths
- **Checkpoint Actions**: Geofence, NFC, questions, sponsor rewards
- **Revenue Sharing**: Split route sales with sponsors and platform

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Leaflet** + **OpenStreetMap** for maps (no proprietary APIs)
- **Capacitor 8** for mobile app packaging

### Protocols & APIs
- **Nostr** for events, identity, and data storage
- **Bitcoin Lightning** for payments and zaps
- **RGB** for rights, contracts, and scarcity (planned)
- **Overpass API** for geographic data queries

### Mobile Capabilities
- **Background Geolocation** (screen-off tracking)
- **NFC** for anti-spoofing verification
- **Local Notifications** for proximity alerts
- **Offline Storage** with sync when online

## 📱 Mobile Features

### Background Geofencing
The app uses Capacitor's background geolocation to track proximity to checkpoints even when the screen is off. When a player enters a checkpoint radius:

1. Local notification appears
2. App opens to reward card
3. NFC tap required to activate
4. Countdown timer for redemption

### NFC Anti-Spoofing
Each checkpoint has an NFC tag containing:
- `checkpoint_id`
- `tag_id` 
- Verification data

Players must physically tap the NFC tag to:
- Activate checkpoints for scoring
- Unlock sponsor rewards
- Prevent GPS spoofing

## 🗺️ Geographic Features

### Auto-Placement
Route creators can automatically place checkpoints:

```typescript
// Place 50 checkpoints on ski pistes
const checkpoints = await autoPlaceCheckpoints({
  area: mapBounds,
  count: 50,
  minDistance: 100, // meters
  pisteTypes: ['downhill', 'nordic']
})
```

### Routing
Integration with OSRM for path-following routes:
- Walking paths
- Cycling routes  
- Ski pistes
- City streets

## 💰 Bitcoin Integration

### Lightning Payments
- Route purchases
- Peer-to-peer zaps
- Sponsor payments
- Revenue splits

### RGB Rights Layer (Planned)
- Coupon scarcity enforcement
- Transferable rewards
- Verifiable sponsor contracts
- Client-side validation

## 🔧 Development

### Project Structure

```
grounded/
├── apps/
│   ├── racequest/          # Mobile app (React + Capacitor)
│   └── partners/           # Merchant dashboard (React)
├── packages/
│   ├── core/              # Shared utilities and types
│   └── geo/               # Geographic utilities
├── docs/                  # Documentation
└── README.md
```

### Available Scripts

```bash
# Root level
npm run build              # Build all packages
npm run dev               # Start all dev servers
npm run type-check        # Type check all packages

# RaceQuest app
npm run dev               # Development server
npm run build             # Production build
npm run preview           # Preview build
npx cap sync android      # Sync to Android
npx cap open android      # Open Android Studio

# Partners dashboard  
npm run dev               # Development server
npm run build             # Production build
```

### Environment Setup

#### Android Development
1. Install Android Studio
2. Install Android SDK (API level 33+)
3. Set up Android Virtual Device (AVD)
4. Enable USB debugging on physical device

#### Required Permissions (Android)
- `ACCESS_FINE_LOCATION` - GPS tracking
- `ACCESS_BACKGROUND_LOCATION` - Background geofencing  
- `NFC` - NFC tag reading
- `WAKE_LOCK` - Keep app active during tracking

## 🧪 Testing

### Winter Sports Pilot
The initial test scenario:
- 3 teams × 2 players
- Ski resort with ~50 auto-placed checkpoints
- TeamTour + Race Window competition
- NFC verification at each checkpoint
- Lightning route purchase
- Sponsor coupons (coffee, equipment rental)

### Test Checklist
- [ ] Works offline (poor mountain connectivity)
- [ ] No GPS spoofing possible
- [ ] Fair team competition
- [ ] Smooth Lightning payments
- [ ] Sponsor coupon redemption

## 🔒 Security & Privacy

### Anti-Spoofing Measures
1. **Geofence + NFC**: Dual verification required
2. **Merchant Validation**: Final redemption requires merchant confirmation
3. **Client-Side Proof**: Users can verify their own achievements
4. **RGB Scarcity**: Hard limits on coupon inventory (planned)

### Privacy
- Location data stays on device until explicitly shared
- Nostr events can be encrypted (NIP-44/NIP-59)
- No central authority required for verification

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Ensure all packages build successfully
5. Submit a pull request

### Code Standards
- TypeScript strict mode
- ESLint + Prettier formatting
- Conventional commit messages
- Test coverage for core utilities

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Vision Document**: [docs/VISION.md](docs/VISION.md)
- **Nostr Schema**: [docs/NOSTR_SCHEMA.md](docs/NOSTR_SCHEMA.md)
- **RGB Integration**: [docs/RGB_RIGHTS_LAYER.md](docs/RGB_RIGHTS_LAYER.md)
- **API Documentation**: [docs/API.md](docs/API.md)

## 🆘 Support

For questions, issues, or contributions:
- Open an issue on GitHub
- Join our Nostr community
- Contact: [your-contact-info]

---

**Remember: If it's Grounded, you were really there.** 🌍⚡