// Shared types for Grounded platform

export interface LatLng {
  lat: number
  lng: number
}

export interface BoundingBox {
  north: number
  south: number
  east: number
  west: number
}

export interface GeofenceResult {
  inside: boolean
  distance: number
  bearing?: number
}

export interface SamplingOptions {
  count: number
  minDistance: number
  seed?: number
  maxTries?: number
}

export interface ProofData {
  timestamp: number
  location: LatLng
  accuracy?: number
  nfc?: {
    tagId: string
    nonce: string
  }
  signature?: string
}