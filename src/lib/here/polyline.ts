/**
 * HERE Flexible Polyline Decoder
 * Decodes HERE's flexible polyline format to coordinates
 * Based on: https://github.com/heremaps/flexible-polyline
 */

const DECODING_TABLE = [
  62, -1, -1, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1, -1, 0, 1, 2, 3, 4, 5,
  6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, 63,
  -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48,
  49, 50, 51,
]

function decodeChar(char: string): number {
  const charCode = char.charCodeAt(0)
  return DECODING_TABLE[charCode - 45]!
}

function decodeUnsignedValues(encoded: string): number[] {
  const result: number[] = []
  let shift = 0
  let value = 0

  for (const char of encoded) {
    const decodedChar = decodeChar(char)
    value |= (decodedChar & 0x1f) << shift
    if ((decodedChar & 0x20) === 0) {
      result.push(value)
      value = 0
      shift = 0
    } else {
      shift += 5
    }
  }

  return result
}

function toSigned(value: number): number {
  if (value & 1) {
    return ~(value >> 1)
  }
  return value >> 1
}

export interface DecodedPolyline {
  precision: number
  thirdDimPrecision: number
  thirdDimType: number
  coordinates: Array<{ lat: number; lng: number; alt?: number }>
}

/**
 * Decode a HERE flexible polyline string to coordinates
 */
export function decodeFlexiblePolyline(encoded: string): DecodedPolyline {
  const values = decodeUnsignedValues(encoded)

  // First value contains header
  const header = values[0]!
  const precision = header & 0x0f
  const thirdDimType = (header >> 4) & 0x07
  const thirdDimPrecision = (header >> 7) & 0x0f

  const has3d = thirdDimType !== 0
  const factor = Math.pow(10, precision)
  const factor3d = Math.pow(10, thirdDimPrecision)

  const coordinates: Array<{ lat: number; lng: number; alt?: number }> = []

  let lat = 0
  let lng = 0
  let alt = 0
  let i = 1

  while (i < values.length) {
    lat += toSigned(values[i]!)
    lng += toSigned(values[i + 1]!)

    const coord: { lat: number; lng: number; alt?: number } = {
      lat: lat / factor,
      lng: lng / factor,
    }

    if (has3d) {
      alt += toSigned(values[i + 2]!)
      coord.alt = alt / factor3d
      i += 3
    } else {
      i += 2
    }

    coordinates.push(coord)
  }

  return {
    precision,
    thirdDimPrecision,
    thirdDimType,
    coordinates,
  }
}

/**
 * Simple helper to decode to just coordinates array
 */
export function decodeToCoordinates(encoded: string): Array<{ lat: number; lng: number }> {
  return decodeFlexiblePolyline(encoded).coordinates
}
