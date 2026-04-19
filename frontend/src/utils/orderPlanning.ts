import { geocodeAddress } from '@/services/routes'
import type { CalculateResult } from '@/services/routes'
import type { PlanOrderWorkflowRequestDTO } from '@/types/operations'
import type { AddressState, WaypointState } from '@/types/routes'
import type { CargoItemDraft } from '@/schemas/cargo'
import type { OrderPlanningFormValues } from '@/schemas/orderPlanning'

function isValidCoord(v: unknown): v is number {
  return typeof v === 'number' && !Number.isNaN(v)
}

function hasCoords(
  a: AddressState,
): a is AddressState & { lat: number; lng: number } {
  return typeof a.lat === 'number' && typeof a.lng === 'number'
}

export async function resolveAddressCoords(
  addr: AddressState,
): Promise<{ lat: number; lng: number }> {
  if (
    hasCoords(addr) &&
    isValidCoord(addr.lat) &&
    isValidCoord(addr.lng)
  ) {
    return { lat: addr.lat, lng: addr.lng }
  }
  const g = await geocodeAddress(addr.address.trim())
  if (!isValidCoord(g.latitude) || !isValidCoord(g.longitude)) {
    throw new Error(
      addr.address.trim()
        ? `Geocoding failed for: ${addr.address}`
        : 'Geocoding returned invalid coordinates',
    )
  }
  return { lat: g.latitude, lng: g.longitude }
}

export function ensureWaypointTempIds(
  waypoints: WaypointState[],
): WaypointState[] {
  return waypoints.map((w) =>
    w.tempId
      ? w
      : { ...w, tempId: globalThis.crypto?.randomUUID?.() ?? `wp-${Date.now()}-${Math.random()}` },
  )
}

export function draftsToPlanCargo(items: CargoItemDraft[]): Array<{
  description: string
  weight_kg: number
  volume_m3: number
  cargo_type: string
  destination_waypoint_temp_id?: string | null
}> {
  const out: Array<{
    description: string
    weight_kg: number
    volume_m3: number
    cargo_type: string
    destination_waypoint_temp_id?: string | null
  }> = []

  for (const item of items) {
    const quantity = parseInt(String(item.quantity), 10)
    const weightPerUnit = parseFloat(String(item.weightPerUnitKg))
    const volumePerUnit = parseFloat(String(item.volumePerUnitM3))
    const qty = quantity
    const totalWeight = qty * weightPerUnit
    const totalVolume = qty * volumePerUnit
    let description = (item.description ?? '').trim()
    if (description && qty > 1) {
      description = `${qty} × ${description}`
    }
    const dest =
      item.destinationWaypointTempId != null &&
      String(item.destinationWaypointTempId).trim() !== ''
        ? String(item.destinationWaypointTempId).trim()
        : null
    out.push({
      description: description || `${qty} items`,
      weight_kg: totalWeight,
      volume_m3: totalVolume,
      cargo_type: item.cargoType,
      ...(dest ? { destination_waypoint_temp_id: dest } : {}),
    })
  }

  return out
}

export function datetimeLocalToRfc3339(local: string): string {
  const d = new Date(local)
  if (Number.isNaN(d.getTime())) {
    throw new Error('Invalid trip start time')
  }
  return d.toISOString()
}

export type BuildPlanPayloadError =
  | { kind: 'message'; message: string }
  | { kind: 'route'; message: string }

export async function buildPlanOrderWorkflowRequestDTO(
  values: OrderPlanningFormValues,
  origin: AddressState,
  destination: AddressState,
  waypoints: WaypointState[],
  result: CalculateResult | null,
): Promise<
  | { ok: true; payload: PlanOrderWorkflowRequestDTO }
  | { ok: false; error: BuildPlanPayloadError }
> {
  if (!origin.address.trim() || !destination.address.trim()) {
    return {
      ok: false,
      error: { kind: 'route', message: 'Load and drop-off addresses are required.' },
    }
  }

  if (waypoints.length < 1) {
    return {
      ok: false,
      error: {
        kind: 'route',
        message:
          'Add at least one intermediate waypoint between load and drop-off (required for integrated planning).',
      },
    }
  }

  if (!result) {
    return {
      ok: false,
      error: {
        kind: 'route',
        message: 'Calculate the route before submitting the workflow.',
      },
    }
  }

  const withIds = ensureWaypointTempIds(waypoints)

  const planWaypoints: PlanOrderWorkflowRequestDTO['route']['waypoints'] = []
  for (let i = 0; i < withIds.length; i++) {
    const wp = withIds[i]
    const tempId = wp.tempId?.trim()
    if (!tempId) {
      return {
        ok: false,
        error: { kind: 'message', message: 'Waypoint temp_id is missing.' },
      }
    }
    const c = await resolveAddressCoords(wp)
    planWaypoints.push({
      temp_id: tempId,
      sequence_order: i + 1,
      address: wp.address.trim(),
      latitude: c.lat,
      longitude: c.lng,
      action_type: wp.actionType,
    })
  }

  const priceRaw = values.totalPricePln?.trim()
  let totalPricePln: number | null | undefined
  if (priceRaw && Number.isFinite(parseFloat(priceRaw))) {
    totalPricePln = parseFloat(priceRaw)
  }

  const deadlineRaw = values.deliveryDeadline?.trim()
  const deliveryDeadline =
    deadlineRaw && deadlineRaw !== '' ? deadlineRaw : null

  const cargo = draftsToPlanCargo(values.cargo as CargoItemDraft[])

  const payload: PlanOrderWorkflowRequestDTO = {
    order: {
      client_id: values.clientId,
      order_number: values.orderNumber.trim(),
      delivery_deadline: deliveryDeadline,
      total_price_pln: totalPricePln ?? null,
    },
    cargo,
    route: {
      start_location: origin.address.trim(),
      end_location: destination.address.trim(),
      planned_distance_km: result.distance_km,
      estimated_time_min: Math.round(result.duration_minutes),
      waypoints: planWaypoints,
    },
    trip: {
      vehicle_id: parseInt(values.vehicleId, 10),
      driver_id: parseInt(values.driverId, 10),
      start_time: datetimeLocalToRfc3339(values.startTime),
    },
  }

  return { ok: true, payload }
}
