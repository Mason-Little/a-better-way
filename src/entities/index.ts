/**
 * Entities barrel export
 */

// Geographic primitives
export { RoutePointSchema, type RoutePoint } from './geo'

// Route structures
export {
  RouteActionSchema,
  RouteIncidentSchema,
  RouteSpanSchema,
  RouteSectionSchema,
  RouteSchema,
  RouteReturnTypeSchema,
  RouteSpanTypeSchema,
  type RouteAction,
  type RouteIncident,
  type RouteSpan,
  type RouteSection,
  type Route,
  type RouteReturnType,
  type RouteSpanType,
} from './route'

// Routing options and results
export {
  RoutingOptionsSchema,
  RoutingResultSchema,
  BetterWayOptionsSchema,
  BetterWayResultSchema,
  RouteInfoSchema,
  type RoutingOptions,
  type RoutingResult,
  type BetterWayOptions,
  type BetterWayResult,
  type RouteInfo,
} from './routing'

// Traffic analysis
export {
  SlowdownSchema,
  LocatedIncidentSchema,
  TrafficSummarySchema,
  AvoidZoneSchema,
  AvoidZoneOptionsSchema,
  type Slowdown,
  type LocatedIncident,
  type TrafficSummary,
  type AvoidZone,
  type AvoidZoneOptions,
} from './traffic'

// Search
export { SearchResultSchema, type SearchResult } from './search'

// Map configuration
export { MapOptionsSchema, MapViewOptionsSchema, type MapOptions, type MapViewOptions } from './map'

// Mapillary API
export {
  MapillaryGeometrySchema,
  MapillaryFeatureSchema,
  MapillaryResponseSchema,
  type MapillaryGeometry,
  type MapillaryFeature,
  type MapillaryResponse,
} from './mapillary'

// Puck (user location marker)
export { PuckOptionsSchema, PuckPositionSchema, type PuckOptions, type PuckPosition } from './puck'
