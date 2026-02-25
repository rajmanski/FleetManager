import { importLibrary, setOptions } from '@googlemaps/js-api-loader'

let optionsSet = false
let mapsPromise: Promise<{ Map: typeof google.maps.Map }> | null = null
let placesPromise: Promise<unknown> | null = null

function ensureOptions() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  if (!apiKey) throw new Error('Google Maps API key is not configured')
  if (!optionsSet) {
    setOptions({ key: apiKey, v: 'weekly' })
    optionsSet = true
  }
  return apiKey
}

export function initGoogleMapsOptions(): string {
  return ensureOptions()
}

export function loadMapsLibrary(): Promise<{ Map: typeof google.maps.Map }> {
  ensureOptions()
  if (!mapsPromise) {
    mapsPromise = importLibrary('maps') as Promise<{ Map: typeof google.maps.Map }>
  }
  return mapsPromise
}

export function loadPlacesLibrary(): Promise<unknown> {
  ensureOptions()
  if (!placesPromise) {
    placesPromise = importLibrary('places')
  }
  return placesPromise
}
