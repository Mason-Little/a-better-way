import type { BBox, StopSign, TrafficSegment } from '@/entities'

export interface DebugConfig {
  showTrafficSegments?: boolean
  showStopSigns?: boolean
  showBoundingBox?: boolean
}

const STYLES = {
  trafficSegment: {
    lineWidth: 4,
    strokeColor: 'rgba(255, 50, 50, 0.8)',
    lineDash: [4, 4],
  },
  stopSign: {
    fill: '#cc0000',
    size: 40,
  },
  boundingBox: {
    strokeColor: 'rgba(255, 165, 0, 0.7)',
    lineWidth: 2,
    fillColor: 'rgba(255, 165, 0, 0.1)',
  },
}

/** Self-contained debug overlay for map visualizations */
export class DebugOverlay {
  private map: H.Map
  private config: Required<DebugConfig>
  private groups: {
    traffic: H.map.Group | null
    stopSigns: H.map.Group | null
    bbox: H.map.Rect | null
  } = { traffic: null, stopSigns: null, bbox: null }

  constructor(map: H.Map, config: DebugConfig = {}) {
    this.map = map
    this.config = {
      showTrafficSegments: config.showTrafficSegments ?? true,
      showStopSigns: config.showStopSigns ?? true,
      showBoundingBox: config.showBoundingBox ?? true,
    }
  }

  /** Draw traffic segments as dashed polylines */
  drawTrafficSegments(segments: TrafficSegment[]) {
    if (!this.config.showTrafficSegments) return
    this.clearTrafficSegments()

    const group = new H.map.Group()

    for (const seg of segments) {
      if (!seg.shape || seg.shape.length < 2) continue

      const lineString = new H.geo.LineString()
      for (const pt of seg.shape) {
        lineString.pushPoint(pt)
      }

      const polyline = new H.map.Polyline(lineString, {
        style: STYLES.trafficSegment,
        data: { segmentId: seg.id, jamFactor: seg.jamFactor },
      })

      group.addObject(polyline)
    }

    this.map.addObject(group)
    this.groups.traffic = group
  }

  /** Draw stop signs as circular markers */
  drawStopSigns(signs: StopSign[]) {
    if (!this.config.showStopSigns) return
    this.clearStopSigns()

    const group = new H.map.Group()

    for (const sign of signs) {
      const icon = new H.map.DomIcon(this.createStopSignElement())
      const marker = new H.map.DomMarker({ lat: sign.lat, lng: sign.lng }, { icon })
      group.addObject(marker)
    }

    this.map.addObject(group)
    this.groups.stopSigns = group
  }

  /** Draw a bounding box rectangle */
  drawBoundingBox(bbox: BBox) {
    if (!this.config.showBoundingBox) return
    this.clearBoundingBox()

    const rect = new H.map.Rect(
      new H.geo.Rect(bbox.north, bbox.west, bbox.south, bbox.east),
      { style: STYLES.boundingBox },
    )

    this.map.addObject(rect)
    this.groups.bbox = rect
  }

  /** Clear traffic segment visualizations */
  clearTrafficSegments() {
    if (this.groups.traffic) {
      this.map.removeObject(this.groups.traffic)
      this.groups.traffic = null
    }
  }

  /** Clear stop sign visualizations */
  clearStopSigns() {
    if (this.groups.stopSigns) {
      this.map.removeObject(this.groups.stopSigns)
      this.groups.stopSigns = null
    }
  }

  /** Clear bounding box visualization */
  clearBoundingBox() {
    if (this.groups.bbox) {
      this.map.removeObject(this.groups.bbox)
      this.groups.bbox = null
    }
  }

  /** Clear all debug visualizations */
  clearAll() {
    this.clearTrafficSegments()
    this.clearStopSigns()
    this.clearBoundingBox()
  }

  /** Update config at runtime */
  setConfig(config: Partial<DebugConfig>) {
    Object.assign(this.config, config)
    if (!this.config.showTrafficSegments) this.clearTrafficSegments()
    if (!this.config.showStopSigns) this.clearStopSigns()
    if (!this.config.showBoundingBox) this.clearBoundingBox()
  }

  /** Dispose and clean up */
  dispose() {
    this.clearAll()
  }

  private createStopSignElement(): HTMLElement {
    const el = document.createElement('div')
    el.style.cssText = `
      background-color: ${STYLES.stopSign.fill};
      color: white;
      width: ${STYLES.stopSign.size}px;
      height: ${STYLES.stopSign.size}px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      font-weight: bold;
      font-size: 10px;
      font-family: sans-serif;
      transform: translate(-50%, -50%);
    `
    el.textContent = 'STOP'
    return el
  }
}
