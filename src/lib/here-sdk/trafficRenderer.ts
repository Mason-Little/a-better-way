import type { TrafficSegment } from '@/utils/traffic/visualization'

/**
 * Renders traffic segments as solid colored polylines with boundary markers
 */
export class TrafficRenderer {
  private map: H.Map
  private group: H.map.Group

  constructor(map: H.Map) {
    this.map = map
    this.group = new H.map.Group()
    this.map.addObject(this.group)
  }

  /**
   * Create a short perpendicular line at a point to mark segment boundary
   */
  private createBoundaryMarker(
    point: { lat: number; lng: number },
    heading: number,
    color: string,
  ): H.map.Polyline {
    // Create a small perpendicular tick mark
    const perpendicular = heading + 90
    const tickLengthMeters = 15 // Length of the tick mark in meters

    // Convert meters to degrees (approximate)
    const latOffset = (tickLengthMeters / 111320) * Math.cos((perpendicular * Math.PI) / 180)
    const lngOffset =
      (tickLengthMeters / (111320 * Math.cos((point.lat * Math.PI) / 180))) *
      Math.sin((perpendicular * Math.PI) / 180)

    const lineString = new H.geo.LineString()
    lineString.pushPoint({ lat: point.lat - latOffset, lng: point.lng - lngOffset })
    lineString.pushPoint({ lat: point.lat + latOffset, lng: point.lng + lngOffset })

    return new H.map.Polyline(lineString, {
      style: {
        lineWidth: 4,
        strokeColor: color,
        lineCap: 'round',
      },
    })
  }

  /**
   * Calculate heading between two points in degrees
   */
  private calculateHeading(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number },
  ): number {
    const dLng = ((to.lng - from.lng) * Math.PI) / 180
    const lat1 = (from.lat * Math.PI) / 180
    const lat2 = (to.lat * Math.PI) / 180

    const y = Math.sin(dLng) * Math.cos(lat2)
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)

    return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
  }

  /**
   * Render traffic segments on the map
   */
  renderSegments(segments: TrafficSegment[]): void {
    this.clear()

    if (!segments || segments.length === 0) return

    segments.forEach((segment) => {
      const lineString = new H.geo.LineString()
      segment.path.forEach((p) => lineString.pushPoint(p))

      // Main traffic polyline
      const polyline = new H.map.Polyline(lineString, {
        style: {
          lineWidth: segment.weight,
          strokeColor: segment.color,
          lineCap: 'butt', // Square ends for cleaner boundary markers
          lineJoin: 'round',
        },
        data: segment.details,
      })
      this.group.addObject(polyline)

      // Add boundary markers at start and end of segment
      if (segment.path.length >= 2) {
        const startPoint = segment.path[0]
        const secondPoint = segment.path[1]
        const startHeading = this.calculateHeading(startPoint, secondPoint)

        const endPoint = segment.path[segment.path.length - 1]
        const beforeEndPoint = segment.path[segment.path.length - 2]
        const endHeading = this.calculateHeading(beforeEndPoint, endPoint)

        // Start boundary marker
        const startMarker = this.createBoundaryMarker(startPoint, startHeading, segment.color)
        this.group.addObject(startMarker)

        // End boundary marker
        const endMarker = this.createBoundaryMarker(endPoint, endHeading, segment.color)
        this.group.addObject(endMarker)
      }
    })
  }

  /**
   * Clear all traffic segments
   */
  clear(): void {
    this.group.removeAll()
  }
}
