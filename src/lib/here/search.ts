/**
 * HERE Geocoding and Search API v7
 * Autosuggest for place/address search
 */

const AUTOSUGGEST_API_BASE = 'https://autosuggest.search.hereapi.com/v1/autosuggest'

export interface SearchResult {
  id: string
  title: string
  address: string
  position: {
    lat: number
    lng: number
  }
}

interface HereAutosuggestItem {
  id?: string
  title: string
  address?: {
    label: string
  }
  position?: {
    lat: number
    lng: number
  }
  resultType?: string
}

interface HereAutosuggestResponse {
  items: HereAutosuggestItem[]
}

/**
 * Search for places/addresses using HERE Autosuggest
 * Biased toward Squamish, BC area
 */
export async function searchPlaces(
  query: string,
  options: { limit?: number } = {}
): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) {
    return []
  }

  const apiKey = import.meta.env.VITE_HERE_API_KEY
  if (!apiKey || apiKey === 'your_here_api_key_here') {
    console.error('[Search] HERE API key not configured')
    return []
  }

  const { limit = 5 } = options

  // Bias search toward Squamish, BC area
  const params = new URLSearchParams({
    apikey: apiKey,
    q: query.trim(),
    limit: String(limit),
    at: '49.7016,-123.1558', // Squamish, BC
    lang: 'en',
  })

  const url = `${AUTOSUGGEST_API_BASE}?${params}`

  try {
    const response = await fetch(url)

    if (!response.ok) {
      console.error('[Search] API error:', response.status)
      return []
    }

    const data: HereAutosuggestResponse = await response.json()

    // Filter to only items with positions (actual places, not category suggestions)
    return data.items
      .filter((item) => item.position && item.id)
      .map((item) => ({
        id: item.id!,
        title: item.title,
        address: item.address?.label ?? item.title,
        position: item.position!,
      }))
  } catch (error) {
    console.error('[Search] Failed to fetch:', error)
    return []
  }
}
