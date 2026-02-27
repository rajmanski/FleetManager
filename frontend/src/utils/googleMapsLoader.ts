import { importLibrary, setOptions } from '@googlemaps/js-api-loader'

let optionsSet = false
let mapsPromise: Promise<{ Map: typeof google.maps.Map }> | null = null
let placesPromise: Promise<unknown> | null = null
let geocoderPromise: Promise<google.maps.Geocoder> | null = null

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

export function loadGeocoder(): Promise<google.maps.Geocoder> {
  ensureOptions()
  if (!geocoderPromise) {
    geocoderPromise = importLibrary('geocoding').then(
      (lib: { Geocoder: new () => google.maps.Geocoder }) => new lib.Geocoder()
    )
  }
  return geocoderPromise
}

export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<{ address: string } | null> {
  const geocoder = await loadGeocoder()
  return new Promise((resolve) => {
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status !== 'OK' || !results?.[0]) {
        resolve(null)
        return
      }
      resolve({ address: results[0].formatted_address })
    })
  })
}
