import type { LatLng, BoundingBox, SamplingOptions } from '@grounded/core'
import { samplePointsAlongPolylines } from '@grounded/core'
import { buildPisteQuery, fetchOverpassData, extractPolylines, getPisteDifficulty } from './overpass'

export interface PisteInfo {
  id: string
  name: string
  type: 'downhill' | 'nordic' | 'ski' | 'unknown'
  difficulty: 'novice' | 'easy' | 'intermediate' | 'advanced' | 'expert' | 'unknown'
  polyline: LatLng[]
  length: number
  tags: Record<string, string>
}

/**
 * Fetch ski pistes from OpenStreetMap
 * @param bounds Bounding box to search within
 * @param pisteTypes Types of pistes to include
 * @returns Promise resolving to array of piste information
 */
export async function fetchPistes(
  bounds: BoundingBox,
  pisteTypes: string[] = ['downhill', 'nordic']
): Promise<PisteInfo[]> {
  const query = buildPisteQuery(bounds, pisteTypes)
  const response = await fetchOverpassData(query)
  const polylines = extractPolylines(response)
  
  return polylines
    .filter(polyline => polyline.polyline.length >= 2)
    .map(polyline => {
      const pisteType = polyline.tags['piste:type'] as PisteInfo['type'] || 'unknown'
      const difficulty = getPisteDifficulty(polyline.tags)
      const name = polyline.tags.name || polyline.tags['piste:name'] || `Piste ${polyline.id}`
      
      // Calculate length (simplified)
      const length = calculatePolylineLength(polyline.polyline)
      
      return {
        id: polyline.id,
        name,
        type: pisteType,
        difficulty,
        polyline: polyline.polyline,
        length,
        tags: polyline.tags
      }
    })
}

/**
 * Auto-place checkpoints on ski pistes
 * @param bounds Bounding box to search within
 * @param options Sampling options
 * @returns Promise resolving to array of checkpoint positions
 */
export async function autoPlaceCheckpointsOnPistes(
  bounds: BoundingBox,
  options: SamplingOptions
): Promise<Array<{
  position: LatLng
  pisteId: string
  pisteName: string
  difficulty: string
}>> {
  const pistes = await fetchPistes(bounds)
  
  if (pistes.length === 0) {
    throw new Error('No pistes found in the specified area')
  }
  
  // Filter pistes by minimum length (e.g., at least 100m)
  const validPistes = pistes.filter(piste => piste.length >= 100)
  
  if (validPistes.length === 0) {
    throw new Error('No suitable pistes found (minimum length requirement not met)')
  }
  
  // Extract polylines for sampling
  const polylines = validPistes.map(piste => piste.polyline)
  
  // Sample points along pistes
  const sampledPoints = samplePointsAlongPolylines(polylines, options)
  
  // Match points back to pistes
  const checkpoints = sampledPoints.map((point: LatLng) => {
    // Find the closest piste to this point
    let closestPiste = validPistes[0]
    let minDistance = Infinity
    
    for (const piste of validPistes) {
      const distance = getDistanceToPolyline(point, piste.polyline)
      if (distance < minDistance) {
        minDistance = distance
        closestPiste = piste
      }
    }
    
    return {
      position: point,
      pisteId: closestPiste.id,
      pisteName: closestPiste.name,
      difficulty: closestPiste.difficulty
    }
  })
  
  return checkpoints
}

/**
 * Filter pistes by difficulty
 * @param pistes Array of pistes
 * @param difficulties Allowed difficulties
 * @returns Filtered pistes
 */
export function filterPistesByDifficulty(
  pistes: PisteInfo[],
  difficulties: PisteInfo['difficulty'][]
): PisteInfo[] {
  return pistes.filter(piste => difficulties.includes(piste.difficulty))
}

/**
 * Filter pistes by type
 * @param pistes Array of pistes
 * @param types Allowed types
 * @returns Filtered pistes
 */
export function filterPistesByType(
  pistes: PisteInfo[],
  types: PisteInfo['type'][]
): PisteInfo[] {
  return pistes.filter(piste => types.includes(piste.type))
}

/**
 * Filter pistes by minimum length
 * @param pistes Array of pistes
 * @param minLength Minimum length in meters
 * @returns Filtered pistes
 */
export function filterPistesByLength(
  pistes: PisteInfo[],
  minLength: number
): PisteInfo[] {
  return pistes.filter(piste => piste.length >= minLength)
}

/**
 * Group pistes by difficulty
 * @param pistes Array of pistes
 * @returns Pistes grouped by difficulty
 */
export function groupPistesByDifficulty(
  pistes: PisteInfo[]
): Record<PisteInfo['difficulty'], PisteInfo[]> {
  const groups: Record<PisteInfo['difficulty'], PisteInfo[]> = {
    novice: [],
    easy: [],
    intermediate: [],
    advanced: [],
    expert: [],
    unknown: []
  }
  
  for (const piste of pistes) {
    groups[piste.difficulty].push(piste)
  }
  
  return groups
}

/**
 * Find pistes near a point
 * @param point Center point
 * @param pistes Array of pistes
 * @param maxDistance Maximum distance in meters
 * @returns Nearby pistes with distances
 */
export function findNearbyPistes(
  point: LatLng,
  pistes: PisteInfo[],
  maxDistance: number
): Array<PisteInfo & { distance: number }> {
  const nearby: Array<PisteInfo & { distance: number }> = []
  
  for (const piste of pistes) {
    const distance = getDistanceToPolyline(point, piste.polyline)
    if (distance <= maxDistance) {
      nearby.push({ ...piste, distance })
    }
  }
  
  // Sort by distance
  nearby.sort((a, b) => a.distance - b.distance)
  
  return nearby
}

/**
 * Get piste statistics
 * @param pistes Array of pistes
 * @returns Statistics about the pistes
 */
export function getPisteStatistics(pistes: PisteInfo[]): {
  totalCount: number
  totalLength: number
  averageLength: number
  byDifficulty: Record<PisteInfo['difficulty'], number>
  byType: Record<PisteInfo['type'], number>
  longestPiste: PisteInfo | null
  shortestPiste: PisteInfo | null
} {
  if (pistes.length === 0) {
    return {
      totalCount: 0,
      totalLength: 0,
      averageLength: 0,
      byDifficulty: { novice: 0, easy: 0, intermediate: 0, advanced: 0, expert: 0, unknown: 0 },
      byType: { downhill: 0, nordic: 0, ski: 0, unknown: 0 },
      longestPiste: null,
      shortestPiste: null
    }
  }
  
  const totalLength = pistes.reduce((sum, piste) => sum + piste.length, 0)
  const averageLength = totalLength / pistes.length
  
  const byDifficulty: Record<PisteInfo['difficulty'], number> = {
    novice: 0, easy: 0, intermediate: 0, advanced: 0, expert: 0, unknown: 0
  }
  const byType: Record<PisteInfo['type'], number> = {
    downhill: 0, nordic: 0, ski: 0, unknown: 0
  }
  
  let longestPiste = pistes[0]
  let shortestPiste = pistes[0]
  
  for (const piste of pistes) {
    byDifficulty[piste.difficulty]++
    byType[piste.type]++
    
    if (piste.length > longestPiste.length) {
      longestPiste = piste
    }
    if (piste.length < shortestPiste.length) {
      shortestPiste = piste
    }
  }
  
  return {
    totalCount: pistes.length,
    totalLength,
    averageLength,
    byDifficulty,
    byType,
    longestPiste,
    shortestPiste
  }
}

// Helper functions

/**
 * Calculate the length of a polyline using Haversine formula
 * @param polyline Array of points
 * @returns Length in meters
 */
function calculatePolylineLength(polyline: LatLng[]): number {
  if (polyline.length < 2) return 0
  
  let totalLength = 0
  for (let i = 1; i < polyline.length; i++) {
    totalLength += haversineDistance(polyline[i - 1], polyline[i])
  }
  return totalLength
}

/**
 * Calculate distance from a point to the closest point on a polyline
 * @param point Point to measure from
 * @param polyline Polyline to measure to
 * @returns Distance in meters
 */
function getDistanceToPolyline(point: LatLng, polyline: LatLng[]): number {
  if (polyline.length === 0) return Infinity
  if (polyline.length === 1) return haversineDistance(point, polyline[0])
  
  let minDistance = Infinity
  
  for (let i = 1; i < polyline.length; i++) {
    const segmentDistance = getDistanceToSegment(point, polyline[i - 1], polyline[i])
    minDistance = Math.min(minDistance, segmentDistance)
  }
  
  return minDistance
}

/**
 * Calculate distance from a point to a line segment
 * @param point Point to measure from
 * @param segmentStart Start of line segment
 * @param segmentEnd End of line segment
 * @returns Distance in meters
 */
function getDistanceToSegment(point: LatLng, segmentStart: LatLng, segmentEnd: LatLng): number {
  const A = point.lat - segmentStart.lat
  const B = point.lng - segmentStart.lng
  const C = segmentEnd.lat - segmentStart.lat
  const D = segmentEnd.lng - segmentStart.lng

  const dot = A * C + B * D
  const lenSq = C * C + D * D
  
  if (lenSq === 0) return haversineDistance(point, segmentStart)
  
  let param = dot / lenSq
  
  let closestPoint: LatLng
  if (param < 0) {
    closestPoint = segmentStart
  } else if (param > 1) {
    closestPoint = segmentEnd
  } else {
    closestPoint = {
      lat: segmentStart.lat + param * C,
      lng: segmentStart.lng + param * D
    }
  }
  
  return haversineDistance(point, closestPoint)
}

/**
 * Haversine distance calculation
 * @param pos1 First position
 * @param pos2 Second position
 * @returns Distance in meters
 */
function haversineDistance(pos1: LatLng, pos2: LatLng): number {
  const R = 6371000 // Earth's radius in meters
  const dLat = toRadians(pos2.lat - pos1.lat)
  const dLng = toRadians(pos2.lng - pos1.lng)
  const lat1 = toRadians(pos1.lat)
  const lat2 = toRadians(pos2.lat)

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}