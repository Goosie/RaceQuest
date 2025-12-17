# Development Guide

This guide covers the development workflow, architecture decisions, and implementation details for the Grounded/RaceQuest project.

## 🏗️ Project Architecture

### Monorepo Structure

```
grounded/
├── apps/
│   ├── racequest/          # Mobile app (React + Capacitor)
│   │   ├── src/
│   │   │   ├── components/ # Reusable UI components
│   │   │   ├── pages/      # Route-based page components
│   │   │   ├── stores/     # Zustand state management
│   │   │   ├── types/      # TypeScript type definitions
│   │   │   └── utils/      # App-specific utilities
│   │   ├── android/        # Capacitor Android project
│   │   └── capacitor.config.ts
│   └── partners/           # Merchant dashboard (React)
│       ├── src/
│       │   ├── components/ # Dashboard UI components
│       │   ├── pages/      # Dashboard pages
│       │   └── types/      # Partner-specific types
│       └── vite.config.ts
├── packages/
│   ├── core/              # Shared utilities and types
│   │   ├── src/
│   │   │   ├── crypto/    # Cryptographic utilities
│   │   │   ├── distance/  # Geospatial calculations
│   │   │   ├── sampling/  # Checkpoint placement algorithms
│   │   │   ├── scoring/   # Team and race scoring logic
│   │   │   └── types/     # Shared TypeScript types
│   │   └── package.json
│   └── geo/               # Geographic utilities
│       ├── src/
│       │   ├── overpass/  # OpenStreetMap Overpass API
│       │   ├── routing/   # Route calculation
│       │   ├── tiles/     # Map tile management
│       │   └── pistes/    # Ski piste utilities
│       └── package.json
└── docs/                  # Documentation
```

### State Management

#### RaceQuest App (Zustand Stores)

1. **appStore** - Global app state, navigation, UI state
2. **nostrStore** - Nostr events, relay connections, identity
3. **geolocationStore** - GPS tracking, geofencing, NFC

#### Partners Dashboard

- React state + local storage for dashboard preferences
- API integration for merchant data (future)

### Data Flow

```
User Action → Store Update → Component Re-render
     ↓
Nostr Event → Relay Publish → Other Clients Sync
     ↓
Background Geofence → Local Notification → NFC Verification
```

## 🔧 Development Workflow

### Setting Up Development Environment

1. **Prerequisites**
   ```bash
   node --version  # Should be 18+
   npm --version   # Should be 10+
   ```

2. **Clone and Install**
   ```bash
   git clone https://github.com/Goosie/RaceQuest.git
   cd RaceQuest
   npm install
   ```

3. **Build All Packages**
   ```bash
   npm run build
   ```

4. **Start Development Servers**
   ```bash
   # Terminal 1 - RaceQuest app
   cd apps/racequest
   npm run dev

   # Terminal 2 - Partners dashboard
   cd apps/partners  
   npm run dev
   ```

### Android Development Setup

1. **Install Android Studio**
   - Download from https://developer.android.com/studio
   - Install Android SDK (API level 33+)
   - Set up Android Virtual Device (AVD)

2. **Configure Environment**
   ```bash
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
   ```

3. **Build and Run**
   ```bash
   cd apps/racequest
   npm run build
   npx cap sync android
   npx cap open android
   ```

### Code Quality

#### TypeScript Configuration

- Strict mode enabled across all packages
- Shared `tsconfig.json` in root with package-specific extensions
- Path mapping for clean imports between packages

#### Linting and Formatting

```bash
# Type checking
npm run type-check

# Linting (when configured)
npm run lint

# Formatting (when configured)
npm run format
```

#### Testing Strategy

- **Unit Tests**: Core utilities and business logic
- **Integration Tests**: Nostr event handling, geolocation
- **E2E Tests**: Critical user flows (future)

## 🗺️ Geographic Implementation

### OpenStreetMap Integration

#### Overpass API Queries

```typescript
// Example: Fetch ski pistes in bounding box
const query = `
[out:json][timeout:25];
(
  way["piste:type"~"^(downhill|nordic)$"](${south},${west},${north},${east});
  relation["route"="piste"](${south},${west},${north},${east});
);
out body geom;
`;
```

#### Checkpoint Auto-Placement Algorithm

1. **Fetch OSM Ways**: Query Overpass for paths/pistes in area
2. **Calculate Lengths**: Measure total available path length
3. **Sample Points**: Use length-weighted random sampling
4. **Enforce Constraints**: Minimum distance between checkpoints
5. **Generate Drafts**: Create editable checkpoint objects

```typescript
const checkpoints = await autoPlaceCheckpoints({
  lines: pisteLines,
  count: 50,
  minDistanceMeters: 100,
  seed: Date.now() // For reproducible "regenerate"
});
```

### Leaflet Map Configuration

```typescript
// Tile layers
const osmTiles = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const topoTiles = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';

// Map initialization
const map = L.map('map', {
  center: [46.8182, 8.2275], // Swiss Alps
  zoom: 13,
  layers: [L.tileLayer(osmTiles)]
});
```

## 📡 Nostr Implementation

### Event Schema

#### Route Definition (Kind 30880)
```json
{
  "kind": 30880,
  "tags": [
    ["d", "route:winterberg-2026-a"],
    ["t", "grounded"],
    ["t", "racequest"],
    ["title", "Winterberg Fun Run"]
  ],
  "content": "{\"schema\":\"grounded.route.v1\",\"polyline_geojson\":{...}}"
}
```

#### Proof Event (Kind 20880)
```json
{
  "kind": 20880,
  "tags": [
    ["a", "30882:<pubkey>:challenge:winterberg-sat-race"],
    ["checkpoint", "cp001"],
    ["method", "nfc"]
  ],
  "content": "{\"schema\":\"grounded.proof.v1\",\"state\":\"active\",\"nfc\":{...}}"
}
```

### Relay Strategy

- **Write**: Multi-relay publishing (app relays + user outbox)
- **Read**: Outbox model for user events, app relays for public content
- **Offline**: Queue events locally, sync when online

## 📱 Mobile Implementation

### Capacitor Plugins

#### Background Geolocation
```typescript
import { BackgroundGeolocation } from '@capacitor-community/background-geolocation';

await BackgroundGeolocation.addWatcher({
  backgroundMessage: "Tracking your race progress",
  backgroundTitle: "RaceQuest Location",
  requestPermissions: true,
  stale: false,
  distanceFilter: 10
}, (location) => {
  checkGeofences(location);
});
```

#### NFC Integration
```typescript
import { NFC } from '@capacitor-community/nfc';

const nfcData = await NFC.read();
const payload = JSON.parse(nfcData.message);
// Verify checkpoint_id and tag_id
```

#### Local Notifications
```typescript
import { LocalNotifications } from '@capacitor/local-notifications';

await LocalNotifications.schedule({
  notifications: [{
    title: "Checkpoint Reached!",
    body: "Tap NFC tag to activate",
    id: 1,
    schedule: { at: new Date(Date.now() + 1000) }
  }]
});
```

### Offline Storage

- **Routes & Checkpoints**: IndexedDB via Dexie
- **User State**: Zustand with persistence
- **Event Queue**: Local storage with sync status

## 💰 Bitcoin Integration

### Lightning Payments

```typescript
// Route purchase flow
const invoice = await generateInvoice({
  amount: route.priceMsat,
  description: `Access to ${route.name}`,
  routeId: route.id
});

// Payment verification
const payment = await verifyPayment(invoice.paymentHash);
if (payment.settled) {
  grantRouteAccess(route.id, userPubkey);
}
```

### Zap Implementation

```typescript
// Send zap to teammate
const zapRequest = await createZapRequest({
  recipient: teammate.pubkey,
  amount: 1000, // sats
  comment: "Great teamwork!"
});

await publishZapRequest(zapRequest);
```

## 🔐 Security Considerations

### Anti-Spoofing Measures

1. **Geofence + NFC**: Dual verification required
2. **Cryptographic Proofs**: All events signed with user keys
3. **Merchant Validation**: Final redemption requires merchant signature
4. **Rate Limiting**: Prevent rapid-fire checkpoint activations

### Privacy Protection

- Location data encrypted before Nostr publishing
- Optional anonymous mode for sensitive routes
- User controls data sharing granularity

### Key Management

- Nostr keys generated and stored securely on device
- Lightning wallet integration via NWC (Nostr Wallet Connect)
- Backup and recovery flows

## 🧪 Testing Strategy

### Unit Tests

```bash
# Core utilities
cd packages/core
npm test

# Geographic functions
cd packages/geo  
npm test
```

### Integration Tests

- Nostr event publishing and retrieval
- Geofencing accuracy and timing
- NFC tag reading and verification

### Manual Testing Checklist

#### RaceQuest App
- [ ] Route creation and editing
- [ ] Team formation and invites
- [ ] Background geofencing
- [ ] NFC checkpoint activation
- [ ] Offline functionality
- [ ] Lightning payments

#### Partners Dashboard
- [ ] Offer creation and management
- [ ] Analytics and reporting
- [ ] Coupon redemption flow

### Performance Testing

- Map rendering with 100+ checkpoints
- Background location tracking battery usage
- Nostr event sync with poor connectivity

## 🚀 Deployment

### Web Apps (Vite)

```bash
# RaceQuest web version
cd apps/racequest
npm run build
# Deploy dist/ to hosting provider

# Partners dashboard
cd apps/partners
npm run build
# Deploy dist/ to hosting provider
```

### Android App

```bash
cd apps/racequest
npm run build
npx cap sync android
npx cap open android
# Build signed APK in Android Studio
```

### iOS App (Future)

```bash
cd apps/racequest
npm run build
npx cap sync ios
npx cap open ios
# Build in Xcode on macOS
```

## 🔄 CI/CD Pipeline (Future)

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run build
      - run: npm run test
      - run: npm run type-check
```

## 📊 Monitoring and Analytics

### Error Tracking
- Client-side error reporting
- Performance monitoring
- User behavior analytics (privacy-preserving)

### Business Metrics
- Route purchases and completions
- Sponsor coupon redemption rates
- User retention and engagement

## 🤝 Contributing Guidelines

### Code Style
- Use TypeScript strict mode
- Follow existing naming conventions
- Add JSDoc comments for public APIs
- Keep functions small and focused

### Pull Request Process
1. Fork the repository
2. Create feature branch from `main`
3. Make changes with tests
4. Ensure all packages build successfully
5. Submit PR with clear description

### Issue Reporting
- Use provided issue templates
- Include reproduction steps
- Specify environment details
- Add relevant labels

---

This development guide will evolve as the project grows. Keep it updated with new patterns, tools, and best practices discovered during implementation.