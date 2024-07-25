import type { UUID } from 'node:crypto'

import type { CRS } from '@/utils/RVA/types/CRS'
import type { GeometryTypePolygon } from '@/utils/RVA/types/Geometry'

interface LakesFeatureProperties {
  OBJECTID: number // 1...100
  CommonName:
    | 'Shields Lake'
    | 'Swan Lake'
    | "Young's Pond"
    | "St. Michael's Pond"
    | 'Lochinvar Lake'
    | 'Westhampton Lake'
    | 'Cherokee Lake'
    | 'Other'
    | null
  CreatedBy: 'richmondvagis'
  CreatedDate: string
  EditBy: 'richmondvagis'
  EditDate: string
  GlobalID: UUID
  Shape__Area: number
  Shape__Length: number
}

interface LakesFeatureGeometry {
  type: GeometryTypePolygon
  coordinates: [number, number][][]
}

interface LakesFeature {
  type: 'Feature'
  properties: LakesFeatureProperties
  geometry: LakesFeatureGeometry
}

export interface Lakes {
  type: 'FeatureCollection'
  name: string
  crs: CRS
  features: LakesFeature[]
}

export interface MinifiedLake {
  commonName: LakesFeatureProperties['CommonName']
  geometry: LakesFeatureGeometry
}
