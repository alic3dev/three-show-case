import type { UUID } from 'node:crypto'

import type { CRS } from '@/utils/RVA/types/CRS'
import type { GeometryTypeLineString } from '@/utils/RVA/types/Geometry'

type ContoursFeaturePropertyType =
  | 'inter'
  | 'index'
  | 'inter_obs'
  | 'index_obs'
  | 'inter_bri'
  | 'index_bri'

interface ContoursFeatureProperties {
  Type: ContoursFeaturePropertyType
  Elevation: number
  ObjectID: number
  GlobalID: UUID
  Shape__Length: number
}

interface ContoursFeatureGeometry {
  type: GeometryTypeLineString
  coordinates: [number, number, number][]
}

interface ContoursFeature {
  type: 'Feature'
  properties: ContoursFeatureProperties
  geometry: ContoursFeatureGeometry
}

export interface Contours {
  type: 'FeatureCollection'
  name: string
  crs: CRS
  features: ContoursFeature[]
}

export interface MinifiedContour extends ContoursFeatureProperties {
  geometry: ContoursFeatureGeometry
}
