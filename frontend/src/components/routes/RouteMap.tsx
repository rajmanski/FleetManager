import { decode } from '@googlemaps/polyline-codec'
import { memo, useEffect, useRef, useState } from 'react'
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  MAP_LOAD_TIMEOUT_MS,
  getMarkerColor,
} from '@/constants/mapConfig'
import { loadMapsLibrary } from '@/utils/googleMapsLoader'
import type { RouteMapProps } from '@/types/routes'

function RouteMapInner({
  center = DEFAULT_MAP_CENTER,
  zoom = DEFAULT_MAP_ZOOM,
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
    }, MAP_LOAD_TIMEOUT_MS)

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
      const decoded = decode(polyline, 5).map(([lat, lng]) => ({ lat, lng }))
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

export const RouteMap = memo(RouteMapInner)
