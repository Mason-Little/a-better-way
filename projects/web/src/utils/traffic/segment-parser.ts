/**
 * Utilities for parsing HERE topology segment references
 */

/**
 * Extract segment ID with direction from any segment reference format
 * Works for both full and compact refs
 *
 * @example
 * extractSegmentId('hrn:here:data::olp-here:rib-2:5447::377893833:here:cm:segment:661789549#-0.58984..1')
 * // Returns: 'here:cm:segment:661789549#-'
 *
 * extractSegmentId('$0::314876232:$1:809153406#+0.8514656272836648..1')
 * // Returns: 'here:cm:segment:809153406#+'
 */
export function extractSegmentId(segmentRef: string): string | null {
  // Match pattern: <optional prefix>:<id>#<direction><optional offset>
  // Works for both full 'here:cm:segment:123#+' and compact '...:123#+' refs
  // We look for digits immediately preceding the '#'
  const match = segmentRef.match(/(?::|^)(\d+)#([+-])/)
  if (!match) return null

  const [, segmentId, direction] = match
  return `here:cm:segment:${segmentId}#${direction}`
}
