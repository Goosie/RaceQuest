import type { LatLng, BoundingBox } from '@grounded/core'

export interface TileProvider {
  name: string
  url: string
  attribution: string
  maxZoom: number
  minZoom?: number
  subdomains?: string[]
  tileSize?: number
}

/**
 * Standard tile providers for Grounded
 */
export const TILE_PROVIDERS: Record<string, TileProvider> = {
  openstreetmap: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    subdomains: ['a', 'b', 'c']
  },
  
  opentopomaps: {
    name: 'OpenTopoMap',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
    maxZoom: 17,
    subdomains: ['a', 'b', 'c']
  },
  
  cyclosm: {
    name: 'CyclOSM',
    url: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
    attribution: '<a href="https://github.com/cyclosm/cyclosm-cartocss-style/releases" title="CyclOSM - Open Bicycle render">CyclOSM</a> | Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 20,
    subdomains: ['a', 'b', 'c']
  },
  
  humanitarian: {
    name: 'Humanitarian',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a> hosted by <a href="https://openstreetmap.fr/" target="_blank">OpenStreetMap France</a>',
    maxZoom: 20,
    subdomains: ['a', 'b', 'c']
  }
}

/**
 * Convert lat/lng to tile coordinates
 * @param lat Latitude
 * @param lng Longitude
 * @param zoom Zoom level
 * @returns Tile coordinates {x, y, z}
 */
export function latLngToTile(lat: number, lng: number, zoom: number): { x: number; y: number; z: number } {
  const n = Math.pow(2, zoom)
  const x = Math.floor((lng + 180) / 360 * n)
  const y = Math.floor((1 - Math.asinh(Math.tan(lat * Math.PI / 180)) / Math.PI) / 2 * n)
  
  return { x, y, z: zoom }
}

/**
 * Convert tile coordinates to lat/lng bounds
 * @param x Tile X coordinate
 * @param y Tile Y coordinate
 * @param zoom Zoom level
 * @returns Bounding box of the tile
 */
export function tileToBounds(x: number, y: number, zoom: number): BoundingBox {
  const n = Math.pow(2, zoom)
  const west = x / n * 360 - 180
  const east = (x + 1) / n * 360 - 180
  const north = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n))) * 180 / Math.PI
  const south = Math.atan(Math.sinh(Math.PI * (1 - 2 * (y + 1) / n))) * 180 / Math.PI
  
  return { north, south, east, west }
}

/**
 * Get all tiles within a bounding box at a given zoom level
 * @param bounds Bounding box
 * @param zoom Zoom level
 * @returns Array of tile coordinates
 */
export function getTilesInBounds(bounds: BoundingBox, zoom: number): Array<{ x: number; y: number; z: number }> {
  const topLeft = latLngToTile(bounds.north, bounds.west, zoom)
  const bottomRight = latLngToTile(bounds.south, bounds.east, zoom)
  
  const tiles: Array<{ x: number; y: number; z: number }> = []
  
  for (let x = topLeft.x; x <= bottomRight.x; x++) {
    for (let y = topLeft.y; y <= bottomRight.y; y++) {
      tiles.push({ x, y, z: zoom })
    }
  }
  
  return tiles
}

/**
 * Generate tile URL from template
 * @param template URL template with {x}, {y}, {z}, {s} placeholders
 * @param x Tile X coordinate
 * @param y Tile Y coordinate
 * @param z Zoom level
 * @param subdomains Available subdomains
 * @returns Tile URL
 */
export function generateTileUrl(
  template: string,
  x: number,
  y: number,
  z: number,
  subdomains: string[] = ['a', 'b', 'c']
): string {
  const subdomain = subdomains[Math.abs(x + y) % subdomains.length]
  
  return template
    .replace('{x}', x.toString())
    .replace('{y}', y.toString())
    .replace('{z}', z.toString())
    .replace('{s}', subdomain)
}

/**
 * Calculate optimal zoom level for a bounding box
 * @param bounds Bounding box
 * @param mapWidth Map width in pixels
 * @param mapHeight Map height in pixels
 * @param tileSize Tile size in pixels (default 256)
 * @returns Optimal zoom level
 */
export function calculateOptimalZoom(
  bounds: BoundingBox,
  mapWidth: number,
  mapHeight: number,
  tileSize: number = 256
): number {
  const latDiff = bounds.north - bounds.south
  const lngDiff = bounds.east - bounds.west
  
  // Calculate zoom based on latitude span
  const latZoom = Math.floor(Math.log2(360 / latDiff * mapHeight / tileSize))
  
  // Calculate zoom based on longitude span
  const lngZoom = Math.floor(Math.log2(360 / lngDiff * mapWidth / tileSize))
  
  // Return the more restrictive (lower) zoom level
  return Math.max(0, Math.min(latZoom, lngZoom, 18))
}

/**
 * Estimate tile download size for caching
 * @param bounds Bounding box
 * @param minZoom Minimum zoom level
 * @param maxZoom Maximum zoom level
 * @param avgTileSize Average tile size in bytes (default 20KB)
 * @returns Estimated total size in bytes
 */
export function estimateTileSize(
  bounds: BoundingBox,
  minZoom: number,
  maxZoom: number,
  avgTileSize: number = 20 * 1024
): { totalTiles: number; totalSize: number; sizeByZoom: Record<number, { tiles: number; size: number }> } {
  let totalTiles = 0
  let totalSize = 0
  const sizeByZoom: Record<number, { tiles: number; size: number }> = {}
  
  for (let zoom = minZoom; zoom <= maxZoom; zoom++) {
    const tiles = getTilesInBounds(bounds, zoom)
    const tileCount = tiles.length
    const zoomSize = tileCount * avgTileSize
    
    totalTiles += tileCount
    totalSize += zoomSize
    sizeByZoom[zoom] = { tiles: tileCount, size: zoomSize }
  }
  
  return { totalTiles, totalSize, sizeByZoom }
}

/**
 * Create a tile cache key
 * @param provider Provider name
 * @param x Tile X coordinate
 * @param y Tile Y coordinate
 * @param z Zoom level
 * @returns Cache key string
 */
export function createTileCacheKey(provider: string, x: number, y: number, z: number): string {
  return `tile:${provider}:${z}:${x}:${y}`
}

/**
 * Check if a point is within tile bounds
 * @param point Point to check
 * @param x Tile X coordinate
 * @param y Tile Y coordinate
 * @param zoom Zoom level
 * @returns Whether point is within tile
 */
export function isPointInTile(point: LatLng, x: number, y: number, zoom: number): boolean {
  const bounds = tileToBounds(x, y, zoom)
  return point.lat >= bounds.south && 
         point.lat <= bounds.north && 
         point.lng >= bounds.west && 
         point.lng <= bounds.east
}

/**
 * Get neighboring tiles
 * @param x Tile X coordinate
 * @param y Tile Y coordinate
 * @param zoom Zoom level
 * @param radius Radius in tiles (default 1)
 * @returns Array of neighboring tile coordinates
 */
export function getNeighboringTiles(
  x: number, 
  y: number, 
  zoom: number, 
  radius: number = 1
): Array<{ x: number; y: number; z: number }> {
  const tiles: Array<{ x: number; y: number; z: number }> = []
  const maxTile = Math.pow(2, zoom) - 1
  
  for (let dx = -radius; dx <= radius; dx++) {
    for (let dy = -radius; dy <= radius; dy++) {
      const newX = x + dx
      const newY = y + dy
      
      // Check bounds
      if (newX >= 0 && newX <= maxTile && newY >= 0 && newY <= maxTile) {
        tiles.push({ x: newX, y: newY, z: zoom })
      }
    }
  }
  
  return tiles
}