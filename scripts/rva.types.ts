import { DataSets } from '@/utils/RVA/types'

export interface PathsLookup<T = string> {
  rvaDirectory: string

  build: DataSets<T> & {
    directory: T
  }

  files: DataSets<T>
}
