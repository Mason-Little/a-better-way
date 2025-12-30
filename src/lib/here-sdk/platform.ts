/**
 * HERE Platform Service
 * Singleton that manages the HERE platform instance
 */



let platformInstance: H.service.Platform | null = null

/**
 * Get or create the HERE Platform instance
 * Uses the API key from environment variables
 */
export function getPlatform(): H.service.Platform {
  if (platformInstance) {
    return platformInstance
  }

  const apiKey = import.meta.env.VITE_HERE_API_KEY

  if (!apiKey) {
    throw new Error(
      'HERE API key not found. Please set VITE_HERE_API_KEY in your .env file.'
    )
  }

  platformInstance = new H.service.Platform({
    apikey: apiKey,
  })

  return platformInstance
}

/**
 * Reset the platform instance (useful for testing or re-initialization)
 */
export function resetPlatform(): void {
  platformInstance = null
}
