import type { PuckOptions, PuckPosition } from '@/entities'

const DEFAULTS: Required<PuckOptions> = {
  size: 24,
  primaryColor: '#3B82F6',
  borderColor: '#FFFFFF',
  showAccuracyRing: true,
  accuracyRingColor: 'rgba(59, 130, 246, 0.2)',
  showHeading: true,
  useDomMarker: true,
  zIndex: 1000,
}

/** User location puck marker with heading indicator and accuracy ring */
export class Puck {
  private map: H.Map
  private options: Required<PuckOptions>
  private group: H.map.Group
  private marker: H.map.Marker | H.map.DomMarker | null = null
  private domElement: HTMLElement | null = null
  private currentPosition: PuckPosition | null = null
  private isVisible = false

  constructor(map: H.Map, options: PuckOptions = {}) {
    this.map = map
    this.options = { ...DEFAULTS, ...options }
    this.group = new H.map.Group()
  }

  /** Show the puck on the map */
  show(initialPosition?: PuckPosition): void {
    if (initialPosition) this.currentPosition = initialPosition
    if (!this.currentPosition) {
      console.warn('[Puck] Cannot show without a position')
      return
    }
    if (this.isVisible) return

    if (!this.marker) this.createMarker()
    this.map.addObject(this.group)
    this.isVisible = true
  }

  /** Hide and remove the puck from the map */
  hide(): void {
    if (!this.isVisible) return
    this.map.removeObject(this.group)
    this.isVisible = false
  }

  /** Update the puck position and heading */
  setPosition(position: PuckPosition): void {
    this.currentPosition = position
    if (!this.marker) return

    this.marker.setGeometry({ lat: position.lat, lng: position.lng })
    if (this.options.useDomMarker && this.domElement && position.heading !== undefined) {
      this.updateHeadingRotation(position.heading)
    }
  }

  /** Get the current puck position */
  getPosition(): PuckPosition | null {
    return this.currentPosition
  }

  /** Check if the puck is visible on the map */
  isOnMap(): boolean {
    return this.isVisible
  }

  /** Update puck styling options */
  setOptions(options: Partial<PuckOptions>): void {
    const needsRecreate =
      options.useDomMarker !== undefined && options.useDomMarker !== this.options.useDomMarker

    this.options = { ...this.options, ...options }

    if (needsRecreate && this.marker) {
      this.group.removeAll()
      this.marker = null
      this.domElement = null
      if (this.isVisible) this.createMarker()
    } else if (this.domElement) {
      this.applyDomStyles()
    }
  }

  /** Clean up and dispose of all resources */
  dispose(): void {
    this.hide()
    this.group.removeAll()
    this.marker = null
    this.domElement = null
    this.currentPosition = null
  }

  /** Get the underlying HERE map group */
  getGroup(): H.map.Group {
    return this.group
  }

  private createMarker(): void {
    if (!this.currentPosition) return
    const position = { lat: this.currentPosition.lat, lng: this.currentPosition.lng }

    if (this.options.useDomMarker) {
      this.createDomMarker(position)
    } else {
      this.createCanvasMarker(position)
    }

    if (this.marker) this.group.addObject(this.marker)
  }

  private createDomMarker(position: H.geo.IPoint): void {
    this.domElement = this.createPuckElement()

    const icon = new H.map.DomIcon(this.domElement, {
      onAttach: (clonedElement) => {
        this.domElement = clonedElement
        if (this.currentPosition?.heading !== undefined) {
          this.updateHeadingRotation(this.currentPosition.heading)
        }
      },
    })

    this.marker = new H.map.DomMarker(position, { icon, zIndex: this.options.zIndex })
  }

  private createCanvasMarker(position: H.geo.IPoint): void {
    const { size, primaryColor, borderColor } = this.options
    const svg = this.createPuckSvg(size, primaryColor, borderColor)
    const icon = new H.map.Icon(svg, {
      size: { w: size, h: size },
      anchor: { x: size / 2, y: size / 2 },
    })
    this.marker = new H.map.Marker(position, { icon, zIndex: this.options.zIndex })
  }

  private createPuckElement(): HTMLElement {
    const { size, primaryColor, borderColor, showHeading, showAccuracyRing, accuracyRingColor } =
      this.options

    const container = document.createElement('div')
    container.className = 'here-puck'
    container.style.cssText = `
      position: relative;
      width: ${size * 2}px;
      height: ${size * 2}px;
      display: flex;
      align-items: center;
      justify-content: center;
      transform: translate(-50%, -50%);
    `

    if (showAccuracyRing) {
      const ring = document.createElement('div')
      ring.className = 'here-puck-accuracy'
      ring.style.cssText = `
        position: absolute;
        width: ${size * 1.8}px;
        height: ${size * 1.8}px;
        border-radius: 50%;
        background: ${accuracyRingColor};
        animation: here-puck-pulse 2s ease-in-out infinite;
      `
      container.appendChild(ring)
    }

    if (showHeading) {
      const heading = document.createElement('div')
      heading.className = 'here-puck-heading'
      heading.style.cssText = `
        position: absolute;
        width: 0;
        height: 0;
        border-left: ${size / 3}px solid transparent;
        border-right: ${size / 3}px solid transparent;
        border-bottom: ${size / 1.5}px solid ${primaryColor};
        top: ${-size / 4}px;
        transform-origin: center ${size / 2 + size / 4}px;
        opacity: 0.9;
        transition: transform 0.3s ease-out;
      `
      container.appendChild(heading)
    }

    const puck = document.createElement('div')
    puck.className = 'here-puck-dot'
    puck.style.cssText = `
      position: relative;
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: ${primaryColor};
      border: 3px solid ${borderColor};
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      z-index: 1;
    `
    container.appendChild(puck)

    const highlight = document.createElement('div')
    highlight.style.cssText = `
      position: absolute;
      top: 20%;
      left: 20%;
      width: 30%;
      height: 30%;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.4);
    `
    puck.appendChild(highlight)

    this.injectAnimationStyles()
    return container
  }

  private createPuckSvg(size: number, fill: string, stroke: string): string {
    return `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}"
                fill="${fill}" stroke="${stroke}" stroke-width="2"/>
        <circle cx="${size / 2 - size / 6}" cy="${size / 2 - size / 6}" r="${size / 8}"
                fill="rgba(255,255,255,0.4)"/>
      </svg>
    `
  }

  private applyDomStyles(): void {
    if (!this.domElement) return
    const puckDot = this.domElement.querySelector('.here-puck-dot') as HTMLElement
    if (puckDot) {
      puckDot.style.background = this.options.primaryColor
      puckDot.style.borderColor = this.options.borderColor
      puckDot.style.width = `${this.options.size}px`
      puckDot.style.height = `${this.options.size}px`
    }
  }

  private updateHeadingRotation(heading: number): void {
    if (!this.domElement) return
    const headingEl = this.domElement.querySelector('.here-puck-heading') as HTMLElement
    if (headingEl) headingEl.style.transform = `rotate(${heading}deg)`
  }

  private injectAnimationStyles(): void {
    const styleId = 'here-puck-animations'
    if (document.getElementById(styleId)) return

    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      @keyframes here-puck-pulse {
        0%, 100% { transform: scale(1); opacity: 0.6; }
        50% { transform: scale(1.15); opacity: 0.3; }
      }
    `
    document.head.appendChild(style)
  }
}

let defaultPuck: Puck | null = null

/** Initialize the default puck singleton */
export function initPuck(map: H.Map, options?: PuckOptions): Puck {
  if (defaultPuck) defaultPuck.dispose()
  defaultPuck = new Puck(map, options)
  return defaultPuck
}

/** Update the default puck position */
export function updatePuckPosition(position: PuckPosition): void {
  if (!defaultPuck) throw new Error('[Puck] Not initialized')
  defaultPuck.setPosition(position)
}

/** Show the default puck on the map */
export function showPuck(initialPosition?: PuckPosition): void {
  if (!defaultPuck) throw new Error('[Puck] Not initialized')
  defaultPuck.show(initialPosition)
}

/** Hide the default puck from the map */
export function hidePuck(): void {
  defaultPuck?.hide()
}

/** Dispose of the default puck */
export function disposePuck(): void {
  if (defaultPuck) {
    defaultPuck.dispose()
    defaultPuck = null
  }
}
