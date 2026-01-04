/**
 * HERE Maps Puck (User Location Marker)
 *
 * A "puck" is a visual indicator representing the user's current location on the map.
 * This module provides a full-featured puck implementation with:
 *
 * - Smooth position updates for live navigation
 * - Rotation support to show heading/bearing
 * - Customizable appearance (size, colors, accuracy ring)
 * - Both regular markers and DOM markers for rich styling
 * - Group management for organizing puck-related objects
 */

import type { PuckOptions, PuckPosition } from '@/entities'

// Re-export types for convenience
export type { PuckPosition }

// Default configuration
const DEFAULTS: Required<PuckOptions> = {
  size: 24,
  primaryColor: '#3B82F6', // Blue
  borderColor: '#FFFFFF',
  showAccuracyRing: true,
  accuracyRingColor: 'rgba(59, 130, 246, 0.2)',
  showHeading: true,
  useDomMarker: true,
  zIndex: 1000,
}

// ─────────────────────────────────────────────────────────────────────────────
// Puck Class
// ─────────────────────────────────────────────────────────────────────────────

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

  // ───────────────────────────────────────────────────────────────────────────
  // Public API
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Show the puck on the map
   * Must call setPosition() first or provide initial position
   */
  show(initialPosition?: PuckPosition): void {
    if (initialPosition) {
      this.currentPosition = initialPosition
    }

    if (!this.currentPosition) {
      console.warn('[Puck] Cannot show without a position. Call setPosition() first.')
      return
    }

    if (this.isVisible) {
      return // Already visible
    }

    // Create the marker if it doesn't exist
    if (!this.marker) {
      this.createMarker()
    }

    // Add group to map
    this.map.addObject(this.group)
    this.isVisible = true
  }

  /**
   * Hide and remove the puck from the map
   */
  hide(): void {
    if (!this.isVisible) {
      return
    }

    this.map.removeObject(this.group)
    this.isVisible = false
  }

  /**
   * Update the puck's position and optionally heading
   * This is the main method for live navigation updates
   */
  setPosition(position: PuckPosition): void {
    this.currentPosition = position

    if (!this.marker) {
      // Marker not created yet, position will be used when show() is called
      return
    }

    // Update marker geometry
    this.marker.setGeometry({ lat: position.lat, lng: position.lng })

    // Update heading rotation if using DOM marker
    if (this.options.useDomMarker && this.domElement && position.heading !== undefined) {
      this.updateHeadingRotation(position.heading)
    }
  }

  /**
   * Get the current puck position
   */
  getPosition(): PuckPosition | null {
    return this.currentPosition
  }

  /**
   * Check if the puck is currently visible on the map
   */
  isOnMap(): boolean {
    return this.isVisible
  }

  /**
   * Update puck options (will recreate marker if needed)
   */
  setOptions(options: Partial<PuckOptions>): void {
    const needsRecreate =
      options.useDomMarker !== undefined && options.useDomMarker !== this.options.useDomMarker

    this.options = { ...this.options, ...options }

    if (needsRecreate && this.marker) {
      this.group.removeAll()
      this.marker = null
      this.domElement = null
      if (this.isVisible) {
        this.createMarker()
      }
    } else if (this.domElement) {
      // Update styles without recreating
      this.applyDomStyles()
    }
  }

  /**
   * Clean up and dispose of all resources
   */
  dispose(): void {
    this.hide()
    this.group.removeAll()
    this.marker = null
    this.domElement = null
    this.currentPosition = null
  }

  /**
   * Get the underlying HERE map group for advanced usage
   */
  getGroup(): H.map.Group {
    return this.group
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Private Methods
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Create the puck marker (DOM or regular)
   */
  private createMarker(): void {
    if (!this.currentPosition) {
      return
    }

    const position = { lat: this.currentPosition.lat, lng: this.currentPosition.lng }

    if (this.options.useDomMarker) {
      this.createDomMarker(position)
    } else {
      this.createCanvasMarker(position)
    }

    if (this.marker) {
      this.group.addObject(this.marker)
    }
  }

  /**
   * Create a DOM-based marker for rich styling and animations
   */
  private createDomMarker(position: H.geo.IPoint): void {
    // Create the puck DOM element
    this.domElement = this.createPuckElement()

    // Create DomIcon with the element
    const icon = new H.map.DomIcon(this.domElement, {
      onAttach: (clonedElement) => {
        // Store reference to the cloned element for updates
        this.domElement = clonedElement
        if (this.currentPosition?.heading !== undefined) {
          this.updateHeadingRotation(this.currentPosition.heading)
        }
      },
    })

    // Create DomMarker
    this.marker = new H.map.DomMarker(position, {
      icon,
      zIndex: this.options.zIndex,
    })
  }

  /**
   * Create a canvas-based marker (simpler but less customizable)
   */
  private createCanvasMarker(position: H.geo.IPoint): void {
    const { size, primaryColor, borderColor } = this.options

    // Create SVG icon
    const svg = this.createPuckSvg(size, primaryColor, borderColor)
    const icon = new H.map.Icon(svg, {
      size: { w: size, h: size },
      anchor: { x: size / 2, y: size / 2 },
    })

    // Create Marker
    this.marker = new H.map.Marker(position, {
      icon,
      zIndex: this.options.zIndex,
    })
  }

  /**
   * Create the puck DOM element with all styling
   */
  private createPuckElement(): HTMLElement {
    const { size, primaryColor, borderColor, showHeading, showAccuracyRing, accuracyRingColor } =
      this.options

    // Container element
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

    // Accuracy ring (optional)
    if (showAccuracyRing) {
      const accuracyRing = document.createElement('div')
      accuracyRing.className = 'here-puck-accuracy'
      accuracyRing.style.cssText = `
        position: absolute;
        width: ${size * 1.8}px;
        height: ${size * 1.8}px;
        border-radius: 50%;
        background: ${accuracyRingColor};
        animation: here-puck-pulse 2s ease-in-out infinite;
      `
      container.appendChild(accuracyRing)
    }

    // Heading indicator (optional arrow/cone)
    if (showHeading) {
      const headingIndicator = document.createElement('div')
      headingIndicator.className = 'here-puck-heading'
      headingIndicator.style.cssText = `
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
      container.appendChild(headingIndicator)
    }

    // Main puck circle
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

    // Inner highlight
    const highlight = document.createElement('div')
    highlight.className = 'here-puck-highlight'
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

    // Add CSS animation keyframes if not already present
    this.injectAnimationStyles()

    return container
  }

  /**
   * Create SVG for canvas-based puck icon
   */
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

  /**
   * Apply DOM styles (for updates without recreation)
   */
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

  /**
   * Update heading rotation on the DOM element
   */
  private updateHeadingRotation(heading: number): void {
    if (!this.domElement) return

    const headingEl = this.domElement.querySelector('.here-puck-heading') as HTMLElement
    if (headingEl) {
      headingEl.style.transform = `rotate(${heading}deg)`
    }
  }

  /**
   * Inject CSS animation keyframes for pulsing effect
   */
  private injectAnimationStyles(): void {
    const styleId = 'here-puck-animations'
    if (document.getElementById(styleId)) {
      return // Already injected
    }

    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      @keyframes here-puck-pulse {
        0%, 100% {
          transform: scale(1);
          opacity: 0.6;
        }
        50% {
          transform: scale(1.15);
          opacity: 0.3;
        }
      }
    `
    document.head.appendChild(style)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Singleton / Convenience Functions
// ─────────────────────────────────────────────────────────────────────────────

let defaultPuck: Puck | null = null

/**
 * Initialize the default puck instance
 * Call this once after creating your map
 */
export function initPuck(map: H.Map, options?: PuckOptions): Puck {
  if (defaultPuck) {
    defaultPuck.dispose()
  }
  defaultPuck = new Puck(map, options)
  return defaultPuck
}

/**
 * Update puck position (convenience function)
 */
export function updatePuckPosition(position: PuckPosition): void {
  if (!defaultPuck) {
    throw new Error('[Puck] Not initialized. Call initPuck(map) first.')
  }
  defaultPuck.setPosition(position)
}

/**
 * Show the puck on the map
 */
export function showPuck(initialPosition?: PuckPosition): void {
  if (!defaultPuck) {
    throw new Error('[Puck] Not initialized. Call initPuck(map) first.')
  }
  defaultPuck.show(initialPosition)
}

/**
 * Hide the puck from the map
 */
export function hidePuck(): void {
  if (!defaultPuck) {
    return // Nothing to hide
  }
  defaultPuck.hide()
}

/**
 * Dispose of the default puck
 */
export function disposePuck(): void {
  if (defaultPuck) {
    defaultPuck.dispose()
    defaultPuck = null
  }
}
