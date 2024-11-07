import type * as THREE from 'three'

import type { DistrictLookup, SharedSizesInterface } from '@/utils/city/types'

import { District } from '@/utils/city/District'

export async function generateDistricts({
  roadLayout,
  sizes,
  scale,
}: {
  roadLayout: THREE.Vector2[]
  sizes: SharedSizesInterface
  scale: number
}): Promise<DistrictLookup> {
  const districts: DistrictLookup = {
    cityCenter: new District({
      position:
        roadLayout[Math.floor(Math.random() * roadLayout.length)].clone(),
      radius:
        (Math.random() * Math.min(sizes.roadSize.x, sizes.roadSize.y)) / 16 +
        Math.min(sizes.roadSize.x, sizes.roadSize.y) / 8,
      scale,
    }),
  }

  return districts
}
