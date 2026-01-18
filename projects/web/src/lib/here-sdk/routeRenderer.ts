import type { Route, RouteResponse } from '@/entities'

const STYLES = {
  selected: {
    strokeColor: '#3B82F6',
    lineWidth: 6,
    lineCap: 'round' as const,
    lineJoin: 'round' as const,
  },
  alternative: {
    strokeColor: 'rgba(100, 116, 139, 0.6)',
    lineWidth: 5,
    lineCap: 'round' as const,
    lineJoin: 'round' as const,
  },
}

interface DecodedRoute {
  id: string
  index: number
  lineStrings: H.geo.LineString[]
  polylines: H.map.Polyline[]
  group: H.map.Group
  bounds: H.geo.Rect | null
}

interface State {
  routes: DecodedRoute[]
  selectedIndex: number
  masterGroup: H.map.Group | null
}

/** Renders routes as polylines on the map with selection styling */
export class RouteRenderer {
  private map: H.Map
  private state: State = { routes: [], selectedIndex: 0, masterGroup: null }

  constructor(map: H.Map) {
    this.map = map
  }

  /** Draw all routes from a routing response */
  drawRoutes(result: RouteResponse, selectedIndex = 0): void {
    this.clearRoutes()

    if (!result.routes?.length) {
      console.warn('[RouteRenderer] No routes in result')
      return
    }

    this.state.masterGroup = new H.map.Group()
    this.state.routes = result.routes.map((route, index) => this.decodeRoute(route, index))
    this.map.addObject(this.state.masterGroup)
    this.setSelectedRoute(selectedIndex)
  }

  /** Change which route is selected and update styling */
  setSelectedRoute(index: number): void {
    if (index < 0 || index >= this.state.routes.length) {
      console.warn(`[RouteRenderer] Invalid route index: ${index}`)
      return
    }

    this.state.selectedIndex = index

    this.state.routes.forEach((route, routeIndex) => {
      const isSelected = routeIndex === index
      const style = isSelected ? STYLES.selected : STYLES.alternative
      route.polylines.forEach((p) => p.setStyle(style))
    })

    const selectedRoute = this.state.routes[index]
    if (selectedRoute?.bounds) {
      this.map
        .getViewModel()
        .setLookAtData({ bounds: selectedRoute.bounds, tilt: 25, heading: 180 }, true)
    }
  }

  /** Clear all routes from the map */
  clearRoutes(): void {
    if (this.state.masterGroup) {
      this.map.removeObject(this.state.masterGroup)
      this.state.routes.forEach((r) => r.group.removeAll())
      this.state.masterGroup.removeAll()
      this.state.masterGroup = null
    }
    this.state.routes = []
    this.state.selectedIndex = 0
  }

  /** Get the currently selected route index */
  getSelectedIndex(): number {
    return this.state.selectedIndex
  }

  /** Get the number of rendered routes */
  getRouteCount(): number {
    return this.state.routes.length
  }

  private decodeRoute(route: Route, index: number): DecodedRoute {
    const lineStrings: H.geo.LineString[] = []
    const polylines: H.map.Polyline[] = []
    let combinedBounds: H.geo.Rect | null = null
    const group = new H.map.Group()

    route.sections.forEach((section) => {
      if (!section.polyline) return

      const lineString = H.geo.LineString.fromFlexiblePolyline(section.polyline)
      lineStrings.push(lineString)

      const sectionBounds = lineString.getBoundingBox()
      if (sectionBounds) {
        combinedBounds = combinedBounds ? combinedBounds.mergeRect(sectionBounds) : sectionBounds
      }

      const polyline = new H.map.Polyline(lineString, {
        style: STYLES.alternative,
        data: { routeId: route.id, sectionId: section.id },
      })
      polylines.push(polyline)
      group.addObject(polyline)
    })

    this.state.masterGroup!.addObject(group)

    return { id: route.id, index, lineStrings, polylines, group, bounds: combinedBounds }
  }
}
