export const DEFAULT_MAP_CENTER = { lat: 52.2297, lng: 21.0122 }
export const DEFAULT_MAP_ZOOM = 6

export const MAP_LOAD_TIMEOUT_MS = 15000

export const MARKER_COLORS = {
  Pickup: '#22c55e',
  Dropoff: '#ef4444',
  Stopover: '#eab308',
  default: '#6b7280',
} as const

export const CARGO_WAYPOINT_COLORS = [
  '#ef4444',
  '#3b82f6',
  '#22c55e',
  '#eab308',
  '#8b5cf6',
  '#f97316',
] as const

export function getMarkerColor(type?: string): string {
  return (MARKER_COLORS[type as keyof typeof MARKER_COLORS] ?? MARKER_COLORS.default)
}

export function getCargoWaypointColor(index: number): string {
  return CARGO_WAYPOINT_COLORS[index % CARGO_WAYPOINT_COLORS.length]
}
