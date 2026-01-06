/**
 * HERE Platform Service
 * Singleton that manages the HERE platform instance
 */

import { env } from '@/lib/environment'

let platformInstance: H.service.Platform | null = null

/**
 * Get or create the HERE Platform instance
 * Uses the API key from environment variables
 */
export function getPlatform(): H.service.Platform {
  if (platformInstance) {
    return platformInstance
  }

  const apiKey = env.VITE_HERE_API_KEY

  platformInstance = new H.service.Platform({
    apikey: apiKey,
  })

  return platformInstance
}
