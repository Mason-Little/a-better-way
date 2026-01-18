import type { InputAvoids, LatLng, Route } from '@/entities'
import { useRoutesStore } from '@/stores/routesStore'
import { useDebugOverlay } from '@/composables/useDebugOverlay'
import { calculateRoute } from '@/lib/here-sdk'
import { formatBBoxes } from '@/utils/geo'
import { findStopSigns } from '@/utils/stopsign'
import { clearTrafficCache, findTrafficSegments, getTrafficBBox } from '@/utils/traffic'

const MAX_ITERATIONS = 5

function getDelay(route: Route): number {
  const s = route.sections[0]?.summary
  if (!s) return 0
  return s.duration - (s.baseDuration ?? s.duration)
}

function pickBest(routes: Route[]): Route | undefined {
  return [...routes].sort((a, b) => getDelay(a) - getDelay(b))[0]
}

async function fetchRoutes(
  origin: LatLng,
  dest: LatLng,
  avoid?: { segments?: string[]; areas?: string[] },
): Promise<Route[]> {
  try {
    const result = await calculateRoute({
      origin,
      destination: dest,
      alternatives: 5,
      avoid,
    })
    return result.routes
  } catch (e) {
    console.error('[BetterWay] Route fetch failed:', e)
    return []
  }
}

/** Find better routes by iteratively avoiding traffic and stop signs */
export async function findBetterRoutes(
  start: LatLng,
  end: LatLng,
  maxExtraTime: number,
  jamThreshold: number,
) {
  const store = useRoutesStore()
  const debug = useDebugOverlay()

  store.clear()
  debug.clearAll()
  clearTrafficCache()

  const initial = await fetchRoutes(start, end)
  if (!initial.length) {
    console.warn('[BetterWay] No initial routes')
    return
  }

  const baseline = pickBest(initial)
  if (!baseline) return

  const maxEta = (baseline.sections[0]?.summary.duration ?? 0) + maxExtraTime
  console.log(
    `[BetterWay] Baseline ETA: ${Math.round((baseline.sections[0]?.summary.duration ?? 0) / 60)}min`,
  )

  // Initial routes have no avoids
  const initialAvoids: InputAvoids = { segments: [], areas: [] }
  store.setRoutes(initial.map((r) => ({ ...r, iteration: 0, inputAvoids: initialAvoids })))

  const state = { current: initial, iteration: 0 }

  while (state.iteration < MAX_ITERATIONS) {
    state.iteration++
    console.log(`[BetterWay] Iteration ${state.iteration}`)

    const [segments, signs] = await Promise.all([
      findTrafficSegments(state.current, jamThreshold),
      findStopSigns(state.current, store.stopSigns),
    ])

    store.addTrafficSegments(segments)
    store.addStopSigns(signs)

    // Debug visualization
    debug.drawTrafficSegments(store.trafficSegments)
    debug.drawStopSigns(store.stopSigns)
    const trafficBBox = getTrafficBBox()
    if (trafficBBox) debug.drawBoundingBox(trafficBBox)

    const avoidInput: InputAvoids = {
      segments: store.getSegmentsToAvoid(250),
      areas: formatBBoxes(store.stopSignBoxes),
    }

    const improved = await fetchRoutes(start, end, {
      segments: avoidInput.segments,
      areas: avoidInput.areas,
    })

    if (!improved.length) {
      console.log('[BetterWay] No improved routes, stopping')
      break
    }

    const best = pickBest(improved)
    const eta = best?.sections[0]?.summary.duration ?? Infinity

    if (eta > maxEta) {
      console.log(`[BetterWay] ETA ${Math.round(eta / 60)}min exceeds max, stopping`)
      break
    }

    const added = store.setRoutes(improved.map((r) => ({
      ...r,
      iteration: state.iteration,
      inputAvoids: avoidInput,
    })))
    if (!added) {
      console.log('[BetterWay] All duplicates, stopping')
      console.log(store.routes)
      break
    }

    state.current = improved
  }

  // Score all routes once at the end
  store.recalculateScores()

  console.log(`[BetterWay] Done: ${state.iteration} iterations, ${store.routes.length} routes`)
}
