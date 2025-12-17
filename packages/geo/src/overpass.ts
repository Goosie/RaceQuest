import type { LatLng, BoundingBox } from '@grounded/core'

export interface OverpassWay {
  id: number
  type: 'way'
  nodes: number[]
  tags: Record<string, string>
  geometry?: LatLng[]
}

export interface OverpassRelation {
  id: number
  type: 'relation'
  members: Array<{
    type: 'way' | 'node' | 'relation'
    ref: number
    role: string
  }>
  tags: Record<string, string>
}

export interface OverpassResponse {
  version: number
  generator: string
  elements: (OverpassWay | OverpassRelation)[]
}

/**
 * Build Overpass QL query for ski pistes
 * @param bounds Bounding box
 * @param pisteTypes Types of pistes to include
 * @returns Overpass QL query string
 */
export function buildPisteQuery(
  bounds: BoundingBox,
  pisteTypes: string[] = ['downhill', 'nordic', 'ski']
): string {
  const bbox = `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`
  const pisteFilter = pisteTypes.map(type => `"${type}"`).join('|')
  
  return `
[out:json][timeout:25];
(
  // Ways directly tagged as piste
  way["piste:type"~"^(${pisteFilter})$"](${bbox});
  // Route relations for pistes
  relation["route"="piste"]["piste:type"~"^(${pisteFilter})$"](${bbox});
  // Legacy ski route tagging
  relation["route"="ski"](${bbox});
);
// Get geometry for ways and relations
out body geom;
>;
out skel qt;
  `.trim()
}

/**
 * Build Overpass QL query for walking/hiking paths
 * @param bounds Bounding box
 * @param pathTypes Types of paths to include
 * @returns Overpass QL query string
 */
export function buildPathQuery(
  bounds: BoundingBox,
  pathTypes: string[] = ['footway', 'path', 'track', 'cycleway']
): string {
  const bbox = `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`
  const pathFilter = pathTypes.map(type => `"${type}"`).join('|')
  
  return `
[out:json][timeout:25];
(
  // Walking and hiking paths
  way["highway"~"^(${pathFilter})$"](${bbox});
  // Designated hiking routes
  relation["route"="hiking"](${bbox});
  relation["route"="foot"](${bbox});
);
out body geom;
>;
out skel qt;
  `.trim()
}

/**
 * Build Overpass QL query for cycling paths
 * @param bounds Bounding box
 * @returns Overpass QL query string
 */
export function buildCyclingQuery(bounds: BoundingBox): string {
  const bbox = `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`
  
  return `
[out:json][timeout:25];
(
  // Cycling infrastructure
  way["highway"~"^(cycleway|path)$"](${bbox});
  way["highway"]["bicycle"="yes"](${bbox});
  // Cycling routes
  relation["route"="bicycle"](${bbox});
  relation["route"="mtb"](${bbox});
);
out body geom;
>;
out skel qt;
  `.trim()
}

/**
 * Fetch data from Overpass API
 * @param query Overpass QL query
 * @param endpoint Overpass API endpoint
 * @returns Promise resolving to Overpass response
 */
export async function fetchOverpassData(
  query: string,
  endpoint: string = 'https://overpass-api.de/api/interpreter'
): Promise<OverpassResponse> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `data=${encodeURIComponent(query)}`
  })
  
  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.status} ${response.statusText}`)
  }
  
  return response.json() as Promise<OverpassResponse>
}

/**
 * Extract polylines from Overpass response
 * @param response Overpass API response
 * @returns Array of polylines with metadata
 */
export function extractPolylines(response: OverpassResponse): Array<{
  id: string
  polyline: LatLng[]
  tags: Record<string, string>
  type: 'way' | 'relation'
}> {
  const polylines: Array<{
    id: string
    polyline: LatLng[]
    tags: Record<string, string>
    type: 'way' | 'relation'
  }> = []
  
  for (const element of response.elements) {
    if (element.type === 'way' && element.geometry) {
      polylines.push({
        id: `way-${element.id}`,
        polyline: element.geometry,
        tags: element.tags,
        type: 'way'
      })
    } else if (element.type === 'relation') {
      // For relations, we'd need to resolve member ways
      // This is simplified - in practice you'd need to collect member ways
      polylines.push({
        id: `relation-${element.id}`,
        polyline: [], // Would need to be constructed from members
        tags: element.tags,
        type: 'relation'
      })
    }
  }
  
  return polylines
}

/**
 * Filter polylines by tags
 * @param polylines Array of polylines
 * @param filters Tag filters
 * @returns Filtered polylines
 */
export function filterPolylinesByTags(
  polylines: Array<{
    id: string
    polyline: LatLng[]
    tags: Record<string, string>
    type: 'way' | 'relation'
  }>,
  filters: Record<string, string | string[]>
): typeof polylines {
  return polylines.filter(polyline => {
    for (const [key, value] of Object.entries(filters)) {
      const tagValue = polyline.tags[key]
      if (!tagValue) return false
      
      if (Array.isArray(value)) {
        if (!value.includes(tagValue)) return false
      } else {
        if (tagValue !== value) return false
      }
    }
    return true
  })
}

/**
 * Get piste difficulty from tags
 * @param tags OSM tags
 * @returns Difficulty level
 */
export function getPisteDifficulty(tags: Record<string, string>): 'novice' | 'easy' | 'intermediate' | 'advanced' | 'expert' | 'unknown' {
  const difficulty = tags['piste:difficulty']
  
  switch (difficulty) {
    case 'novice':
    case 'green':
      return 'novice'
    case 'easy':
    case 'blue':
      return 'easy'
    case 'intermediate':
    case 'red':
      return 'intermediate'
    case 'advanced':
    case 'black':
      return 'advanced'
    case 'expert':
    case 'double_black':
      return 'expert'
    default:
      return 'unknown'
  }
}

/**
 * Get path surface type from tags
 * @param tags OSM tags
 * @returns Surface type
 */
export function getPathSurface(tags: Record<string, string>): string {
  return tags.surface || tags.tracktype || 'unknown'
}

/**
 * Check if path is suitable for activity
 * @param tags OSM tags
 * @param activity Activity type
 * @returns Whether path is suitable
 */
export function isPathSuitableFor(tags: Record<string, string>, activity: 'walking' | 'cycling' | 'skiing'): boolean {
  switch (activity) {
    case 'walking':
      return ['footway', 'path', 'track', 'steps'].includes(tags.highway) ||
             tags.foot === 'yes' ||
             (tags.foot !== 'no' && tags.foot !== undefined)
    
    case 'cycling':
      return ['cycleway', 'path', 'track'].includes(tags.highway) ||
             tags.bicycle === 'yes' ||
             (!!tags.highway && tags.bicycle !== 'no')
    
    case 'skiing':
      return tags['piste:type'] !== undefined ||
             tags.route === 'ski' ||
             tags.route === 'piste'
    
    default:
      return false
  }
}

/**
 * Create bounding box from center point and radius
 * @param center Center point
 * @param radiusKm Radius in kilometers
 * @returns Bounding box
 */
export function createBoundingBox(center: LatLng, radiusKm: number): BoundingBox {
  // Rough approximation: 1 degree ≈ 111 km
  const latDelta = radiusKm / 111
  const lngDelta = radiusKm / (111 * Math.cos(center.lat * Math.PI / 180))
  
  return {
    north: center.lat + latDelta,
    south: center.lat - latDelta,
    east: center.lng + lngDelta,
    west: center.lng - lngDelta
  }
}