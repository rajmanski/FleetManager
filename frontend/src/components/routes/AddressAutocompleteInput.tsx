import { useCallback, useEffect, useRef, useState } from 'react'
import { FormField } from '@/components/ui/FormField'
import { INPUT_CLASS } from '@/constants/inputStyles'
import { loadPlacesLibrary } from '@/utils/googleMapsLoader'
import { geocodeAddress } from '@/services/routes'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'
import type { AddressWithCoords } from '@/types/routes'

const DEBOUNCE_MS = 350
const MIN_INPUT_LENGTH = 3

type AddressAutocompleteInputProps = {
  label: string
  placeholder?: string
  value?: string
  onSelect: (selection: AddressWithCoords) => void
  onAddressChange?: (address: string) => void
  error?: string
  required?: boolean
  disabled?: boolean
}

export function AddressAutocompleteInput({
  label,
  placeholder = 'Enter address...',
  value,
  onSelect,
  onAddressChange,
  error,
  required,
  disabled,
}: AddressAutocompleteInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const onSelectRef = useRef(onSelect)

  useEffect(() => {
    onSelectRef.current = onSelect
  }, [onSelect])

  const [inputValue, setInputValue] = useState(() => value ?? '')
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [placesReady, setPlacesReady] = useState(false)
  const [inputError, setInputError] = useState<string | null>(null)
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null)
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null)

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  useEffect(() => {
    if (value !== undefined) {
      setInputValue(value)
    }
  }, [value])

  useEffect(() => {
    if (!apiKey) {
      setInputError('Google Maps API key is not configured')
      return
    }

    let cancelled = false
    loadPlacesLibrary()
      .then(() => {
        if (cancelled) return
        autocompleteServiceRef.current = new google.maps.places.AutocompleteService()
        const dummyDiv = document.createElement('div')
        placesServiceRef.current = new google.maps.places.PlacesService(dummyDiv)
        setPlacesReady(true)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setInputError((err as Error)?.message ?? 'Failed to load Places')
      })

    return () => {
      cancelled = true
    }
  }, [apiKey])

  const fetchPredictions = useCallback((input: string) => {
    const service = autocompleteServiceRef.current
    if (!service || !input.trim() || input.trim().length < MIN_INPUT_LENGTH) {
      setPredictions([])
      setShowDropdown(false)
      return
    }

    setLoading(true)
    service.getPlacePredictions(
      {
        input: input.trim(),
        types: ['address'],
      },
      (results, status) => {
        setLoading(false)
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          setPredictions(results)
          setShowDropdown(results.length > 0)
        } else {
          setPredictions([])
          setShowDropdown(false)
        }
      }
    )
  }, [])

  const debouncedFetch = useDebouncedCallback(fetchPredictions, DEBOUNCE_MS)

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value
      setInputValue(v)
      onAddressChange?.(v)
      setInputError(null)
      debouncedFetch(v)
      if (v.length < MIN_INPUT_LENGTH) {
        setPredictions([])
        setShowDropdown(false)
      }
    },
    [debouncedFetch, onAddressChange]
  )

  const selectPlace = useCallback(
    (prediction: google.maps.places.AutocompletePrediction) => {
      const placeId = prediction.place_id
      const desc = prediction.description
      setInputValue(desc)
      onAddressChange?.(desc)
      setPredictions([])
      setShowDropdown(false)
      setInputError(null)

      const places = placesServiceRef.current
      if (!places) return

      places.getDetails(
        {
          placeId,
          fields: ['formatted_address', 'geometry'],
        },
        (place, status) => {
          if (status !== google.maps.places.PlacesServiceStatus.OK || !place) {
            geocodeAddress(desc)
              .then((res) =>
                onSelectRef.current({
                  address: res.address,
                  lat: res.latitude,
                  lng: res.longitude,
                })
              )
              .catch(() =>
                setInputError('Could not determine coordinates for this address')
              )
            return
          }

          const addr = place.formatted_address ?? desc
          const lat = place.geometry?.location?.lat()
          const lng = place.geometry?.location?.lng()

          if (lat != null && lng != null) {
            onSelectRef.current({ address: addr, lat, lng })
          } else {
            geocodeAddress(addr)
              .then((res) =>
                onSelectRef.current({
                  address: res.address,
                  lat: res.latitude,
                  lng: res.longitude,
                })
              )
              .catch(() =>
                setInputError('Could not determine coordinates for this address')
              )
          }
        }
      )
    },
    []
  )

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const displayError = error ?? inputError

  return (
    <FormField label={label} error={displayError ?? undefined} required={required}>
      <div ref={containerRef} className="relative">
        <input
          ref={inputRef}
          type="text"
          className={INPUT_CLASS}
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => predictions.length > 0 && setShowDropdown(true)}
          disabled={disabled || !placesReady}
          autoComplete="off"
          aria-invalid={!!displayError}
          aria-expanded={showDropdown}
          aria-autocomplete="list"
        />
        {showDropdown && predictions.length > 0 && (
          <ul
            className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg"
            role="listbox"
          >
            {predictions.map((p) => (
              <li
                key={p.place_id}
                role="option"
                className="cursor-pointer px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onMouseDown={() => selectPlace(p)}
              >
                {p.description}
              </li>
            ))}
          </ul>
        )}
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
            Searching...
          </span>
        )}
      </div>
    </FormField>
  )
}
