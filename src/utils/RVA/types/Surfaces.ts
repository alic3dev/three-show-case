import type { UUID } from 'node:crypto'

import type { CRS } from '@/utils/RVA/types/CRS'
import type { FIPS } from '@/utils/RVA/types/FIPS'
import type {
  GeometryTypeMultiPolygon,
  GeometryTypePolygon,
} from '@/utils/RVA/types/Geometry'
import type { YesNo } from '@/utils/RVA/types/YesNo'

// 3: Driveway, 4: Parking, 8: Sidewalk, 5: Bridge, 7: Median, 9: Alley, 10: Ballast, 6: Overpass
export enum SurfacesFeaturePropertiesSubType {
  Driveway = 3,
  Parking = 4,
  Sidewalk = 8,
  Bridge = 5,
  Median = 7,
  Alley = 9,
  Ballast = 10,
  Overpass = 6,
}

export interface SurfacesFeaturePropertiesSubTypeLookup
  extends Record<
    keyof typeof SurfacesFeaturePropertiesSubType,
    SurfacesFeaturePropertiesSubType
  > {
  Driveway: SurfacesFeaturePropertiesSubType.Driveway
  Parking: SurfacesFeaturePropertiesSubType.Parking
  Sidewalk: SurfacesFeaturePropertiesSubType.Sidewalk
  Bridge: SurfacesFeaturePropertiesSubType.Bridge
  Median: SurfacesFeaturePropertiesSubType.Median
  Alley: SurfacesFeaturePropertiesSubType.Alley
  Ballast: SurfacesFeaturePropertiesSubType.Ballast
  Overpass: SurfacesFeaturePropertiesSubType.Overpass
}

interface SurfacesFeatureProperties {
  OBJECTID: number
  SubType: SurfacesFeaturePropertiesSubType
  FIPS: FIPS.Richmond
  Paved: YesNo
  CreatedBy: 'richmondvagis'
  CreatedDate: string
  EditBy: 'richmondvagis'
  EditDate: string
  GlobalID: UUID
  Shape__Area: number
  Shape__Length: number
}

interface SurfacesFeatureGeometryPolygon {
  type: GeometryTypePolygon
  coordinates: [number, number][][]
}

interface SurfacesFeatureGeometryMultiPolygon {
  type: GeometryTypeMultiPolygon
  coordinates: [number, number][][][]
}

type SurfacesFeatureGeometry =
  | SurfacesFeatureGeometryPolygon
  | SurfacesFeatureGeometryMultiPolygon

interface SurfacesFeature {
  type: 'Feature'
  properties: SurfacesFeatureProperties
  geometry: SurfacesFeatureGeometry
}

export interface Surfaces {
  type: 'FeatureCollection'
  name: 'Transportation_Surfaces'
  crs: CRS
  features: SurfacesFeature[]
}

export interface MinifiedSurface {
  subType: SurfacesFeatureProperties['SubType']
  paved: boolean
  geometry: SurfacesFeatureGeometry
}
