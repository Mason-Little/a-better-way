import { env } from '@/lib/environment'

let platformInstance: H.service.Platform | null = null

/** Get or create the singleton HERE Platform instance */
export function getPlatform(): H.service.Platform {
  if (platformInstance) return platformInstance

  platformInstance = new H.service.Platform({
    apikey: env.VITE_HERE_API_KEY,
  })

  return platformInstance
}
