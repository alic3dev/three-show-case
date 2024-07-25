import type { UUID } from 'node:crypto'

import type { CRS, CRSNameEPSG2284 } from '@/utils/RVA/types/CRS'
import type { GeometryTypeLineStringOrMultiLineString } from '@/utils/RVA/types/Geometry'

interface RailroadsFeatureGeometry {
  type: GeometryTypeLineStringOrMultiLineString
  coordinates: [number, number][]
}

interface RailroadsFeatureProperties {
  OBJECTID: number
  SubType: 'Unsimplified' | 'Simplified'
  CreatedBy: 'richmondvagis'
  CreatedDate: string
  EditBy: 'richmondvagis'
  EditDate: string
  GlobalID: UUID
}

interface RailroadsFeature {
  type: 'Feature'
  id: number
  geometry: RailroadsFeatureGeometry
  properties: RailroadsFeatureProperties
}

export interface Railroads {
  type: 'FeatureCollection'
  crc: CRS<CRSNameEPSG2284>
  features: RailroadsFeature[]
}

export interface MinifiedRailroad {
  SubType: RailroadsFeatureProperties['SubType']
  geometry: RailroadsFeatureGeometry
}
