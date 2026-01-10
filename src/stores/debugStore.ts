import { computed, reactive } from 'vue'

import { env } from '@/lib/environment'

/**
 * Debug Features state
 */
interface DebugFeatures {
  showTrafficBoundingBox: boolean
  showTrafficSegments: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────────────────────

const features = reactive<DebugFeatures>({
  showTrafficBoundingBox: true,
  showTrafficSegments: true,
})

// ─────────────────────────────────────────────────────────────────────────────
// Computed
// ─────────────────────────────────────────────────────────────────────────────

const isDev = computed(() => env.VITE_APP_ENV === 'dev')

// ─────────────────────────────────────────────────────────────────────────────
// Composable
// ─────────────────────────────────────────────────────────────────────────────

export function useDebugStore() {
  return {
    isDev,
    features,
  }
}
