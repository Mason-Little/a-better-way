
import type { Route } from '@/entities'

/**
 * Extract segment ID with direction from a HERE segment reference string.
 * Handles both long (hrn:...) and short formats.
 */
export function parseSegmentRef(ref: string): string | null {
  // Matches <digits>#<+ or ->
  const match = ref.match(/(?::|^)(\d+)#([+-])/)
  if (!match) return null

  const [, id, dir] = match
  return `here:cm:segment:${id}#${dir}`
}

/**
 * Extract all unique segment IDs (with direction) from a Route object.
 * Traverses all sections and spans to find segment references.
 */
export function extractRouteSegmentIds(route: Route): Set<string> {
  const ids = new Set<string>()

  for (const section of route.sections) {
    if (!section.spans) continue

    for (const span of section.spans) {
      const refs = span.segmentRef
      if (!refs) continue

      const refArray = Array.isArray(refs) ? refs : [refs]
      for (const ref of refArray) {
        const parsed = parseSegmentRef(ref)
        if (parsed) {
          ids.add(parsed)
        }
      }
    }
  }

  return ids
}
