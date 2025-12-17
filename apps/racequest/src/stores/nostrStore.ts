import { create } from 'zustand'
import { SimplePool, Event, Filter } from 'nostr-tools'
import type { NostrStore, NostrEvent } from '../types'

// Default Grounded relays
const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.snort.social',
  'wss://relay.nostr.band'
]

interface NostrStoreImpl extends NostrStore {
  pool: SimplePool | null
  privateKey: string | null
  publicKey: string | null
  
  // Actions
  generateKeys: () => void
  setKeys: (privateKey: string) => void
  publishEvent: (event: Partial<NostrEvent>) => Promise<string>
  subscribeToEvents: (filters: Filter[], onEvent: (event: NostrEvent) => void) => string
  unsubscribe: (subId: string) => void
  getEvents: (filters: Filter[]) => Promise<NostrEvent[]>
  
  // Route events
  publishRoute: (route: any) => Promise<string>
  publishCheckpoints: (routeId: string, checkpoints: any[]) => Promise<string>
  publishChallenge: (challenge: any) => Promise<string>
  publishTeam: (team: any) => Promise<string>
  publishProof: (proof: any) => Promise<string>
  
  // Queries
  getRoute: (routeId: string, authorPubkey: string) => Promise<any>
  getTeamMembers: (teamId: string) => Promise<any[]>
  getChallengeLeaderboard: (challengeId: string) => Promise<any[]>
}

export const useNostrStore = create<NostrStoreImpl>((set, get) => ({
  connected: false,
  relays: DEFAULT_RELAYS,
  events: new Map(),
  subscriptions: new Map(),
  pool: null,
  privateKey: null,
  publicKey: null,

  connect: async () => {
    try {
      const pool = new SimplePool()
      set({ pool })
      
      // Test connection to relays
      await pool.get(DEFAULT_RELAYS, { kinds: [1], limit: 1 })
      
      set({ connected: true })
      console.log('Connected to Nostr relays')
    } catch (error) {
      console.error('Failed to connect to Nostr:', error)
      set({ connected: false })
    }
  },

  disconnect: () => {
    const { pool, subscriptions } = get()
    
    // Close all subscriptions
    subscriptions.forEach((sub) => {
      if (sub && typeof sub.unsub === 'function') {
        sub.unsub()
      }
    })
    
    // Close pool
    if (pool) {
      pool.close(DEFAULT_RELAYS)
    }
    
    set({ 
      connected: false, 
      pool: null, 
      subscriptions: new Map(),
      events: new Map()
    })
  },

  generateKeys: () => {
    const privateKey = crypto.randomUUID() // Simplified for now
    const publicKey = privateKey.slice(0, 32) // Simplified for now
    
    set({ privateKey, publicKey })
    
    // Store in localStorage for persistence
    localStorage.setItem('grounded-nostr-private-key', privateKey)
  },

  setKeys: (privateKey: string) => {
    try {
      const publicKey = privateKey.slice(0, 32) // Simplified for now
      set({ privateKey, publicKey })
      localStorage.setItem('grounded-nostr-private-key', privateKey)
    } catch (error) {
      console.error('Invalid private key:', error)
    }
  },

  publishEvent: async (eventData: Partial<NostrEvent>) => {
    const { pool, privateKey, relays } = get()
    
    if (!pool || !privateKey) {
      throw new Error('Not connected or no private key')
    }

    try {
      // Create and sign event
      const event = {
        kind: eventData.kind || 1,
        created_at: Math.floor(Date.now() / 1000),
        tags: eventData.tags || [],
        content: eventData.content || '',
        pubkey: privateKey.slice(0, 32) // Simplified for now
      } as Event

      // Sign event (simplified - in real implementation use nostr-tools signing)
      const signedEvent = event as NostrEvent
      
      // Publish to relays
      await Promise.allSettled(
        pool.publish(relays, signedEvent)
      )
      
      // Store locally
      set(state => ({
        events: new Map(state.events).set(signedEvent.id, signedEvent)
      }))
      
      return signedEvent.id
    } catch (error) {
      console.error('Failed to publish event:', error)
      throw error
    }
  },

  subscribeToEvents: (filters: Filter[]) => {
    const { pool, relays } = get()
    
    if (!pool) {
      throw new Error('Not connected')
    }

    const subId = crypto.randomUUID()
    
    const sub = pool.subscribeMany(relays, filters[0] || {}, {
      onevent: (event: Event) => {
        const nostrEvent = event as NostrEvent
        set(state => {
          const newEvents = new Map(state.events)
          newEvents.set(nostrEvent.id, nostrEvent)
          return { events: newEvents }
        })
      }
    })
    
    // Event handling is done in subscribeMany callback above
    
    // Store subscription
    set(state => ({
      subscriptions: new Map(state.subscriptions).set(subId, sub)
    }))
    
    return subId
  },

  unsubscribe: (subId: string) => {
    const { subscriptions } = get()
    const sub = subscriptions.get(subId)
    
    if (sub && typeof sub.unsub === 'function') {
      sub.unsub()
    }
    
    set(state => {
      const newSubs = new Map(state.subscriptions)
      newSubs.delete(subId)
      return { subscriptions: newSubs }
    })
  },

  getEvents: async (filters: Filter[]) => {
    const { pool, relays } = get()
    
    if (!pool) {
      throw new Error('Not connected')
    }

    const events = await pool.querySync(relays, filters[0] || {})
    return events as NostrEvent[]
  },

  // Grounded-specific event publishers
  publishRoute: async (route: any) => {
    return get().publishEvent({
      kind: 30880, // Route Definition
      tags: [
        ['d', `route:${route.id}`],
        ['t', 'grounded'],
        ['t', 'racequest'],
        ['title', route.name],
        ...(route.price_msat ? [['price_msat', route.price_msat.toString()]] : [])
      ],
      content: JSON.stringify({
        schema: 'grounded.route.v1',
        name: route.name,
        description: route.description,
        mode: route.mode,
        polyline_geojson: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: route.polyline.map((p: any) => [p.lng, p.lat])
          }
        },
        distance_m: route.distance_m,
        elevation_gain_m: route.elevation_gain_m,
        difficulty: route.difficulty,
        checkpoint_set_a: `30881:${get().publicKey}:route:${route.id}:checkpoints`,
        created_by: get().publicKey,
        version: 1
      })
    })
  },

  publishCheckpoints: async (routeId: string, checkpoints: any[]) => {
    return get().publishEvent({
      kind: 30881, // Checkpoint Set
      tags: [
        ['d', `route:${routeId}:checkpoints`],
        ['t', 'grounded'],
        ['a', `30880:${get().publicKey}:route:${routeId}`]
      ],
      content: JSON.stringify({
        schema: 'grounded.checkpoints.v1',
        route_id: routeId,
        version: 1,
        checkpoints: checkpoints.map(cp => ({
          cid: cp.id,
          lat: cp.lat,
          lng: cp.lng,
          radius_m: cp.radius_m,
          name: cp.name,
          description: cp.description,
          actions: cp.actions
        }))
      })
    })
  },

  publishChallenge: async (challenge: any) => {
    return get().publishEvent({
      kind: 30882, // Challenge
      tags: [
        ['d', `challenge:${challenge.id}`],
        ['t', 'grounded'],
        ['t', 'race'],
        ['title', challenge.name],
        ['a', `30880:${challenge.route_creator_pubkey}:route:${challenge.route_id}`],
        ['starts', challenge.start_time.toString()],
        ['ends', challenge.end_time.toString()]
      ],
      content: JSON.stringify({
        schema: 'grounded.challenge.v1',
        name: challenge.name,
        description: challenge.description,
        route_a: `30880:${challenge.route_creator_pubkey}:route:${challenge.route_id}`,
        start: challenge.start_time,
        end: challenge.end_time,
        scoring: challenge.rules,
        team_max_size: challenge.team_max_size,
        team_min_size: challenge.team_min_size,
        entry_fee_msat: challenge.entry_fee_msat,
        prize_pool_msat: challenge.prize_pool_msat,
        created_by: get().publicKey,
        version: 1
      })
    })
  },

  publishTeam: async (team: any) => {
    return get().publishEvent({
      kind: 30883, // Team Definition
      tags: [
        ['d', `team:${team.challenge_id}:${team.id}`],
        ['t', 'grounded'],
        ['a', `30882:${team.challenge_creator_pubkey}:challenge:${team.challenge_id}`],
        ['p', get().publicKey!]
      ],
      content: JSON.stringify({
        schema: 'grounded.team.v1',
        challenge_a: `30882:${team.challenge_creator_pubkey}:challenge:${team.challenge_id}`,
        team_id: team.id,
        name: team.name,
        captain: get().publicKey,
        max_members: team.max_members,
        invite_code: team.invite_code,
        created_at: Math.floor(Date.now() / 1000),
        version: 1
      })
    })
  },

  publishProof: async (proof: any) => {
    return get().publishEvent({
      kind: 20880, // IWasHere Proof
      tags: [
        ['a', `30882:${proof.challenge_creator_pubkey}:challenge:${proof.challenge_id}`],
        ['a', `30880:${proof.route_creator_pubkey}:route:${proof.route_id}`],
        ...(proof.team_id ? [['a', `30883:${proof.team_captain_pubkey}:team:${proof.challenge_id}:${proof.team_id}`]] : []),
        ['checkpoint', proof.checkpoint_id],
        ['method', 'geofence'],
        ...(proof.nfc ? [['method', 'nfc']] : []),
        ['state', proof.state]
      ],
      content: JSON.stringify({
        schema: 'grounded.proof.v1',
        checkpoint_id: proof.checkpoint_id,
        state: proof.state,
        timestamp: proof.timestamp,
        geofence: proof.geofence,
        nfc: proof.nfc,
        device: proof.device_info,
        proof_hash: proof.proof_hash,
        version: 1
      })
    })
  },

  // Grounded-specific queries
  getRoute: async (routeId: string, authorPubkey: string) => {
    const events = await get().getEvents([
      {
        kinds: [30880, 30881],
        authors: [authorPubkey],
        '#d': [`route:${routeId}`, `route:${routeId}:checkpoints`]
      }
    ])
    
    const routeEvent = events.find(e => e.kind === 30880)
    const checkpointsEvent = events.find(e => e.kind === 30881)
    
    if (!routeEvent) return null
    
    const routeData = JSON.parse(routeEvent.content)
    const checkpointsData = checkpointsEvent ? JSON.parse(checkpointsEvent.content) : null
    
    return {
      ...routeData,
      checkpoints: checkpointsData?.checkpoints || []
    }
  },

  getTeamMembers: async (teamId: string) => {
    const events = await get().getEvents([
      {
        kinds: [20881], // Team Join
        '#a': [teamId]
      }
    ])
    
    return events.map(e => JSON.parse(e.content))
  },

  getChallengeLeaderboard: async (challengeId: string) => {
    const events = await get().getEvents([
      {
        kinds: [20880], // IWasHere Proof
        '#a': [challengeId]
      }
    ])
    
    // Process events to calculate scores
    // This is a simplified version - real implementation would be more complex
    const teamScores = new Map()
    
    events.forEach(event => {
      const proof = JSON.parse(event.content)
      if (proof.state === 'active') {
        // Extract team from tags
        const teamTag = event.tags.find(t => t[0] === 'a' && t[1].includes('team:'))
        if (teamTag) {
          const teamId = teamTag[1]
          const current = teamScores.get(teamId) || { score: 0, checkpoints: new Set() }
          current.checkpoints.add(proof.checkpoint_id)
          current.score = current.checkpoints.size
          teamScores.set(teamId, current)
        }
      }
    })
    
    return Array.from(teamScores.entries()).map(([teamId, data]) => ({
      team_id: teamId,
      score: data.score,
      total_proofs: data.checkpoints.size
    }))
  }
}))

// Initialize keys from localStorage on app start
const storedPrivateKey = localStorage.getItem('grounded-nostr-private-key')
if (storedPrivateKey) {
  useNostrStore.getState().setKeys(storedPrivateKey)
} else {
  useNostrStore.getState().generateKeys()
}