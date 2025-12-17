import type { LatLng, GeofenceResult } from './types'

/**
 * Calculate distance between two points using Haversine formula
 * @param pos1 First position
 * @param pos2 Second position
 * @returns Distance in meters
 */
export function haversineDistance(pos1: LatLng, pos2: LatLng): number {
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

/**
 * Calculate bearing from pos1 to pos2
 * @param pos1 Starting position
 * @param pos2 End position
 * @returns Bearing in degrees (0-360)
 */
export function calculateBearing(pos1: LatLng, pos2: LatLng): number {
  const dLng = toRadians(pos2.lng - pos1.lng)
  const lat1 = toRadians(pos1.lat)
  const lat2 = toRadians(pos2.lat)

  const y = Math.sin(dLng) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)

  const bearing = Math.atan2(y, x)
  return (toDegrees(bearing) + 360) % 360
}

/**
 * Check if a point is within a geofence (circular)
 * @param point Point to check
 * @param center Center of geofence
 * @param radius Radius in meters
 * @returns Geofence result with inside status and distance
 */
export function checkGeofence(point: LatLng, center: LatLng, radius: number): GeofenceResult {
  const distance = haversineDistance(point, center)
  const inside = distance <= radius
  const bearing = inside ? undefined : calculateBearing(center, point)

  return {
    inside,
    distance,
    bearing
  }
}

/**
 * Calculate total distance of a polyline
 * @param polyline Array of points
 * @returns Total distance in meters
 */
export function polylineDistance(polyline: LatLng[]): number {
  if (polyline.length < 2) return 0
  
  let totalDistance = 0
  for (let i = 1; i < polyline.length; i++) {
    totalDistance += haversineDistance(polyline[i - 1], polyline[i])
  }
  return totalDistance
}

/**
 * Interpolate a point at a specific distance along a polyline
 * @param polyline Array of points
 * @param targetDistance Distance along the line in meters
 * @returns Interpolated point or null if distance exceeds polyline length
 */
export function pointAtDistance(polyline: LatLng[], targetDistance: number): LatLng | null {
  if (polyline.length < 2) return null
  
  let accumulatedDistance = 0
  
  for (let i = 1; i < polyline.length; i++) {
    const segmentDistance = haversineDistance(polyline[i - 1], polyline[i])
    
    if (accumulatedDistance + segmentDistance >= targetDistance) {
      const ratio = (targetDistance - accumulatedDistance) / segmentDistance
      return {
        lat: polyline[i - 1].lat + (polyline[i].lat - polyline[i - 1].lat) * ratio,
        lng: polyline[i - 1].lng + (polyline[i].lng - polyline[i - 1].lng) * ratio
      }
    }
    
    accumulatedDistance += segmentDistance
  }
  
  return null
}

/**
 * Find the closest point on a polyline to a given point
 * @param point Point to find closest to
 * @param polyline Array of points forming the line
 * @returns Closest point on the polyline
 */
export function closestPointOnPolyline(point: LatLng, polyline: LatLng[]): LatLng | null {
  if (polyline.length === 0) return null
  if (polyline.length === 1) return polyline[0]
  
  let closestPoint = polyline[0]
  let minDistance = haversineDistance(point, polyline[0])
  
  for (let i = 1; i < polyline.length; i++) {
    const segmentClosest = closestPointOnSegment(point, polyline[i - 1], polyline[i])
    const distance = haversineDistance(point, segmentClosest)
    
    if (distance < minDistance) {
      minDistance = distance
      closestPoint = segmentClosest
    }
  }
  
  return closestPoint
}

/**
 * Find the closest point on a line segment to a given point
 * @param point Point to find closest to
 * @param segmentStart Start of line segment
 * @param segmentEnd End of line segment
 * @returns Closest point on the segment
 */
export function closestPointOnSegment(point: LatLng, segmentStart: LatLng, segmentEnd: LatLng): LatLng {
  const A = point.lat - segmentStart.lat
  const B = point.lng - segmentStart.lng
  const C = segmentEnd.lat - segmentStart.lat
  const D = segmentEnd.lng - segmentStart.lng

  const dot = A * C + B * D
  const lenSq = C * C + D * D
  
  if (lenSq === 0) return segmentStart // Segment is a point
  
  let param = dot / lenSq
  
  if (param < 0) {
    return segmentStart
  } else if (param > 1) {
    return segmentEnd
  } else {
    return {
      lat: segmentStart.lat + param * C,
      lng: segmentStart.lng + param * D
    }
  }
}

// Helper functions
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

function toDegrees(radians: number): number {
  return radians * (180 / Math.PI)
}