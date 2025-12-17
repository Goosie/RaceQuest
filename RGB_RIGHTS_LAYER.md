# Grounded/RaceQuest — RGB Rights Layer Specification

This document defines how RGB (Really Good for Bitcoin) is integrated into Grounded for rights, scarcity, and contracts.

## Overview

RGB provides the "hard rights layer" for Grounded, ensuring:
- **Scarcity**: Coupons have hard limits, no double-spending
- **Ownership**: Transferable rights that users truly own
- **Contracts**: Verifiable sponsor agreements
- **Client-side validation**: Users can prove rights without central authority

## RGB Assets in Grounded

### 1. COUPON Assets (Fungible)

**Asset ID Format**: `COUPON:<merchant>:<offer>`
**Example**: `COUPON:icecorner:winter2024`

```yaml
Asset Schema:
  name: "IceCorner Winter Coupons"
  ticker: "ICWC"
  precision: 0  # Whole coupons only
  supply: 200   # Fixed supply
  
Asset Metadata:
  merchant_name: "IceCorner Winterberg"
  merchant_pubkey: "<pubkey>"
  offer_title: "Free Hot Chocolate"
  offer_description: "One free hot chocolate with any purchase"
  value_eur: "3.50"
  valid_from: 1767100000
  valid_to: 1767600000
  redeem_window_sec: 3600
  terms: "Valid only with purchase. One per customer."
  location:
    lat: 51.182
    lng: 8.487
    address: "Lift Station Plaza 1"
```

**Lifecycle**:
1. **Issuance**: Merchant creates asset with fixed supply
2. **Distribution**: Coupons allocated to checkpoint rewards
3. **Claiming**: Player activates checkpoint → receives coupon units
4. **Transfer**: Player can send coupons to teammates
5. **Redemption**: Merchant consumes units when redeemed

### 2. PASS Assets (Non-Fungible/Semi-Fungible)

**Asset ID Format**: `PASS:<route>:<challenge>`
**Example**: `PASS:winterberg:saturday-race`

```yaml
Asset Schema:
  name: "Winterberg Saturday Race Pass"
  ticker: "WSRP"
  precision: 0
  supply: 100  # Max participants
  
Asset Metadata:
  route_name: "Winterberg Fun Run"
  challenge_name: "Saturday Race"
  route_pubkey: "<routeMakerPubkey>"
  challenge_pubkey: "<challengeOrganizerPubkey>"
  start_time: 1767181200
  end_time: 1767206400
  entry_fee_msat: 1000000
  max_participants: 100
  team_max_size: 2
```

**Lifecycle**:
1. **Issuance**: Challenge organizer creates passes
2. **Purchase**: Players buy passes with Lightning
3. **Transfer**: Passes can be gifted or resold
4. **Validation**: App verifies pass ownership for challenge entry
5. **Expiry**: Passes become invalid after challenge ends

### 3. CONTRACT Assets (Agreements)

**Asset ID Format**: `CONTRACT:<merchant>:<route>:<period>`
**Example**: `CONTRACT:icecorner:winterberg:2024q1`

```yaml
Asset Schema:
  name: "IceCorner Winterberg Sponsorship Q1 2024"
  ticker: "ICWS"
  precision: 8  # For revenue splits
  supply: 1000000  # Basis points (100.0000%)
  
Asset Metadata:
  merchant_pubkey: "<merchantPubkey>"
  route_pubkey: "<routeMakerPubkey>"
  platform_pubkey: "<platformPubkey>"
  contract_hash: "sha256:abc123..."  # Hash of full contract terms
  revenue_splits:
    merchant: 600000    # 60%
    route_maker: 300000 # 30%
    platform: 100000   # 10%
  coupon_allocation: 200
  period_start: 1767100000
  period_end: 1769692000
  settlement_frequency: "monthly"
```

**Lifecycle**:
1. **Creation**: Multi-party contract negotiation
2. **Signing**: All parties receive contract units
3. **Execution**: Revenue flows according to contract
4. **Settlement**: Periodic payouts based on performance
5. **Audit**: Anyone can verify contract terms and execution

## RGB Integration Points

### 1. Coupon Claiming Flow

```typescript
interface CouponClaimFlow {
  // 1. Player activates checkpoint (Nostr proof event)
  checkpointActivation: NostrEvent;
  
  // 2. RGB coupon allocation triggered
  rgbAllocation: {
    assetId: string;
    amount: number;
    recipient: string; // Player's RGB identity
    proof: string;     // RGB state transition proof
  };
  
  // 3. Player receives coupon units
  couponBalance: {
    assetId: string;
    balance: number;
    spendable: number;
  };
}
```

### 2. Coupon Transfer Flow

```typescript
interface CouponTransferFlow {
  // 1. Player initiates transfer
  transferRequest: {
    assetId: string;
    amount: number;
    recipient: string; // Teammate's RGB identity
    memo?: string;
  };
  
  // 2. RGB state transition
  rgbTransfer: {
    inputs: Array<{utxo: string, amount: number}>;
    outputs: Array<{recipient: string, amount: number}>;
    proof: string;
  };
  
  // 3. Recipient receives coupons
  transferComplete: {
    txid: string;
    confirmed: boolean;
    newBalance: number;
  };
}
```

### 3. Merchant Redemption Flow

```typescript
interface MerchantRedemptionFlow {
  // 1. Customer presents coupon
  couponPresentation: {
    assetId: string;
    amount: number;
    proof: string; // Ownership proof
  };
  
  // 2. Merchant verifies and consumes
  redemptionVerification: {
    valid: boolean;
    assetId: string;
    amount: number;
    consumptionProof: string;
  };
  
  // 3. RGB units consumed (burned)
  consumption: {
    inputs: Array<{utxo: string, amount: number}>;
    burned: number;
    proof: string;
  };
  
  // 4. Nostr redemption event published
  nostrRedemption: NostrEvent; // kind: 20884
}
```

## Client-Side Validation

### Coupon Ownership Verification

```typescript
class CouponValidator {
  async verifyCouponOwnership(
    assetId: string,
    amount: number,
    ownerPubkey: string
  ): Promise<ValidationResult> {
    // 1. Get RGB asset history
    const assetHistory = await this.rgbClient.getAssetHistory(assetId);
    
    // 2. Validate state transitions
    const validTransitions = this.validateStateTransitions(assetHistory);
    
    // 3. Calculate current balance
    const currentBalance = this.calculateBalance(validTransitions, ownerPubkey);
    
    // 4. Verify sufficient balance
    return {
      valid: currentBalance >= amount,
      balance: currentBalance,
      proof: this.generateOwnershipProof(validTransitions, ownerPubkey)
    };
  }
}
```

### Merchant Inventory Verification

```typescript
class InventoryValidator {
  async verifyMerchantInventory(
    assetId: string
  ): Promise<InventoryStatus> {
    // 1. Get asset genesis
    const genesis = await this.rgbClient.getAssetGenesis(assetId);
    
    // 2. Get all consumption events
    const consumptions = await this.rgbClient.getConsumptions(assetId);
    
    // 3. Calculate remaining supply
    const totalSupply = genesis.supply;
    const totalConsumed = consumptions.reduce((sum, c) => sum + c.amount, 0);
    const remaining = totalSupply - totalConsumed;
    
    return {
      totalSupply,
      consumed: totalConsumed,
      remaining,
      lastUpdate: Math.max(...consumptions.map(c => c.timestamp))
    };
  }
}
```

## RGB Wallet Integration

### Wallet Requirements

```typescript
interface GroundedRGBWallet {
  // Asset management
  getAssets(): Promise<Asset[]>;
  getAssetBalance(assetId: string): Promise<number>;
  
  // Transfers
  createTransfer(
    assetId: string,
    amount: number,
    recipient: string
  ): Promise<TransferPsbt>;
  
  signTransfer(psbt: TransferPsbt): Promise<SignedTransfer>;
  broadcastTransfer(transfer: SignedTransfer): Promise<string>;
  
  // Consumption (for merchants)
  createConsumption(
    assetId: string,
    amount: number
  ): Promise<ConsumptionPsbt>;
  
  // Validation
  validateAsset(assetId: string): Promise<ValidationResult>;
  generateOwnershipProof(assetId: string, amount: number): Promise<string>;
}
```

### Backup & Recovery

```typescript
interface WalletBackup {
  // Seed backup (standard)
  mnemonic: string; // BIP39 seed phrase
  
  // RGB-specific backup
  rgbBackup: {
    assets: Array<{
      assetId: string;
      genesis: string;
      stateTransitions: string[];
    }>;
    utxos: Array<{
      outpoint: string;
      amount: number;
      assetAllocations: Array<{
        assetId: string;
        amount: number;
      }>;
    }>;
  };
}
```

## Anti-Fraud Measures

### Double-Spend Prevention

```typescript
class AntiDoubleSpend {
  async validateRedemption(
    couponProof: string,
    merchantPubkey: string
  ): Promise<RedemptionValidation> {
    // 1. Verify RGB ownership proof
    const ownershipValid = await this.validateOwnership(couponProof);
    
    // 2. Check for previous redemptions
    const previousRedemptions = await this.checkRedemptionHistory(couponProof);
    
    // 3. Verify merchant authorization
    const merchantValid = await this.validateMerchant(merchantPubkey);
    
    return {
      valid: ownershipValid && !previousRedemptions && merchantValid,
      reason: this.getValidationReason(),
      proof: this.generateValidationProof()
    };
  }
}
```

### Merchant Verification

```typescript
class MerchantVerifier {
  async verifyMerchantAuthorization(
    merchantPubkey: string,
    assetId: string
  ): Promise<boolean> {
    // 1. Get asset metadata
    const asset = await this.rgbClient.getAsset(assetId);
    
    // 2. Verify merchant is authorized for this asset
    const authorizedMerchants = asset.metadata.authorized_merchants || [];
    
    // 3. Check merchant signature capability
    const canSign = await this.verifySigningCapability(merchantPubkey);
    
    return authorizedMerchants.includes(merchantPubkey) && canSign;
  }
}
```

## Performance Considerations

### Caching Strategy

```typescript
class RGBCache {
  // Cache asset metadata (rarely changes)
  private assetCache = new Map<string, Asset>();
  
  // Cache balance calculations (changes on transfers)
  private balanceCache = new Map<string, {balance: number, lastUpdate: number}>();
  
  // Cache validation results (short TTL)
  private validationCache = new Map<string, {result: boolean, expires: number}>();
  
  async getCachedBalance(assetId: string, pubkey: string): Promise<number> {
    const cacheKey = `${assetId}:${pubkey}`;
    const cached = this.balanceCache.get(cacheKey);
    
    if (cached && Date.now() - cached.lastUpdate < 60000) { // 1 minute TTL
      return cached.balance;
    }
    
    const balance = await this.calculateFreshBalance(assetId, pubkey);
    this.balanceCache.set(cacheKey, {balance, lastUpdate: Date.now()});
    return balance;
  }
}
```

### Offline Support

```typescript
class OfflineRGBSupport {
  // Queue transfers for when online
  private transferQueue: Array<{
    assetId: string;
    amount: number;
    recipient: string;
    timestamp: number;
  }> = [];
  
  // Cache last known state
  private lastKnownState = new Map<string, AssetState>();
  
  async queueTransfer(
    assetId: string,
    amount: number,
    recipient: string
  ): Promise<void> {
    // Validate against last known state
    const lastState = this.lastKnownState.get(assetId);
    if (!lastState || lastState.balance < amount) {
      throw new Error('Insufficient balance');
    }
    
    // Queue for later
    this.transferQueue.push({
      assetId,
      amount,
      recipient,
      timestamp: Date.now()
    });
    
    // Update optimistic state
    this.updateOptimisticState(assetId, -amount);
  }
}
```

## Testing Strategy

### Unit Tests

```typescript
describe('RGB Coupon System', () => {
  test('should create coupon asset with correct metadata', async () => {
    const asset = await createCouponAsset({
      merchant: 'icecorner',
      offer: 'winter2024',
      supply: 200,
      metadata: {/* ... */}
    });
    
    expect(asset.supply).toBe(200);
    expect(asset.metadata.merchant_name).toBe('IceCorner Winterberg');
  });
  
  test('should prevent double spending', async () => {
    const coupon = await claimCoupon(assetId, playerId);
    const firstRedeem = await redeemCoupon(coupon, merchantId);
    
    expect(firstRedeem.success).toBe(true);
    
    const secondRedeem = await redeemCoupon(coupon, merchantId);
    expect(secondRedeem.success).toBe(false);
    expect(secondRedeem.error).toBe('Already redeemed');
  });
});
```

### Integration Tests

```typescript
describe('End-to-End Coupon Flow', () => {
  test('complete coupon lifecycle', async () => {
    // 1. Merchant creates offer
    const offer = await createOffer(merchantData);
    
    // 2. Player activates checkpoint
    const proof = await activateCheckpoint(checkpointId, playerId);
    
    // 3. Player receives coupon
    const coupon = await claimCoupon(offer.assetId, playerId);
    
    // 4. Player transfers to teammate
    const transfer = await transferCoupon(coupon, teammateId);
    
    // 5. Teammate redeems at merchant
    const redemption = await redeemCoupon(transfer.coupon, merchantId);
    
    expect(redemption.success).toBe(true);
  });
});
```

## Migration Plan

### Phase 1: Interfaces (Current)
- Define RGB interfaces
- Implement stub/mock RGB client
- Build UI flows with fake data
- Test UX without RGB complexity

### Phase 2: RGB Integration
- Integrate real RGB client library
- Implement asset creation and management
- Add transfer and redemption flows
- Enable client-side validation

### Phase 3: Production Hardening
- Add comprehensive error handling
- Implement backup/recovery
- Optimize performance
- Add monitoring and alerting

## Security Considerations

### Key Management
- Use hardware wallets for merchant keys
- Implement proper key rotation
- Secure backup procedures
- Multi-signature for high-value assets

### Validation
- Always validate RGB proofs client-side
- Never trust server-provided balances
- Verify asset authenticity
- Check for known attack patterns

### Privacy
- Minimize on-chain footprint
- Use confidential transactions where possible
- Avoid linking RGB transfers to Nostr identities
- Implement proper UTXO management

## Future Enhancements

### Advanced Features
- Conditional transfers (time-locked, multi-sig)
- Fractional coupon ownership
- Cross-asset swaps
- Automated market makers for coupons

### Scalability
- Lightning Network integration for RGB transfers
- Batch operations for efficiency
- State compression techniques
- Optimistic validation patterns