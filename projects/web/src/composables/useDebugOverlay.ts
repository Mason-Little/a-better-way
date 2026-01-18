import { ref, shallowRef, watch } from 'vue'

import type { BBox, StopSign, TrafficSegment } from '@/entities'
import { DebugOverlay, type DebugConfig } from '@/lib/debug'

const overlay = shallowRef<DebugOverlay | null>(null)
const enabled = ref(import.meta.env.DEV)
const config = ref<DebugConfig>({
  showTrafficSegments: true,
  showStopSigns: true,
  showBoundingBox: true,
})

/** Composable for debug visualization overlay */
export function useDebugOverlay() {
  /** Initialize debug overlay with a map instance */
  function init(map: H.Map) {
    if (overlay.value) overlay.value.dispose()
    overlay.value = new DebugOverlay(map, config.value)
  }

  /** Dispose debug overlay */
  function dispose() {
    overlay.value?.dispose()
    overlay.value = null
  }

  /** Draw traffic segments */
  function drawTrafficSegments(segments: TrafficSegment[]) {
    if (!enabled.value) return
    overlay.value?.drawTrafficSegments(segments)
  }

  /** Draw stop signs */
  function drawStopSigns(signs: StopSign[]) {
    if (!enabled.value) return
    overlay.value?.drawStopSigns(signs)
  }

  /** Draw bounding box */
  function drawBoundingBox(bbox: BBox) {
    if (!enabled.value) return
    overlay.value?.drawBoundingBox(bbox)
  }

  /** Clear all visualizations */
  function clearAll() {
    overlay.value?.clearAll()
  }

  /** Toggle debug mode */
  function toggle() {
    enabled.value = !enabled.value
    if (!enabled.value) clearAll()
  }

  watch(config, (c) => overlay.value?.setConfig(c), { deep: true })

  return {
    enabled,
    config,
    init,
    dispose,
    drawTrafficSegments,
    drawStopSigns,
    drawBoundingBox,
    clearAll,
    toggle,
  }
}
