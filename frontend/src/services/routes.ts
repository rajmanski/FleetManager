import api from './api'

export type GeocodeResult = {
  address: string
  latitude: number
  longitude: number
}

export type CalculateRequest = {
  origin: { lat: number; lng: number }
  destination: { lat: number; lng: number }
  waypoints?: Array<{ lat: number; lng: number }>
}

export type CalculateResult = {
  distance_km: number
  duration_minutes: number
  polyline: string
}

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const { data } = await api.post<GeocodeResult>('/api/v1/routes/geocode', {
    address,
  })
  return data
}

export async function calculateRoute(
  request: CalculateRequest
): Promise<CalculateResult> {
  const { data } = await api.post<CalculateResult>(
    '/api/v1/routes/calculate',
    request
  )
  return data
}
