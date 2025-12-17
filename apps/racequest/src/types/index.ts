// Core types for Grounded/RaceQuest

export interface LatLng {
  lat: number
  lng: number
}

export interface Checkpoint {
  id: string
  lat: number
  lng: number
  radius_m: number
  name?: string
  description?: string
  actions: CheckpointAction[]
  state: CheckpointState
}

export interface CheckpointAction {
  type: 'geofence' | 'nfc' | 'question' | 'reward'
  tag_id?: string
  prompt?: string
  choices?: string[]
  answer_hash?: string
  offer_id?: string
}

export type CheckpointState = 'locked' | 'seen' | 'active' | 'redeemed' | 'expired'

export interface Route {
  id: string
  name: string
  description?: string
  mode: 'ski' | 'walk' | 'run' | 'bike'
  polyline: LatLng[]
  distance_m: number
  elevation_gain_m?: number
  difficulty?: 'easy' | 'intermediate' | 'hard'
  checkpoints: Checkpoint[]
  created_by: string
  created_at: number
  price_msat?: number
}

export interface Team {
  id: string
  name: string
  captain: string
  members: string[]
  challenge_id?: string
  invite_code: string
  created_at: number
  max_members: number
}

export interface Challenge {
  id: string
  name: string
  description?: string
  route_id: string
  start_time: number
  end_time: number
  team_max_size: number
  team_min_size: number
  entry_fee_msat: number
  prize_pool_msat: number
  created_by: string
  rules: ChallengeRules
}

export interface ChallengeRules {
  nfc_required: boolean
  offline_grace_period: number
  scoring_type: 'unique_checkpoints' | 'time_based' | 'points'
  tiebreak: 'elapsed_time' | 'total_time' | 'first_completion'
}

export interface ProofEvent {
  id: string
  checkpoint_id: string
  team_id?: string
  player_pubkey: string
  state: CheckpointState
  timestamp: number
  geofence?: GeofenceProof
  nfc?: NFCProof
  device_info?: DeviceInfo
}

export interface GeofenceProof {
  entered_at: number
  lat_hint: number
  lng_hint: number
  accuracy_m: number
}

export interface NFCProof {
  tag_id: string
  nonce: string
  signature?: string
}

export interface DeviceInfo {
  platform: 'android' | 'ios' | 'web'
  app_version: string
  attestation?: string
}

export interface SponsorOffer {
  id: string
  merchant_name: string
  merchant_pubkey: string
  title: string
  description: string
  offer_type: 'discount' | 'free_item' | 'cashback'
  value_eur: string
  inventory_total: number
  inventory_remaining: number
  redeem_window_sec: number
  valid_from: number
  valid_to: number
  redeem_methods: ('qr' | 'nfc')[]
  terms: string
  location?: LatLng & { address: string }
  rgb_asset_id?: string
}

export interface CouponActivation {
  id: string
  offer_id: string
  player_pubkey: string
  activated_at: number
  expires_at: number
  activation_method: 'nfc_checkpoint' | 'geofence_only'
  rgb_claim_id?: string
  redeemed: boolean
  redeemed_at?: number
}

export interface TeamScore {
  team_id: string
  score: number
  elapsed_time: number
  total_proofs: number
  last_activation: number
  rank?: number
}

export interface LeaderboardEntry {
  team: Team
  score: TeamScore
  members: Array<{
    pubkey: string
    name?: string
    contributions: number
  }>
}

// Nostr event types
export interface NostrEvent {
  id: string
  pubkey: string
  created_at: number
  kind: number
  tags: string[][]
  content: string
  sig: string
}

// App state types
export interface AppState {
  isLoading: boolean
  currentUser?: {
    pubkey: string
    name?: string
    picture?: string
  }
  currentLocation?: LatLng
  selectedRoute?: Route
  selectedTeam?: Team
  selectedChallenge?: Challenge
  notifications: AppNotification[]
}

export interface AppNotification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: number
  read: boolean
  action?: {
    label: string
    handler: () => void
  }
}

// Store types
export interface NostrStore {
  connected: boolean
  relays: string[]
  events: Map<string, NostrEvent>
  subscriptions: Map<string, any>
  connect: () => Promise<void>
  disconnect: () => void
  publishEvent: (event: Partial<NostrEvent>) => Promise<string>
  subscribeToEvents: (filters: any[], onEvent: (event: NostrEvent) => void) => string
  unsubscribe: (subId: string) => void
}

export interface GeolocationStore {
  currentPosition?: GeolocationPosition
  watchId?: string
  hasPermission: boolean
  isTracking: boolean
  requestPermissions: () => Promise<boolean>
  startTracking: () => Promise<void>
  stopTracking: () => void
  getCurrentPosition: () => Promise<GeolocationPosition>
}

// RGB types (interfaces for future implementation)
export interface RGBAsset {
  asset_id: string
  name: string
  ticker: string
  precision: number
  supply: number
  metadata: Record<string, any>
}

export interface RGBTransfer {
  asset_id: string
  amount: number
  recipient: string
  memo?: string
}

export interface RGBBalance {
  asset_id: string
  balance: number
  spendable: number
  pending: number
}

// Utility types
export type EventHandler<T = any> = (data: T) => void
export type AsyncEventHandler<T = any> = (data: T) => Promise<void>

export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  timestamp: number
}