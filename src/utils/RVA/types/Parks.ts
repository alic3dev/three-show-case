import type { UUID } from 'node:crypto'

import type { CRS } from '@/utils/RVA/types/CRS'
import type {
  GeometryTypePolygon,
  GeometryTypeMultiPolygon,
} from '@/utils/RVA/types/Geometry'

interface ParksFeatureGeometryPolyGon {
  type: GeometryTypePolygon
  coordinates: [number, number][][]
}

interface ParksFeatureGeometryMultiPolyGon {
  type: GeometryTypeMultiPolygon
  coordinates: [number, number][][][]
}

type ParksFeatureGeometry =
  | ParksFeatureGeometryPolyGon
  | ParksFeatureGeometryMultiPolyGon

interface ParksFeatureProperties {
  OBJECTID: number
  ParkName: string
  ParkType:
    | 'playground'
    | 'mini-park'
    | 'cemetery'
    | 'neighborhood park'
    | 'open space'
    | 'school'
    | 'regional park'
    | 'community center'
    | 'facility'
    | 'sports complex'
    | 'pool'
    | 'linear park'
  ParkOwner:
    | 'Parks'
    | 'Schools'
    | 'RRHA'
    | 'RRHA/Parks'
    | 'Private'
    | 'Parks/DPU'
    | 'Parks '
    | 'State'
    | 'VDOT'
    | 'Utilities'
  ParkMaintainer:
    | 'Parks'
    | 'Parks/DPW'
    | 'Cemeteries'
    | 'Schools'
    | 'Contract'
    | 'RRHA'
    | 'Parks/DPW/RRHA'
    | 'DPU'
    | 'Parks/Sch/RRHA'
    | 'Parks/Schools'
    | 'Library'
    | 'DPW'
    | 'Parks/VCU'
  Location: '' | null
  CreatedBy: 'richmondvagis'
  CreatedDate: string
  EditBy: 'richmondvagis'
  EditDate: string
  GlobalID: UUID
  Shape__Area: number
  Shape__Length: number
}

interface ParksFeature {
  type: 'Feature'
  properties: ParksFeatureProperties
  geometry: ParksFeatureGeometry
}

export interface Parks {
  type: 'FeatureCollection'
  name: 'Parks'
  crs: CRS
  features: ParksFeature[]
}

export interface MinifiedPark {
  name: string
  type: ParksFeatureProperties['ParkType']
  owner: ParksFeatureProperties['ParkOwner']
  maintainer: ParksFeatureProperties['ParkMaintainer']
  geometry: ParksFeatureGeometry
}
