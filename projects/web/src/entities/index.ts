/**
 * Entities barrel export
 */

// Geographic primitives
export { type RoutePoint, type BoundingBox } from './geo'

// Stop Sign
export { type StopSign, type StopSignResult } from './stop-sign'

// Route structures
export { type RouteAction, type Route, type RouteEvaluation } from './route'

// Routing options and results
export { type RoutingOptions, type RoutingResult } from './route'

// Traffic analysis
export * from './traffic'

// Avoidance
export { type AvoidInput } from './route'

// Search
export { type SearchResult } from './search'

// Map configuration
export { type MapOptions, type MapViewOptions } from './map'

// Puck (user location marker)
export { type PuckOptions, type PuckPosition } from './puck'
