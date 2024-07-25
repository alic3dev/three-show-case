import type { CRS, CRSNameEPSG2284 } from '@/utils/RVA/types/CRS'
import type { GeometryTypePolygon } from '@/utils/RVA/types/Geometry'

interface BoundaryFeatureGeometry {
  type: GeometryTypePolygon
  coordinates: [[number, number][]]
}

interface BoundaryFeatureProperties {
  OBJECTID: 1
  CreatedBy: 'parrish.simmons_cor'
  CreatedDate: 'Tue, 05 May 2020 12:18:12 GMT'
  EditBy: 'parrish.simmons_cor'
  EditDate: 'Tue, 05 May 2020 12:18:12 GMT'
  GlobalID: 'fd776b7c-26cf-4a4f-939b-8d2d7ce4bdc6'
}

interface BoundaryFeature {
  type: 'Feature'
  id: 1
  geometry: BoundaryFeatureGeometry
  properties: BoundaryFeatureProperties
}

export type MinifiedBoundary = [number, number][]

export interface Boundary {
  type: 'FeatureCollection'
  crs: CRS<CRSNameEPSG2284>
  features: BoundaryFeature[]
}
