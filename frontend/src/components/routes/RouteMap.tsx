import { memo, useEffect, useRef, useState } from 'react'
import { loadMapsLibrary } from '@/utils/googleMapsLoader'
import type { RouteMapProps } from '@/types/routes'

const DEFAULT_CENTER = { lat: 52.2297, lng: 21.0122 }
const DEFAULT_ZOOM = 6

const PICKUP_COLOR = '#22c55e'
const DROPOFF_COLOR = '#ef4444'
const STOPOVER_COLOR = '#eab308'

function getMarkerColor(type?: string): string {
  switch (type) {
    case 'Pickup':
      return PICKUP_COLOR
    case 'Dropoff':
      return DROPOFF_COLOR
    case 'Stopover':
      return STOPOVER_COLOR
    default:
      return '#6b7280'
  }
}

function RouteMapInner({
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  points = [],
  polyline,
  className = '',
  onMapClick,
}: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const polylineRef = useRef<google.maps.Polyline | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    const timeoutId = setTimeout(() => {
      if (cancelled) return
      setError(
        'Map load timeout. Check: 1) Maps JavaScript API enabled in Google Cloud, 2) HTTP referrers (localhost:3000, 127.0.0.1:3000) added to the key.',
      )
      setLoading(false)
    }, 15000)

    loadMapsLibrary()
      .then(({ Map }) => {
        if (cancelled || !containerRef.current) return

        clearTimeout(timeoutId)

        const map = new Map(containerRef.current, {
          center: { lat: center.lat, lng: center.lng },
          zoom,
          mapTypeControl: true,
          zoomControl: true,
          fullscreenControl: true,
          streetViewControl: false,
        })
        mapRef.current = map
        setMapReady(true)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        clearTimeout(timeoutId)
        const msg = (err as Error)?.message ?? String(err)
        setError(msg)
        setLoading(false)
      })

    return () => {
      cancelled = true
      if (timeoutId !== null) {
        clearTimeout(timeoutId)
      }
    }
  }, [])

  useEffect(() => {
    if (!mapReady || !mapRef.current) return

    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current = []

    points.forEach((point, idx) => {
      const marker = new google.maps.Marker({
        position: { lat: point.lat, lng: point.lng },
        map: mapRef.current!,
        title: point.label ?? `${point.type ?? 'Point'} ${idx + 1}`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: getMarkerColor(point.type),
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
      })
      markersRef.current.push(marker)
    })

    return () => {
      markersRef.current.forEach((m) => m.setMap(null))
      markersRef.current = []
    }
  }, [points, mapReady])

  useEffect(() => {
    if (!mapReady || !mapRef.current) return

    if (polylineRef.current) {
      polylineRef.current.setMap(null)
      polylineRef.current = null
    }

    if (polyline) {
      const decoded = decodePolyline(polyline)
      if (decoded.length >= 2) {
        const line = new google.maps.Polyline({
          path: decoded,
          geodesic: true,
          strokeColor: '#3b82f6',
          strokeOpacity: 1,
          strokeWeight: 4,
          map: mapRef.current,
        })
        polylineRef.current = line
      }
    }

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null)
        polylineRef.current = null
      }
    }
  }, [polyline, mapReady])

  useEffect(() => {
    if (!mapReady || !mapRef.current || !onMapClick) return
    const listener = mapRef.current.addListener(
      'click',
      (e: google.maps.MapMouseEvent) => {
        const latLng = e.latLng
        if (latLng) {
          const lat = typeof latLng.lat === 'function' ? latLng.lat() : latLng.lat
          const lng = typeof latLng.lng === 'function' ? latLng.lng() : latLng.lng
          onMapClick(Number(lat), Number(lng))
        }
      }
    )
    return () => {
      if (listener) google.maps.event.removeListener(listener)
    }
  }, [mapReady, onMapClick])

  if (error) {
    return (
      <div
        className={`flex items-center justify-center rounded-md border border-red-200 bg-red-50 p-4 text-red-700 ${className}`}
      >
        {error}
      </div>
    )
  }

  return (
    <div className={`relative min-h-[400px] w-full ${className}`}>
      <div ref={containerRef} className="absolute inset-0 min-h-[400px] w-full" />
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gray-100">
          <span className="text-gray-500">Loading map...</span>
          <span className="text-xs text-gray-400">
            Loading Google Maps...
          </span>
        </div>
      )}
    </div>
  )
}

function decodePolyline(encoded: string): google.maps.LatLngLiteral[] {
  const points: google.maps.LatLngLiteral[] = []
  let index = 0
  let lat = 0
  let lng = 0

  while (index < encoded.length) {
    let b
    let shift = 0
    let result = 0
    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    const dlat = result & 1 ? ~(result >> 1) : result >> 1
    lat += dlat

    shift = 0
    result = 0
    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    const dlng = result & 1 ? ~(result >> 1) : result >> 1
    lng += dlng

    points.push({ lat: lat / 1e5, lng: lng / 1e5 })
  }

  return points
}

export const RouteMap = memo(RouteMapInner)
