import { memo, useEffect, useRef, useState } from 'react'
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  MAP_LOAD_TIMEOUT_MS,
  getCargoWaypointColor,
} from '@/constants/mapConfig'
import { loadMapsLibrary } from '@/utils/googleMapsLoader'
import type { WaypointOption } from '@/hooks/orders/useOrderWaypoints'
import type { Cargo } from '@/hooks/cargo/useCargo'

type CargoWaypointMapProps = {
  waypoints: WaypointOption[]
  cargo: Cargo[]
  className?: string
}

function CargoWaypointMapInner({
  waypoints,
  cargo,
  className = '',
}: CargoWaypointMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const dropoffWaypoints = waypoints.filter(
    (w) => w.actionType === 'Dropoff' || w.actionType === 'Stopover'
  )
  const pointsWithCoords = dropoffWaypoints.filter(
    (w) => typeof w.latitude === 'number' && typeof w.longitude === 'number'
  )

  useEffect(() => {
    let cancelled = false
    const timeoutId = setTimeout(() => {
      if (cancelled) return
      setError('Map load timeout.')
      setLoading(false)
    }, MAP_LOAD_TIMEOUT_MS)

    loadMapsLibrary()
      .then(({ Map }) => {
        if (cancelled || !containerRef.current) return
        clearTimeout(timeoutId)

        const center =
          pointsWithCoords.length > 0
            ? {
                lat: pointsWithCoords[0].latitude!,
                lng: pointsWithCoords[0].longitude!,
              }
            : DEFAULT_MAP_CENTER

        const map = new Map(containerRef.current, {
          center: { lat: center.lat, lng: center.lng },
          zoom: pointsWithCoords.length > 0 ? 10 : DEFAULT_MAP_ZOOM,
          mapTypeControl: true,
          zoomControl: true,
        })
        mapRef.current = map
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        clearTimeout(timeoutId)
        setError((err as Error)?.message ?? String(err))
        setLoading(false)
      })

    return () => {
      cancelled = true
      if (timeoutId != null) clearTimeout(timeoutId)
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current) return

    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current = []

    const waypointIdToCargoIndex = new Map<number, number>()
    cargo.forEach((c, idx) => {
      if (c.destinationWaypointId != null) {
        waypointIdToCargoIndex.set(c.destinationWaypointId, idx)
      }
    })

    pointsWithCoords.forEach((wp) => {
      const cargoIndex = waypointIdToCargoIndex.get(wp.id)
      const color =
        cargoIndex !== undefined
          ? getCargoWaypointColor(cargoIndex)
          : '#9ca3af'

      const marker = new google.maps.Marker({
        position: { lat: wp.latitude!, lng: wp.longitude! },
        map: mapRef.current!,
        title: wp.address,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: color,
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
  }, [pointsWithCoords, cargo])

  if (error) {
    return (
      <div
        className={`flex items-center justify-center rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-800 ${className}`}
      >
        {error}
      </div>
    )
  }

  if (pointsWithCoords.length === 0) {
    return (
      <div
        className={`flex items-center justify-center rounded-md border border-gray-200 bg-gray-50 p-4 text-gray-500 ${className}`}
      >
        No waypoints with coordinates to display on map.
      </div>
    )
  }

  return (
    <div className={`relative min-h-[300px] w-full ${className}`}>
      <div ref={containerRef} className="absolute inset-0 min-h-[300px] w-full" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <span className="text-gray-500">Loading map...</span>
        </div>
      )}
      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        {cargo.map((c, idx) =>
          c.destinationWaypointId != null ? (
            <span
              key={c.id}
              className="inline-flex items-center gap-1 rounded px-2 py-0.5"
              style={{
                backgroundColor: `${getCargoWaypointColor(idx)}20`,
                color: getCargoWaypointColor(idx),
              }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: getCargoWaypointColor(idx) }}
              />
              Cargo #{c.id} → waypoint
            </span>
          ) : null
        )}
      </div>
    </div>
  )
}

export const CargoWaypointMap = memo(CargoWaypointMapInner)
