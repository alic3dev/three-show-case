export * from '@/utils/RVA/types/Boundary'
export * from '@/utils/RVA/types/Contours'
export * from '@/utils/RVA/types/CRS'
export * from '@/utils/RVA/types/FIPS'
export * from '@/utils/RVA/types/Geometry'
export * from '@/utils/RVA/types/Lakes'
export * from '@/utils/RVA/types/Parks'
export * from '@/utils/RVA/types/Railroads'
export * from '@/utils/RVA/types/Roads'
export * from '@/utils/RVA/types/Streams'
export * from '@/utils/RVA/types/Structures'
export * from '@/utils/RVA/types/Surfaces'
export * from '@/utils/RVA/types/YesNo'

export type DataSetName =
  | 'contours'
  | 'roads'
  | 'railroads'
  | 'structures'
  | 'lakes'
  | 'streams'
  | 'boundary'
  | 'parks'
  | 'surfaces'

export type DataSets<T = string> = {
  [name in DataSetName]: T
}
