/**
 * HERE Maps Route Renderer
 *
 * Renders routes as simple solid-color polylines.
 *
 * Features:
 * - Flexible polyline decoding via HERE JS API
 * - Simple solid-color lines
 * - Rounded line caps and joins for smooth curves
 * - Distinct styling for selected vs alternative routes
 * - Efficient re-styling without re-decoding
 * - Automatic viewport fitting to selected route
 */

import type { Route, RoutingResult } from './route'

// ─────────────────────────────────────────────────────────────────────────────
// Style Configuration
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Simple route styling - solid colors only
 */
const ROUTE_STYLES = {
  // Selected route: Solid blue
  selected: {
    strokeColor: '#3B82F6',  // Blue
    lineWidth: 6,
    lineCap: 'round' as const,
    lineJoin: 'round' as const,
  },

  // Alternative routes: Semi-transparent gray
  alternative: {
    strokeColor: 'rgba(100, 116, 139, 0.6)',  // Slate gray
    lineWidth: 5,
    lineCap: 'round' as const,
    lineJoin: 'round' as const,
  },
} as const

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Internal representation of decoded route geometry
 */
interface DecodedRoute {
  /** Original route ID */
  id: string
  /** Route index in the result array */
  index: number
  /** Decoded line geometries for each section */
  lineStrings: H.geo.LineString[]
  /** Rendered polylines */
  polylines: H.map.Polyline[]
  /** Group containing all polylines for this route */
  group: H.map.Group
  /** Bounding box encompassing all sections */
  bounds: H.geo.Rect | null
}

/**
 * Route renderer state
 */
interface RouteRendererState {
  /** Decoded and rendered routes */
  routes: DecodedRoute[]
  /** Currently selected route index */
  selectedIndex: number
  /** Master group containing all route groups */
  masterGroup: H.map.Group | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Route Renderer Class
// ─────────────────────────────────────────────────────────────────────────────

export class RouteRenderer {
  private map: H.Map
  private state: RouteRendererState = {
    routes: [],
    selectedIndex: 0,
    masterGroup: null,
  }

  constructor(map: H.Map) {
    this.map = map
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Public API
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Draw all routes from a HERE Routing v8 response
   *
   * @param result - The routing API response containing routes
   * @param selectedIndex - Optional index of the route to select (default: 0)
   */
  drawRoutes(result: RoutingResult, selectedIndex = 0): void {
    // Clear any existing routes first
    this.clearRoutes()

    if (!result.routes || result.routes.length === 0) {
      console.warn('[RouteRenderer] No routes in result')
      return
    }

    // Create master group to hold all route groups
    this.state.masterGroup = new H.map.Group()

    // Decode and render each route
    this.state.routes = result.routes.map((route, index) =>
      this.decodeAndRenderRoute(route, index)
    )

    // Add master group to map
    this.map.addObject(this.state.masterGroup)

    // Set initial selection and fit viewport
    this.setSelectedRoute(selectedIndex)
  }

  /**
   * Change which route is selected
   * Updates styling without re-decoding or re-creating polylines
   *
   * @param index - Index of the route to select
   */
  setSelectedRoute(index: number): void {
    if (index < 0 || index >= this.state.routes.length) {
      console.warn(`[RouteRenderer] Invalid route index: ${index}`)
      return
    }

    this.state.selectedIndex = index

    // Re-apply styles to all routes based on selection
    this.state.routes.forEach((route, routeIndex) => {
      const isSelected = routeIndex === index
      this.applyStyles(route, isSelected)
    })

    // Fit viewport to the selected route
    const selectedRoute = this.state.routes[index]
    if (selectedRoute?.bounds) {
      this.fitToBounds(selectedRoute.bounds)
    }
  }

  /**
   * Clear all rendered routes from the map
   */
  clearRoutes(): void {
    if (this.state.masterGroup) {
      // Remove from map
      this.map.removeObject(this.state.masterGroup)

      // Dispose all groups and polylines
      this.state.routes.forEach(route => {
        route.group.removeAll()
      })

      this.state.masterGroup.removeAll()
      this.state.masterGroup = null
    }

    this.state.routes = []
    this.state.selectedIndex = 0
  }

  /**
   * Get the currently selected route index
   */
  getSelectedIndex(): number {
    return this.state.selectedIndex
  }

  /**
   * Get the number of rendered routes
   */
  getRouteCount(): number {
    return this.state.routes.length
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Private Methods
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Decode a route's flexible polylines and create rendered polylines
   */
  private decodeAndRenderRoute(route: Route, index: number): DecodedRoute {
    const lineStrings: H.geo.LineString[] = []
    const polylines: H.map.Polyline[] = []
    let combinedBounds: H.geo.Rect | null = null

    // Create group for this route
    const group = new H.map.Group()

    // Process each section (routes can have multiple sections for complex routes)
    route.sections.forEach(section => {
      if (!section.polyline) {
        console.warn(`[RouteRenderer] Section missing polyline: ${section.id}`)
        return
      }

      // Decode the HERE flexible polyline using the HERE JS API
      const lineString = H.geo.LineString.fromFlexiblePolyline(section.polyline)
      lineStrings.push(lineString)

      // Update combined bounds
      const sectionBounds = lineString.getBoundingBox()
      if (sectionBounds) {
        combinedBounds = combinedBounds
          ? combinedBounds.mergeRect(sectionBounds)
          : sectionBounds
      }

      // Create single polyline with solid color
      const polyline = new H.map.Polyline(lineString, {
        style: ROUTE_STYLES.alternative,
        data: { routeId: route.id, sectionId: section.id },
      })
      polylines.push(polyline)
      group.addObject(polyline)
    })

    // Add route group to master group
    this.state.masterGroup!.addObject(group)

    return {
      id: route.id,
      index,
      lineStrings,
      polylines,
      group,
      bounds: combinedBounds,
    }
  }

  /**
   * Apply selected or alternative styling to a route's polylines
   */
  private applyStyles(route: DecodedRoute, isSelected: boolean): void {
    const style = isSelected ? ROUTE_STYLES.selected : ROUTE_STYLES.alternative

    route.polylines.forEach((polyline: H.map.Polyline) => {
      polyline.setStyle(style)
    })
  }

  /**
   * Fit the map viewport to show the given bounds with padding
   */
  private fitToBounds(bounds: H.geo.Rect): void {
    // Use getViewModel().setLookAtData() - setViewBounds is deprecated in HARP engine
    this.map.getViewModel().setLookAtData(
      {
        bounds,
        tilt: 25, // Reset to top-down view for route overview
        heading: 180,
      },
      true // animate
    )
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Standalone Functions
// ─────────────────────────────────────────────────────────────────────────────

// Singleton instance for convenience functions
let defaultRenderer: RouteRenderer | null = null

/**
 * Initialize the default route renderer
 * Call this once after creating your map
 */
export function initRouteRenderer(map: H.Map): RouteRenderer {
  defaultRenderer = new RouteRenderer(map)
  return defaultRenderer
}

/**
 * Draw routes using the default renderer
 * @param result - HERE Routing v8 response
 */
export function drawRoutes(result: RoutingResult): void {
  if (!defaultRenderer) {
    throw new Error('[RouteRenderer] Not initialized. Call initRouteRenderer(map) first.')
  }
  defaultRenderer.drawRoutes(result)
}

/**
 * Select a different route by index
 * @param index - Route index to select
 */
export function setSelectedRoute(index: number): void {
  if (!defaultRenderer) {
    throw new Error('[RouteRenderer] Not initialized. Call initRouteRenderer(map) first.')
  }
  defaultRenderer.setSelectedRoute(index)
}

/**
 * Clear all routes from the map
 */
export function clearRoutes(): void {
  if (!defaultRenderer) {
    return // Nothing to clear
  }
  defaultRenderer.clearRoutes()
}

/**
 * Get the default renderer instance
 */
export function getRouteRenderer(): RouteRenderer | null {
  return defaultRenderer
}
