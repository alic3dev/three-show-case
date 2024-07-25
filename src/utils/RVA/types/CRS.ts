type CRSNameCRS84 = 'urn:ogc:def:crs:OGC:1.3:CRS84'
export type CRSNameEPSG2284 = 'EPSG:2284'

type CRSName = CRSNameCRS84 | CRSNameEPSG2284

interface CRSProperties<N extends CRSName> {
  name: N
}

export interface CRS<N extends CRSName = CRSNameCRS84> {
  type: 'name'
  properties: CRSProperties<N>
}
