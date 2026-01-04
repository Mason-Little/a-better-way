import type { RoutePoint } from '@/entities/'

/**
 * Stop Sign Detector API Client
 * TypeScript client for the Stop Sign Detector API.
 */

interface DetectPayload {
  lat: number
  lon: number
  heading: number
  conf: number
}

interface DetectResponse {
  stop_sign_detected: boolean
}

const BASE_URL = import.meta.env.VITE_VISION_BASE_URL

/**
 * Test the stop sign detection endpoint.
 */
export async function detectStopSign(
  point: RoutePoint,
  heading: number,
  conf: number = 0.25,
): Promise<boolean> {
  const payload: DetectPayload = { lat: point.lat, lon: point.lng, heading, conf }

  console.log(
    `[StopSignRecognition] Testing detection at: ${payload.lat}, ${payload.lon}, heading: ${payload.heading}`,
  )

  try {
    const response = await fetch(`${BASE_URL}/detect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    console.log(`[StopSignRecognition] Detection Status: ${response.status}`)

    if (response.status === 200) {
      const result: DetectResponse = await response.json()
      console.log(`[StopSignRecognition] Stop Sign Detected: ${result.stop_sign_detected}`)
      return result.stop_sign_detected
    } else if (response.status === 404) {
      const errorData = await response.json()
      console.log(`[StopSignRecognition] No panorama found:`, errorData)
      return false
    } else {
      const errorText = await response.text()
      console.error(`[StopSignRecognition] Error: ${errorText}`)
      return false
    }
  } catch (error) {
    console.error(`[StopSignRecognition] Connection error:`, error)
    return false
  }
}
