export type GeometryTypePolygon = 'Polygon'
export type GeometryTypeMultiPolygon = 'MultiPolygon'
export type GeometryTypePolygonOrMultiPolygon =
  | GeometryTypePolygon
  | GeometryTypeMultiPolygon

export type GeometryTypeLineString = 'LineString'
export type GeometryTypeMultiLineString = 'MultiLineString'
export type GeometryTypeLineStringOrMultiLineString =
  | GeometryTypeLineString
  | GeometryTypeMultiLineString
