import type { UUID } from 'node:crypto'

import type { CRS } from '@/utils/RVA/types/CRS'
import type { FIPS } from '@/utils/RVA/types/FIPS'
import type {
  GeometryTypeMultiPolygon,
  GeometryTypePolygon,
} from '@/utils/RVA/types/Geometry'
import type { YesNo } from '@/utils/RVA/types/YesNo'

interface RoadsFeatureProperties {
  OBJECTID: number
  Paved: YesNo
  FIPS: FIPS.Richmond
  CreatedBy: 'richmondvagis'
  CreatedDate: string
  EditBy: 'richmondvagis'
  EditDate: string
  GlobalID: UUID
  Shape__Area: number
  Shape__Length: number
}

interface RoadsFeatureGeometryPolygon {
  type: GeometryTypePolygon
  coordinates: [number, number][][]
}

interface RoadsFeatureGeometryMultiPolyGon {
  type: GeometryTypeMultiPolygon
  coordinates: [number, number][][][]
}

type RoadsFeatureGeometry =
  | RoadsFeatureGeometryPolygon
  | RoadsFeatureGeometryMultiPolyGon

interface RoadsFeature {
  type: 'Feature'
  properties: RoadsFeatureProperties
  geometry: RoadsFeatureGeometry
}

export interface Roads {
  type: 'FeatureCollection'
  name: 'Roads'
  crc: CRS
  features: RoadsFeature[]
}

export interface MinifiedRoad {
  objectId: RoadsFeatureProperties['OBJECTID']
  paved: boolean
  globalID: RoadsFeatureProperties['GlobalID']
  shapeArea: RoadsFeatureProperties['Shape__Area']
  shapeLength: RoadsFeatureProperties['Shape__Length']

  geometry: RoadsFeatureGeometry
}
