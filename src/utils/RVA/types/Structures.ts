import type { UUID } from 'node:crypto'

import type { CRS } from '@/utils/RVA/types/CRS'
import type { FIPS } from '@/utils/RVA/types/FIPS'
import type {
  GeometryTypePolygon,
  GeometryTypeMultiPolygon,
} from '@/utils/RVA/types/Geometry'

// 1: Building, 3: Deck/Patio
enum StructuresFeaturePropertiesSubtype {
  Building = 1,
  DeckOrPatio = 3,
}

// 1: building; deck/patio; ruins or foundation, 0: other
enum StructuresFeaturePropertiesRuleID_DS {
  BuildingOrDeckPatioOrRuinsOrFoundation = 1,
  Other = 0,
}

interface StructuresFeatureProperties {
  Subtype: StructuresFeaturePropertiesSubtype
  FIPS: FIPS
  PermitID: string | null
  FinalDemolitionPermitID:
    | 'BLDR-057704-19'
    | 'BLDR-092233-21'
    | 'BLDR-053148-19'
    | 'BLDR-032048-18'
    | '2/6/20'
    | '6-9-20'
    | 'BLDR025300-2017'
    | null
  Comment:
    | ''
    | null
    | '8/10/20'
    | '04/11/05'
    | '02/05/08'
    | '6/10/20'
    | '08/15/08'
    | '01/18/07'
    | '3/25/19'
    | 'verify the Adoption Date'
    | 'NO PERMIT,  VCU'
    | 'edit Permit ID & Adoption Date'
    | 'NO PERMIT,  STATE PROPERTY'
    | 'Needs to update PermitID & AdoptionDate'
    | 'No permit,  Federal project'
    | '09/29/06'
    | '12/15/93'
    | '10/10/06'
    | '05/25/04'
    | '12/04/07'
    | '02/01/07'
    | '12/14/05'
    | 'B10081703'
    | 'Satan'
    | '01/22/07'
    | 'Permit Expired -- check'
    | '06/16/07'
    | '04/26/06'
    | ' '
    | '6 units'
    | '2113 Cedar St'
    | 'BLDR-038692-2018'
    | 'B13111302'
    | 'BLDR-029219-2018'
    | 'BLDC-039582-2018'
    | 'completed 2018'
    | '11/30/18'
    | 'BLDR-102079-2022'
    | '5/4/21'
    | 'Active'
    | 'needs to update'
    | '07/22/06'
    | '11/27/23'
  AdoptionDate: string | null
  RuleID_DS: StructuresFeaturePropertiesRuleID_DS
  Override_DS: ''
  CreatedBy: 'richard.morton_cor'
  CreatedDate: string
  EditBy: 'richard.morton_cor'
  EditDate: string
  GlobalID: UUID
  OBJECTID: number
  Shape__Area: number
  Shape__Length: number
}

interface StructuresFeatureGeometryPolygon {
  type: GeometryTypePolygon
  coordinates: [number, number][][]
}

interface StructuresFeatureGeometryMultiPolygon {
  type: GeometryTypeMultiPolygon
  coordinates: [number, number][][][]
}

type StructuresFeatureGeometry =
  | StructuresFeatureGeometryPolygon
  | StructuresFeatureGeometryMultiPolygon

interface StructuresFeature {
  type: 'Feature'
  properties: StructuresFeatureProperties
  geometry: StructuresFeatureGeometry
}

export interface Structures {
  type: 'FeatureCollection'
  name: 'Structures'
  crs: CRS
  features: StructuresFeature[]
}

export interface MinifiedStructure {
  comment: StructuresFeatureProperties['Comment']
  fips: StructuresFeatureProperties['FIPS']
  ruleIdDs: StructuresFeatureProperties['RuleID_DS']
  subType: StructuresFeatureProperties['Subtype']
  geometry: StructuresFeatureGeometry
}
