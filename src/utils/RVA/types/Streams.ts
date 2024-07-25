import type { UUID } from 'node:crypto'

import type { CRS } from '@/utils/RVA/types/CRS'
import type {
  GeometryTypeMultiPolygon,
  GeometryTypePolygon,
} from '@/utils/RVA/types/Geometry'

interface StreamsFeatureProperties {
  OBJECTID: number // 1...68
  WaterBodyName:
    | 'Shockoe Creek'
    | 'Stony Run Creek'
    | 'James River'
    | 'Haxall Mill Race'
    | 'Goodes Creek'
    | 'Upham Brook'
    | "Jordan's Branch"
    | 'Powhite Creek'
    | 'Pocoshock Creek'
    | 'Broad Rock Creek'
    | 'Reedy Creek'
    | 'Gillies Creek'
    | 'Rockfalls Creek'
    | 'Along Creek'
    | 'Albro Creek'
    | 'Grindall Creek'
    | 'Falling Creek'
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

interface StreamsFeatureGeometryPolygon {
  type: GeometryTypePolygon
  coordinates: [number, number][][]
}

interface StreamsFeatureGeometryMultiPolygon {
  type: GeometryTypeMultiPolygon
  coordinates: [number, number][][][]
}

type StreamsFeatureGeometry =
  | StreamsFeatureGeometryPolygon
  | StreamsFeatureGeometryMultiPolygon

interface StreamsFeature {
  type: 'Feature'
  properties: StreamsFeatureProperties
  geometry: StreamsFeatureGeometry
}

export interface Streams {
  type: 'FeatureCollection'
  name: string
  crs: CRS
  features: StreamsFeature[]
}

export interface MinifiedStream {
  waterBodyName: StreamsFeatureProperties['WaterBodyName']
  geometry: StreamsFeatureGeometry
}
