import type { SharedSizesInterface } from '@/utils/city/types'

import * as THREE from 'three'

export function generateGrid({
  scale,
  sizes,
}: {
  scale: number
  sizes: SharedSizesInterface
}): THREE.GridHelper {
  const grid = new THREE.GridHelper(
    Math.max(sizes.groundSize.x, sizes.groundSize.y),
    (Math.max(sizes.roadSize.x, sizes.roadSize.y) + sizes.groundExtraSpacing) *
      10,
    0xf0f000,
    0x00f0f0,
  )

  grid.position.set(
    ((1 + sizes.roadMax.x + sizes.roadMin.x) * scale) / 2,
    (sizes.sidewalkHeight + 0.001) * scale,
    ((1 + sizes.roadMax.y + sizes.roadMin.y) * scale) / 2,
  )

  grid.scale.set(
    sizes.groundSize.x >= sizes.groundSize.y
      ? 1
      : sizes.groundSize.x / sizes.groundSize.y,
    1,
    sizes.groundSize.y >= sizes.groundSize.x
      ? 1
      : sizes.groundSize.y / sizes.groundSize.x,
  )
  grid.visible = false

  return grid
}
