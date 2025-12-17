import type { LatLng } from '@grounded/core'

export interface RouteOptions {
  profile: 'foot-walking' | 'foot-hiking' | 'cycling-regular' | 'driving-car'
  avoid_features?: string[]
  avoid_polygons?: LatLng[][]
  alternative_routes?: {
    target_count: number
    weight_factor: number
  }
}

export interface RouteResponse {
  routes: Route[]
  bbox: [number, number, number, number]
  info: {
    attribution: string
    service: string
    timestamp: number
    query: any
    engine: any
  }
}

export interface Route {
  summary: {
    distance: number
    duration: number
  }
  geometry: LatLng[]
  way_points: number[]
  legs: RouteLeg[]
  warnings?: RouteWarning[]
  extras?: Record<string, any>
}

export interface RouteLeg {
  distance: number
  duration: number
  steps: RouteStep[]
}

export interface RouteStep {
  distance: number
  duration: number
  type: number
  instruction: string
  name: string
  way_points: [number, number]
}

export interface RouteWarning {
  code: number
  message: string
}

/**
 * OpenRouteService client for routing
 */
export class OpenRouteServiceClient {
  private apiKey: string
  private baseUrl: string

  constructor(apiKey: string, baseUrl: string = 'https://api.openrouteservice.org') {
    this.apiKey = apiKey
    this.baseUrl = baseUrl
  }

  /**
   * Get route between waypoints
   * @param coordinates Array of waypoints [lng, lat]
   * @param options Route options
   * @returns Promise resolving to route response
   */
  async getRoute(
    coordinates: [number, number][],
    options: RouteOptions = { profile: 'foot-walking' }
  ): Promise<RouteResponse> {
    const url = `${this.baseUrl}/v2/directions/${options.profile}/geojson`
    
    const body = {
      coordinates,
      ...options
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      throw new Error(`OpenRouteService error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    // Convert GeoJSON coordinates to LatLng
    const geoData = data as any
    return {
      ...geoData,
      routes: geoData.features.map((feature: any) => ({
        ...feature.properties,
        geometry: feature.geometry.coordinates.map(([lng, lat]: [number, number]) => ({ lat, lng }))
      }))
    }
  }

  /**
   * Get isochrone (reachable area within time/distance)
   * @param location Center point [lng, lat]
   * @param range Range in seconds or meters
   * @param options Isochrone options
   * @returns Promise resolving to isochrone polygon
   */
  async getIsochrone(
    location: [number, number],
    range: number[],
    options: {
      profile: RouteOptions['profile']
      range_type?: 'time' | 'distance'
      interval?: number
    } = { profile: 'foot-walking', range_type: 'time' }
  ): Promise<{
    type: 'FeatureCollection'
    features: Array<{
      type: 'Feature'
      properties: {
        value: number
        center: [number, number]
      }
      geometry: {
        type: 'Polygon'
        coordinates: [number, number][][]
      }
    }>
  }> {
    const url = `${this.baseUrl}/v2/isochrones/${options.profile}`
    
    const body = {
      locations: [location],
      range,
      range_type: options.range_type || 'time',
      interval: options.interval
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      throw new Error(`OpenRouteService error: ${response.status} ${response.statusText}`)
    }

    return response.json() as any
  }
}

/**
 * Simple OSRM client for self-hosted routing
 */
export class OSRMClient {
  private baseUrl: string

  constructor(baseUrl: string = 'http://localhost:5000') {
    this.baseUrl = baseUrl
  }

  /**
   * Get route using OSRM
   * @param coordinates Array of waypoints [lng, lat]
   * @param profile Profile (foot, bike, car)
   * @returns Promise resolving to route
   */
  async getRoute(
    coordinates: [number, number][],
    profile: 'foot' | 'bike' | 'car' = 'foot'
  ): Promise<{
    routes: Array<{
      distance: number
      duration: number
      geometry: LatLng[]
      legs: Array<{
        distance: number
        duration: number
        steps: Array<{
          distance: number
          duration: number
          geometry: LatLng[]
          name: string
          mode: string
          maneuver: {
            type: string
            location: [number, number]
          }
        }>
      }>
    }>
    waypoints: Array<{
      location: [number, number]
      name: string
    }>
  }> {
    const coordString = coordinates.map(coord => coord.join(',')).join(';')
    const url = `${this.baseUrl}/route/v1/${profile}/${coordString}?overview=full&geometries=geojson&steps=true`

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`OSRM error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    // Convert GeoJSON coordinates to LatLng
    const routeData = data as any
    return {
      ...routeData,
      routes: routeData.routes.map((route: any) => ({
        ...route,
        geometry: route.geometry.coordinates.map(([lng, lat]: [number, number]) => ({ lat, lng })),
        legs: route.legs.map((leg: any) => ({
          ...leg,
          steps: leg.steps.map((step: any) => ({
            ...step,
            geometry: step.geometry.coordinates.map(([lng, lat]: [number, number]) => ({ lat, lng }))
          }))
        }))
      }))
    }
  }

  /**
   * Get table of distances/durations between points
   * @param coordinates Array of waypoints [lng, lat]
   * @param profile Profile (foot, bike, car)
   * @returns Promise resolving to distance/duration matrix
   */
  async getTable(
    coordinates: [number, number][],
    profile: 'foot' | 'bike' | 'car' = 'foot'
  ): Promise<{
    durations: number[][]
    distances: number[][]
    sources: Array<{ location: [number, number] }>
    destinations: Array<{ location: [number, number] }>
  }> {
    const coordString = coordinates.map(coord => coord.join(',')).join(';')
    const url = `${this.baseUrl}/table/v1/${profile}/${coordString}`

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`OSRM error: ${response.status} ${response.statusText}`)
    }

    return response.json() as any
  }
}

/**
 * Snap points to nearest road/path
 * @param points Points to snap
 * @param client Routing client
 * @param profile Routing profile
 * @returns Promise resolving to snapped points
 */
export async function snapToRoads(
  points: LatLng[],
  client: OSRMClient,
  profile: 'foot' | 'bike' | 'car' = 'foot'
): Promise<LatLng[]> {
  const coordinates: [number, number][] = points.map(p => [p.lng, p.lat])
  
  try {
    const result = await client.getRoute(coordinates, profile)
    if (result.waypoints && result.waypoints.length > 0) {
      return result.waypoints.map(wp => ({
        lat: wp.location[1],
        lng: wp.location[0]
      }))
    }
  } catch (error) {
    console.warn('Failed to snap to roads:', error)
  }
  
  // Return original points if snapping fails
  return points
}

/**
 * Calculate route from waypoints with road snapping
 * @param waypoints Array of waypoints
 * @param client Routing client
 * @param profile Routing profile
 * @returns Promise resolving to route geometry
 */
export async function calculateRoute(
  waypoints: LatLng[],
  client: OSRMClient,
  profile: 'foot' | 'bike' | 'car' = 'foot'
): Promise<{
  geometry: LatLng[]
  distance: number
  duration: number
  snappedWaypoints: LatLng[]
}> {
  const coordinates: [number, number][] = waypoints.map(p => [p.lng, p.lat])
  
  const result = await client.getRoute(coordinates, profile)
  
  if (!result.routes || result.routes.length === 0) {
    throw new Error('No route found')
  }
  
  const route = result.routes[0]
  const snappedWaypoints = result.waypoints.map(wp => ({
    lat: wp.location[1],
    lng: wp.location[0]
  }))
  
  return {
    geometry: route.geometry,
    distance: route.distance,
    duration: route.duration,
    snappedWaypoints
  }
}