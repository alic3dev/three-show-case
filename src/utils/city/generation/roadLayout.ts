import * as THREE from 'three'

export async function generateRoadLayout({
  roadSpacing = new THREE.Vector2(8, 4),
  roadTiles = 2000,
}: {
  roadSpacing?: THREE.Vector2 | number
  roadTiles?: number
}): Promise<THREE.Vector2[]> {
  const roads: THREE.Vector2[] = [new THREE.Vector2(0, 0)]

  if (typeof roadSpacing === 'number') {
    roadSpacing = new THREE.Vector2(roadSpacing, roadSpacing)
  }

  for (let i: number = 0; i < roadTiles; i++) {
    const selectedRoad: THREE.Vector2 =
      roads[Math.floor(Math.random() * roads.length)].clone()

    const direction: THREE.Vector2 = new THREE.Vector2(0, 0)

    if (Math.random() > 0.5) {
      direction.setX(Math.random() > 0.5 ? 1 : -1)
    } else {
      direction.setY(Math.random() > 0.5 ? 1 : -1)
    }

    const newRoad: THREE.Vector2 = selectedRoad.add(direction)

    if (
      roads.find((road: THREE.Vector2): boolean => {
        if (road.x === newRoad.x && road.y === newRoad.y) {
          return true
        }

        if (direction.x) {
          if (road.x === newRoad.x) {
            if (Math.abs(road.y - newRoad.y) <= roadSpacing.y) {
              return true
            }
          }
        } else {
          if (road.y === newRoad.y) {
            if (Math.abs(road.x - newRoad.x) <= roadSpacing.x) {
              return true
            }
          }
        }

        return false
      })
    ) {
      i--
      continue
    }

    roads.push(newRoad)
  }

  return roads
}
