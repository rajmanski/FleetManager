export const DEFAULT_MAP_CENTER = { lat: 52.2297, lng: 21.0122 }
export const DEFAULT_MAP_ZOOM = 6

export const MAP_LOAD_TIMEOUT_MS = 15000

export const MARKER_COLORS = {
  Pickup: '#22c55e',
  Dropoff: '#ef4444',
  Stopover: '#eab308',
  default: '#6b7280',
} as const

export function getMarkerColor(type?: string): string {
  return (MARKER_COLORS[type as keyof typeof MARKER_COLORS] ?? MARKER_COLORS.default)
}
