# Grounded/RaceQuest — Complete Nostr Event Schema

This document defines all Nostr event kinds, tags, and content schemas for the Grounded platform.

## NIPs Used

- **NIP-01**: Basic event format, tags, addressable events
- **NIP-19/21**: bech32 encoding and nostr: URIs for sharing
- **NIP-40**: Expiration tags for temporary events
- **NIP-44/59**: Encryption for private grants and sensitive data
- **NIP-57**: Zaps (kind 9734 requests, kind 9735 receipts)
- **NIP-65**: Relay list metadata for outbox/inbox strategy
- **NIP-09**: Event deletions (kind 5)
- **NIP-98**: HTTP auth for merchant endpoints

## Relay Strategy

### Write Strategy (Multi-relay)
- Write to app-specific relays (Grounded relays)
- Write to user's outbox relays (from kind 10002, NIP-65)
- Queue locally if offline, sync when online

### Read Strategy
- Route/challenge data: app relays + route-specific relay hints
- User/team/proofs: outbox relays of involved pubkeys + app relays
- Always show sync status (queued/sent/confirmed/failed)

## Event Kinds Registry

| Kind  | Type | Name | Description |
|-------|------|------|-------------|
| 30880 | Addressable | Route Definition | Route polyline, metadata, checkpoint references |
| 30881 | Addressable | Checkpoint Set | Collection of checkpoints for a route |
| 30882 | Addressable | Challenge/Race Window | Time-bounded competition definition |
| 30883 | Addressable | Team Definition | Team metadata and captain info |
| 30884 | Addressable | Sponsor Offer | Merchant coupon/reward definition |
| 20880 | Regular | IWasHere Proof | Checkpoint activation proof |
| 20881 | Regular | Team Join | Player joining a team |
| 20882 | Regular | Challenge Registration | Team registering for challenge |
| 20883 | Regular | Coupon Activation | Coupon becoming active/claimable |
| 20884 | Regular | Coupon Redeem | Merchant redeeming coupon |
| 20885 | Regular | Route Access Grant | Private access after payment |

## Detailed Event Schemas

### 1. Route Definition (kind: 30880)

**Addressable**: `d` tag = `route:<routeId>`

```json
{
  "kind": 30880,
  "tags": [
    ["d", "route:winterberg-2026-a"],
    ["t", "grounded"],
    ["t", "racequest"],
    ["t", "ski"],
    ["title", "Winterberg Fun Run"],
    ["price_msat", "1000000"],
    ["relay", "wss://relay.grounded.app"],
    ["expires", "1767600000"]
  ],
  "content": "{\"schema\":\"grounded.route.v1\",\"name\":\"Winterberg Fun Run\",\"description\":\"Epic ski route through Winterberg\",\"mode\":\"ski\",\"polyline_geojson\":{\"type\":\"Feature\",\"geometry\":{\"type\":\"LineString\",\"coordinates\":[[8.487,51.182],[8.488,51.183]]}},\"distance_m\":8200,\"elevation_gain_m\":310,\"difficulty\":\"intermediate\",\"checkpoint_set_a\":\"30881:<pubkey>:route:winterberg-2026-a:checkpoints\",\"created_by\":\"<pubkey>\",\"version\":1}"
}
```

### 2. Checkpoint Set (kind: 30881)

**Addressable**: `d` tag = `route:<routeId>:checkpoints`

```json
{
  "kind": 30881,
  "tags": [
    ["d", "route:winterberg-2026-a:checkpoints"],
    ["t", "grounded"],
    ["a", "30880:<pubkey>:route:winterberg-2026-a"],
    ["expires", "1767600000"]
  ],
  "content": "{\"schema\":\"grounded.checkpoints.v1\",\"route_id\":\"winterberg-2026-a\",\"version\":1,\"checkpoints\":[{\"cid\":\"cp001\",\"lat\":51.182,\"lng\":8.487,\"radius_m\":30,\"name\":\"Lift Station Alpha\",\"description\":\"Main lift entrance\",\"actions\":[{\"type\":\"geofence\"},{\"type\":\"nfc\",\"tag_id\":\"04a224b8c9d1e2f3\"},{\"type\":\"question\",\"prompt\":\"What's the name of this lift?\",\"choices\":[\"Alpha Express\",\"Beta Lift\",\"Gamma Cable\"],\"answer_hash\":\"sha256:abc123...\"},{\"type\":\"reward\",\"offer_a\":\"30884:<sponsorPubkey>:offer:ice-001\"}]},{\"cid\":\"cp002\",\"lat\":51.183,\"lng\":8.488,\"radius_m\":25,\"name\":\"Mid Station\",\"actions\":[{\"type\":\"geofence\"},{\"type\":\"nfc\",\"tag_id\":\"04b335c9d2e3f4a5\"}]}]}"
}
```

### 3. Challenge/Race Window (kind: 30882)

**Addressable**: `d` tag = `challenge:<challengeId>`

```json
{
  "kind": 30882,
  "tags": [
    ["d", "challenge:winterberg-sat-race"],
    ["t", "grounded"],
    ["t", "race"],
    ["title", "Saturday Winterberg Race"],
    ["a", "30880:<makerPubkey>:route:winterberg-2026-a"],
    ["starts", "1767181200"],
    ["ends", "1767206400"],
    ["expires", "1767210000"]
  ],
  "content": "{\"schema\":\"grounded.challenge.v1\",\"name\":\"Saturday Winterberg Race\",\"description\":\"Team race through Winterberg pistes\",\"route_a\":\"30880:<makerPubkey>:route:winterberg-2026-a\",\"start\":1767181200,\"end\":1767206400,\"scoring\":{\"type\":\"unique_checkpoints\",\"tiebreak\":\"elapsed_time\"},\"team_max_size\":2,\"team_min_size\":1,\"entry_fee_msat\":0,\"prize_pool_msat\":0,\"rules\":{\"nfc_required\":true,\"offline_grace_period\":300},\"created_by\":\"<pubkey>\",\"version\":1}"
}
```

### 4. Team Definition (kind: 30883)

**Addressable**: `d` tag = `team:<challengeId>:<teamId>`

```json
{
  "kind": 30883,
  "tags": [
    ["d", "team:winterberg-sat-race:team-red"],
    ["t", "grounded"],
    ["a", "30882:<makerPubkey>:challenge:winterberg-sat-race"],
    ["p", "<captainPubkey>"],
    ["expires", "1767210000"]
  ],
  "content": "{\"schema\":\"grounded.team.v1\",\"challenge_a\":\"30882:<makerPubkey>:challenge:winterberg-sat-race\",\"team_id\":\"team-red\",\"name\":\"Red Rockets\",\"captain\":\"<captainPubkey>\",\"max_members\":2,\"invite_code\":\"RR2024\",\"created_at\":1767100000,\"version\":1}"
}
```

### 5. Sponsor Offer (kind: 30884)

**Addressable**: `d` tag = `offer:<merchantId>:<offerId>`

```json
{
  "kind": 30884,
  "tags": [
    ["d", "offer:icecorner:ice-001"],
    ["t", "grounded"],
    ["t", "sponsor"],
    ["merchant", "IceCorner Winterberg"],
    ["offer_type", "discount"],
    ["valid_from", "1767100000"],
    ["valid_to", "1767600000"]
  ],
  "content": "{\"schema\":\"grounded.offer.v1\",\"merchant_name\":\"IceCorner Winterberg\",\"merchant_pubkey\":\"<merchantPubkey>\",\"title\":\"Free Hot Chocolate\",\"description\":\"One free hot chocolate with any purchase\",\"offer_type\":\"free_item\",\"value_eur\":\"3.50\",\"inventory_total\":200,\"inventory_remaining_hint\":173,\"redeem_window_sec\":3600,\"valid_from\":1767100000,\"valid_to\":1767600000,\"redeem_methods\":[\"qr\",\"nfc\"],\"terms\":\"Valid only with purchase. One per customer.\",\"location\":{\"lat\":51.182,\"lng\":8.487,\"address\":\"Lift Station Plaza 1\"},\"rgb_asset_id\":\"<assetId>\",\"version\":1}"
}
```

### 6. IWasHere Proof (kind: 20880)

**Regular event** (append-only)

```json
{
  "kind": 20880,
  "tags": [
    ["a", "30882:<makerPubkey>:challenge:winterberg-sat-race"],
    ["a", "30880:<makerPubkey>:route:winterberg-2026-a"],
    ["a", "30883:<captainPubkey>:team:winterberg-sat-race:team-red"],
    ["checkpoint", "cp001"],
    ["method", "geofence"],
    ["method", "nfc"],
    ["state", "active"],
    ["h", "u4pruydqqvg"]
  ],
  "content": "{\"schema\":\"grounded.proof.v1\",\"checkpoint_id\":\"cp001\",\"state\":\"active\",\"timestamp\":1767185552,\"geofence\":{\"entered_at\":1767185550,\"lat_hint\":51.182,\"lng_hint\":8.487,\"accuracy_m\":5},\"nfc\":{\"tag_id\":\"04a224b8c9d1e2f3\",\"nonce\":\"abc123def456\",\"signature\":\"<nfcSignature>\"},\"device\":{\"platform\":\"android\",\"app_version\":\"1.0.0\",\"attestation\":\"<deviceAttestation>\"},\"proof_hash\":\"sha256:def789...\",\"version\":1}"
}
```

### 7. Team Join (kind: 20881)

```json
{
  "kind": 20881,
  "tags": [
    ["a", "30883:<captainPubkey>:team:winterberg-sat-race:team-red"],
    ["p", "<captainPubkey>"],
    ["role", "member"]
  ],
  "content": "{\"schema\":\"grounded.team.join.v1\",\"team_a\":\"30883:<captainPubkey>:team:winterberg-sat-race:team-red\",\"role\":\"member\",\"invite_code\":\"RR2024\",\"joined_at\":1767100500,\"player_name\":\"Alice\",\"version\":1}"
}
```

### 8. Coupon Activation (kind: 20883)

```json
{
  "kind": 20883,
  "tags": [
    ["a", "30884:<merchantPubkey>:offer:icecorner:ice-001"],
    ["e", "<proofEventId>"],
    ["p", "<playerPubkey>"],
    ["expires", "1767189200"]
  ],
  "content": "{\"schema\":\"grounded.coupon.activate.v1\",\"offer_a\":\"30884:<merchantPubkey>:offer:icecorner:ice-001\",\"proof_event\":\"<proofEventId>\",\"activated_at\":1767185600,\"expires_at\":1767189200,\"activation_method\":\"nfc_checkpoint\",\"rgb_claim_id\":\"<rgbClaimId>\",\"version\":1}"
}
```

### 9. Coupon Redeem (kind: 20884)

**Signed by merchant pubkey**

```json
{
  "kind": 20884,
  "tags": [
    ["e", "<activationEventId>"],
    ["p", "<playerPubkey>"],
    ["merchant", "<merchantPubkey>"],
    ["pos", "icecorner-pos-1"]
  ],
  "content": "{\"schema\":\"grounded.coupon.redeem.v1\",\"activation_event\":\"<activationEventId>\",\"redeemed_at\":1767186000,\"pos_id\":\"icecorner-pos-1\",\"staff_id\":\"alice_barista\",\"transaction_id\":\"tx_abc123\",\"amount_eur_hint\":\"3.50\",\"rgb_consumption_proof\":\"<rgbProof>\",\"receipt_hash\":\"sha256:ghi789...\",\"version\":1}"
}
```

### 10. Route Access Grant (kind: 20885)

**Encrypted with NIP-44**

```json
{
  "kind": 20885,
  "tags": [
    ["p", "<buyerPubkey>"],
    ["a", "30880:<makerPubkey>:route:winterberg-2026-a"],
    ["payment", "<lightningInvoiceHash>"],
    ["expires", "1767600000"]
  ],
  "content": "<nip44_encrypted_content>",
  "decrypted_content": "{\"schema\":\"grounded.access.grant.v1\",\"route_a\":\"30880:<makerPubkey>:route:winterberg-2026-a\",\"granted_at\":1767100000,\"expires_at\":1767600000,\"payment_hash\":\"<lightningHash>\",\"amount_paid_msat\":1000000,\"access_level\":\"full\",\"rgb_pass_id\":\"<rgbPassId>\",\"terms_hash\":\"sha256:jkl012...\",\"version\":1}"
}
```

## REQ Filters for Common Queries

### Get Route with Checkpoints
```json
[
  "REQ",
  "route_data",
  {
    "kinds": [30880, 30881],
    "authors": ["<routeMakerPubkey>"],
    "#d": ["route:winterberg-2026-a", "route:winterberg-2026-a:checkpoints"]
  }
]
```

### Get Challenge Leaderboard
```json
[
  "REQ",
  "leaderboard",
  {
    "kinds": [20880],
    "#a": ["30882:<makerPubkey>:challenge:winterberg-sat-race"],
    "since": 1767181200,
    "until": 1767206400
  }
]
```

### Get Team Members
```json
[
  "REQ",
  "team_members",
  {
    "kinds": [20881],
    "#a": ["30883:<captainPubkey>:team:winterberg-sat-race:team-red"]
  }
]
```

### Get User's Active Coupons
```json
[
  "REQ",
  "my_coupons",
  {
    "kinds": [20883],
    "authors": ["<userPubkey>"],
    "#expires": [">1767185600"]
  }
]
```

## Scoring Algorithm

### Team Score Calculation
```typescript
function calculateTeamScore(proofEvents: NostrEvent[]): TeamScore {
  const activeProofs = proofEvents.filter(e => 
    e.content.includes('"state":"active"') &&
    e.tags.some(t => t[0] === 'method' && t[1] === 'nfc')
  );
  
  const uniqueCheckpoints = new Set(
    activeProofs.map(e => e.tags.find(t => t[0] === 'checkpoint')?.[1])
  ).size;
  
  const timestamps = activeProofs.map(e => JSON.parse(e.content).timestamp);
  const elapsedTime = Math.max(...timestamps) - Math.min(...timestamps);
  
  return {
    score: uniqueCheckpoints,
    elapsedTime,
    totalProofs: activeProofs.length
  };
}
```

## Error Handling & Sync States

### Event Publishing States
- `queued`: Event created locally, waiting for network
- `sending`: Currently publishing to relays
- `confirmed`: Successfully published to at least one relay
- `failed`: Publishing failed, will retry
- `partial`: Published to some relays, failed on others

### Conflict Resolution
- Use `created_at` timestamp for ordering
- For addressable events, latest `created_at` wins
- For team joins, first valid join wins
- For checkpoint activations, first valid NFC proof wins

## Privacy Considerations

### Public Events
- Routes, challenges, teams (metadata only)
- Proof events (with location hints, not exact coordinates)
- Coupon activations and redeems

### Private Events (NIP-44 Encrypted)
- Route access grants after payment
- Detailed merchant instructions
- Team invite codes and private communications
- Sensitive sponsor contract terms

### Location Privacy
- Use geohash truncation for approximate location
- Never publish exact GPS coordinates
- Use relative positioning where possible

## Migration & Versioning

### Schema Versioning
All content includes `"version": 1` field for future migrations.

### Backward Compatibility
- New optional fields can be added
- Required fields cannot be removed
- Kind numbers are permanent
- Tag meanings are permanent

### Deprecation Process
1. Announce deprecation with timeline
2. Support both old and new schemas
3. Migrate data gradually
4. Remove old schema support after grace period