/**
 * Utilities for parsing HERE topology segment references
 */

/**
 * Parse compact segment reference using refReplacements
 * Expands $0, $1, etc. placeholders to full values
 *
 * @example
 * expandSegmentRef('$0:377894504:$1:87964630#-0.77..0.99', {
 *   '0': 'hrn:here:data::olp-here:rib-2:5447:',
 *   '1': 'here:cm:segment'
 * })
 * // Returns: 'hrn:here:data::olp-here:rib-2:5447::377894504:here:cm:segment:87964630#-0.77..0.99'
 */
export function expandSegmentRef(
  compactRef: string,
  refReplacements?: Record<string, string>,
): string {
  if (!refReplacements) return compactRef

  let expandedRef = compactRef
  // Replace $0, $1, etc. with actual values from refReplacements
  for (const [key, value] of Object.entries(refReplacements)) {
    expandedRef = expandedRef.replace(new RegExp(`\\$${key}:`, 'g'), `${value}:`)
  }

  return expandedRef
}

/**
 * Extract segment ID with direction from full segment reference
 *
 * @example
 * extractSegmentId('hrn:here:data::olp-here:rib-2:5447::377893833:here:cm:segment:661789549#-0.58984..1')
 * // Returns: 'here:cm:segment:661789549#-'
 *
 * extractSegmentId('hrn:here:data::olp-here:rib-2:5447::377893833:here:cm:segment:661789549#+0..1')
 * // Returns: 'here:cm:segment:661789549#+'
 */
export function extractSegmentId(segmentRef: string): string | null {
  // Match pattern: here:cm:segment:<id>#<direction><optional offset>
  const match = segmentRef.match(/here:cm:segment:(\d+)#([+-])/)
  if (!match) return null

  const [, segmentId, direction] = match
  return `here:cm:segment:${segmentId}#${direction}`
}
