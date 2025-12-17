import type { LatLng, SamplingOptions } from './types'
import { haversineDistance, polylineDistance, pointAtDistance } from './distance'

/**
 * Seeded random number generator (Mulberry32)
 * @param seed Seed value
 * @returns Random number generator function
 */
export function createSeededRNG(seed: number) {
  return function() {
    let t = seed += 0x6D2B79F5
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Sample points along polylines with minimum distance constraints
 * @param polylines Array of polylines to sample from
 * @param options Sampling options
 * @returns Array of sampled points
 */
export function samplePointsAlongPolylines(
  polylines: LatLng[][],
  options: SamplingOptions
): LatLng[] {
  const { count, minDistance, seed = Date.now(), maxTries = count * 200 } = options
  const rng = createSeededRNG(seed)
  
  // Calculate total length and create cumulative distribution
  const polylineData = polylines.map(polyline => ({
    polyline,
    length: polylineDistance(polyline)
  })).filter(data => data.length > 0)
  
  if (polylineData.length === 0) return []
  
  const totalLength = polylineData.reduce((sum, data) => sum + data.length, 0)
  if (totalLength <= 0) return []
  
  // Create cumulative distribution for length-weighted sampling
  const cumulative: Array<{ polyline: LatLng[]; cumulative: number }> = []
  let acc = 0
  
  for (const data of polylineData) {
    acc += data.length / totalLength
    cumulative.push({ polyline: data.polyline, cumulative: acc })
  }
  
  // Sample points with minimum distance constraint
  const sampledPoints: LatLng[] = []
  let tries = 0
  
  while (sampledPoints.length < count && tries < maxTries) {
    tries++
    
    // Pick a polyline based on length weighting
    const r = rng()
    const selectedData = cumulative.find(data => r <= data.cumulative)
    if (!selectedData) continue
    
    const polyline = selectedData.polyline
    const polylineLen = polylineDistance(polyline)
    
    // Pick a random distance along the polyline
    const targetDistance = rng() * polylineLen
    const point = pointAtDistance(polyline, targetDistance)
    if (!point) continue
    
    // Check minimum distance constraint
    let validPoint = true
    for (const existingPoint of sampledPoints) {
      if (haversineDistance(point, existingPoint) < minDistance) {
        validPoint = false
        break
      }
    }
    
    if (validPoint) {
      sampledPoints.push(point)
    }
  }
  
  return sampledPoints
}

/**
 * Sample points along a single polyline at regular intervals
 * @param polyline Polyline to sample from
 * @param interval Interval distance in meters
 * @param includeEndpoints Whether to include start and end points
 * @returns Array of sampled points
 */
export function samplePointsAtInterval(
  polyline: LatLng[],
  interval: number,
  includeEndpoints: boolean = true
): LatLng[] {
  if (polyline.length < 2) return polyline.slice()
  
  const totalLength = polylineDistance(polyline)
  const points: LatLng[] = []
  
  if (includeEndpoints) {
    points.push(polyline[0])
  }
  
  let currentDistance = interval
  while (currentDistance < totalLength) {
    const point = pointAtDistance(polyline, currentDistance)
    if (point) {
      points.push(point)
    }
    currentDistance += interval
  }
  
  if (includeEndpoints && points[points.length - 1] !== polyline[polyline.length - 1]) {
    points.push(polyline[polyline.length - 1])
  }
  
  return points
}

/**
 * Generate evenly spaced points along a polyline
 * @param polyline Polyline to sample from
 * @param count Number of points to generate
 * @param includeEndpoints Whether to include start and end points
 * @returns Array of evenly spaced points
 */
export function generateEvenlySpacedPoints(
  polyline: LatLng[],
  count: number,
  includeEndpoints: boolean = true
): LatLng[] {
  if (polyline.length < 2) return polyline.slice()
  if (count <= 0) return []
  
  const totalLength = polylineDistance(polyline)
  const points: LatLng[] = []
  
  if (includeEndpoints && count >= 2) {
    points.push(polyline[0])
    
    if (count > 2) {
      const interval = totalLength / (count - 1)
      for (let i = 1; i < count - 1; i++) {
        const point = pointAtDistance(polyline, interval * i)
        if (point) {
          points.push(point)
        }
      }
    }
    
    points.push(polyline[polyline.length - 1])
  } else {
    // Don't include endpoints
    const interval = totalLength / (count + 1)
    for (let i = 1; i <= count; i++) {
      const point = pointAtDistance(polyline, interval * i)
      if (point) {
        points.push(point)
      }
    }
  }
  
  return points
}

/**
 * Sample random points within a bounding box with minimum distance constraints
 * @param bounds Bounding box to sample within
 * @param options Sampling options
 * @returns Array of sampled points
 */
export function samplePointsInBounds(
  bounds: { north: number; south: number; east: number; west: number },
  options: SamplingOptions
): LatLng[] {
  const { count, minDistance, seed = Date.now(), maxTries = count * 200 } = options
  const rng = createSeededRNG(seed)
  
  const sampledPoints: LatLng[] = []
  let tries = 0
  
  while (sampledPoints.length < count && tries < maxTries) {
    tries++
    
    // Generate random point within bounds
    const lat = bounds.south + rng() * (bounds.north - bounds.south)
    const lng = bounds.west + rng() * (bounds.east - bounds.west)
    const point: LatLng = { lat, lng }
    
    // Check minimum distance constraint
    let validPoint = true
    for (const existingPoint of sampledPoints) {
      if (haversineDistance(point, existingPoint) < minDistance) {
        validPoint = false
        break
      }
    }
    
    if (validPoint) {
      sampledPoints.push(point)
    }
  }
  
  return sampledPoints
}

/**
 * Cluster points and return representative points
 * @param points Array of points to cluster
 * @param maxDistance Maximum distance for points to be in same cluster
 * @returns Array of cluster representative points
 */
export function clusterPoints(points: LatLng[], maxDistance: number): LatLng[] {
  if (points.length === 0) return []
  
  const clusters: LatLng[][] = []
  const used = new Set<number>()
  
  for (let i = 0; i < points.length; i++) {
    if (used.has(i)) continue
    
    const cluster = [points[i]]
    used.add(i)
    
    // Find all points within maxDistance
    for (let j = i + 1; j < points.length; j++) {
      if (used.has(j)) continue
      
      if (haversineDistance(points[i], points[j]) <= maxDistance) {
        cluster.push(points[j])
        used.add(j)
      }
    }
    
    clusters.push(cluster)
  }
  
  // Return centroid of each cluster
  return clusters.map(cluster => {
    const avgLat = cluster.reduce((sum, p) => sum + p.lat, 0) / cluster.length
    const avgLng = cluster.reduce((sum, p) => sum + p.lng, 0) / cluster.length
    return { lat: avgLat, lng: avgLng }
  })
}

/**
 * Filter points to maintain minimum distance between them
 * @param points Array of points to filter
 * @param minDistance Minimum distance in meters
 * @param priorityFn Optional function to determine point priority (higher = keep)
 * @returns Filtered array of points
 */
export function filterPointsByDistance(
  points: LatLng[],
  minDistance: number,
  priorityFn?: (point: LatLng, index: number) => number
): LatLng[] {
  if (points.length <= 1) return points.slice()
  
  // Sort by priority if provided
  const indexedPoints = points.map((point, index) => ({ point, index, priority: priorityFn?.(point, index) || 0 }))
  if (priorityFn) {
    indexedPoints.sort((a, b) => b.priority - a.priority)
  }
  
  const filteredPoints: LatLng[] = []
  
  for (const { point } of indexedPoints) {
    let tooClose = false
    
    for (const existingPoint of filteredPoints) {
      if (haversineDistance(point, existingPoint) < minDistance) {
        tooClose = true
        break
      }
    }
    
    if (!tooClose) {
      filteredPoints.push(point)
    }
  }
  
  return filteredPoints
}