# Deployment Guide

This guide covers deployment strategies for the Grounded/RaceQuest platform across different environments and platforms.

## 🎯 Deployment Overview

The Grounded platform consists of multiple deployable components:

- **RaceQuest Mobile App** - React + Capacitor (Android/iOS)
- **Partners Dashboard** - React web app (merchants/sponsors)
- **Documentation Site** - Static site (GitHub Pages/Netlify)

## 📱 Mobile App Deployment

### Android Deployment

#### Prerequisites
- Android Studio installed
- Android SDK (API level 33+)
- Java Development Kit (JDK 11+)
- Signing keystore for production builds

#### Development Build

```bash
cd apps/racequest

# Build the web assets
npm run build

# Sync with Android project
npx cap sync android

# Open in Android Studio
npx cap open android
```

#### Production Build

1. **Generate Signing Key**
   ```bash
   keytool -genkey -v -keystore racequest-release-key.keystore \
     -alias racequest -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Configure Signing in Android Studio**
   - Open `android/app/build.gradle`
   - Add signing configuration:
   ```gradle
   android {
     signingConfigs {
       release {
         storeFile file('path/to/racequest-release-key.keystore')
         storePassword 'your-store-password'
         keyAlias 'racequest'
         keyPassword 'your-key-password'
       }
     }
     buildTypes {
       release {
         signingConfig signingConfigs.release
         minifyEnabled true
         proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
       }
     }
   }
   ```

3. **Build Release APK**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

4. **Build App Bundle (for Play Store)**
   ```bash
   ./gradlew bundleRelease
   ```

#### Google Play Store Deployment

1. **Prepare Store Listing**
   - App name: RaceQuest
   - Package name: `app.grounded.racequest`
   - Category: Sports & Health
   - Content rating: Everyone
   - Privacy policy URL

2. **Required Permissions**
   ```xml
   <!-- android/app/src/main/AndroidManifest.xml -->
   <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
   <uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
   <uses-permission android:name="android.permission.NFC" />
   <uses-permission android:name="android.permission.WAKE_LOCK" />
   <uses-permission android:name="android.permission.INTERNET" />
   ```

3. **Upload to Play Console**
   - Upload signed AAB file
   - Complete store listing
   - Set up internal testing track
   - Submit for review

### iOS Deployment (Future)

#### Prerequisites
- macOS with Xcode
- Apple Developer Account ($99/year)
- iOS deployment target 14.0+

#### Development Build

```bash
cd apps/racequest

# Build web assets
npm run build

# Add iOS platform (if not already added)
npx cap add ios

# Sync with iOS project
npx cap sync ios

# Open in Xcode
npx cap open ios
```

#### Production Build

1. **Configure Signing**
   - Open project in Xcode
   - Select project → Signing & Capabilities
   - Choose development team
   - Set bundle identifier: `app.grounded.racequest`

2. **Build Archive**
   - Product → Archive
   - Upload to App Store Connect

3. **App Store Submission**
   - Complete app metadata
   - Upload screenshots
   - Submit for review

## 🌐 Web App Deployment

### Partners Dashboard

#### Build for Production

```bash
cd apps/partners

# Install dependencies
npm install

# Build production bundle
npm run build

# Output in dist/ directory
```

#### Deployment Options

##### Option 1: Netlify

1. **Connect Repository**
   ```bash
   # netlify.toml
   [build]
     base = "apps/partners"
     command = "npm run build"
     publish = "dist"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

2. **Deploy**
   - Connect GitHub repository
   - Set build command: `npm run build`
   - Set publish directory: `apps/partners/dist`

##### Option 2: Vercel

```json
// vercel.json
{
  "builds": [
    {
      "src": "apps/partners/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/partners/(.*)",
      "dest": "/apps/partners/dist/$1"
    }
  ]
}
```

##### Option 3: Traditional Hosting

```bash
# Build and upload to any static hosting
cd apps/partners
npm run build
rsync -av dist/ user@server:/var/www/partners/
```

#### Environment Configuration

```bash
# .env.production
VITE_API_BASE_URL=https://api.grounded.app
VITE_NOSTR_RELAYS=wss://relay.grounded.app,wss://relay.damus.io
VITE_ENVIRONMENT=production
```

### RaceQuest Web Version (Optional)

The RaceQuest app can also be deployed as a PWA:

```bash
cd apps/racequest
npm run build

# Deploy dist/ to hosting provider
# Configure service worker for offline functionality
```

## 🔧 Infrastructure Setup

### Nostr Relays

#### Self-Hosted Relay (Recommended)

```bash
# Using strfry (C++ relay implementation)
git clone https://github.com/hoytech/strfry.git
cd strfry
make setup-golpe
make -j4

# Configure strfry.conf
cp strfry.conf.example strfry.conf
# Edit configuration for your domain

# Run relay
./strfry relay
```

#### Relay Configuration

```json
// strfry.conf
{
  "relay": {
    "bind": "0.0.0.0",
    "port": 7777,
    "nofiles": 1000000,
    "realIpHeader": "X-Forwarded-For"
  },
  "storage": {
    "dbParams": {
      "filename": "./strfry-db/"
    }
  },
  "events": {
    "maxEventBytes": 65536,
    "rejectEventsNewerThanSeconds": 900,
    "rejectEventsOlderThanSeconds": 94608000
  }
}
```

#### Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/grounded-relay
server {
    listen 443 ssl http2;
    server_name relay.grounded.app;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:7777;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Lightning Infrastructure

#### LNbits Setup (Optional)

```bash
# For sponsor payments and zaps
git clone https://github.com/lnbits/lnbits.git
cd lnbits

# Configure environment
cp .env.example .env
# Edit .env with your Lightning node details

# Run LNbits
poetry install
poetry run lnbits
```

### Monitoring and Analytics

#### Application Monitoring

```bash
# Using Sentry for error tracking
npm install @sentry/react @sentry/vite-plugin

# Configure in vite.config.ts
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig({
  plugins: [
    sentryVitePlugin({
      org: "grounded",
      project: "racequest"
    })
  ]
});
```

#### Infrastructure Monitoring

```yaml
# docker-compose.yml for monitoring stack
version: '3.8'
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

## 🚀 CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run build
      - run: npm run type-check
      - run: npm test

  deploy-partners:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run build
      
      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v2.0
        with:
          publish-dir: './apps/partners/dist'
          production-branch: main
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}

  build-android:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - uses: actions/setup-java@v3
        with:
          distribution: 'temurin'
          java-version: '11'
      
      - run: npm ci
      - run: npm run build
      
      - name: Build Android
        run: |
          cd apps/racequest
          npx cap sync android
          cd android
          ./gradlew assembleRelease
      
      - name: Upload APK
        uses: actions/upload-artifact@v3
        with:
          name: racequest-release.apk
          path: apps/racequest/android/app/build/outputs/apk/release/
```

### Automated Testing

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: npm run test:e2e

  android-build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - uses: actions/setup-java@v3
        with:
          distribution: 'temurin'
          java-version: '11'
      - run: npm ci
      - run: npm run build
      - name: Test Android Build
        run: |
          cd apps/racequest
          npx cap sync android
          cd android
          ./gradlew assembleDebug
```

## 🔒 Security Considerations

### SSL/TLS Configuration

```nginx
# Strong SSL configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;

# HSTS
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

# Other security headers
add_header X-Frame-Options DENY always;
add_header X-Content-Type-Options nosniff always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

### Environment Variables

```bash
# Production environment variables
VITE_NOSTR_RELAYS=wss://relay.grounded.app,wss://relay.damus.io
VITE_LIGHTNING_NODE=https://lnbits.grounded.app
VITE_SENTRY_DSN=https://your-sentry-dsn
VITE_ENVIRONMENT=production

# Sensitive variables (not in code)
NETLIFY_AUTH_TOKEN=your-token
ANDROID_KEYSTORE_PASSWORD=your-password
APPLE_DEVELOPER_PASSWORD=your-password
```

### Content Security Policy

```html
<!-- For web deployments -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' wss: https:;
  font-src 'self';
">
```

## 📊 Performance Optimization

### Web App Optimization

```typescript
// Vite configuration for production
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          leaflet: ['leaflet', 'react-leaflet'],
          nostr: ['nostr-tools']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
});
```

### Mobile App Optimization

```typescript
// Capacitor configuration
const config: CapacitorConfig = {
  appId: 'app.grounded.racequest',
  appName: 'RaceQuest',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false // Disable in production
  }
};
```

## 🔄 Rollback Strategy

### Web Apps
- Keep previous build artifacts
- Use blue-green deployment
- Database migration rollback scripts

### Mobile Apps
- Maintain previous APK/IPA versions
- Gradual rollout (Play Store staged rollouts)
- Feature flags for quick disabling

## 📈 Scaling Considerations

### Horizontal Scaling
- Load balancer for web apps
- Multiple Nostr relay instances
- CDN for static assets

### Database Scaling
- Read replicas for analytics
- Sharding by geographic region
- Caching layer (Redis)

### Monitoring Alerts

```yaml
# Alerting rules
groups:
  - name: grounded
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        annotations:
          summary: High error rate detected

      - alert: RelayDown
        expr: up{job="nostr-relay"} == 0
        for: 1m
        annotations:
          summary: Nostr relay is down
```

---

This deployment guide provides a comprehensive foundation for deploying the Grounded platform. Adjust configurations based on your specific infrastructure requirements and scaling needs.