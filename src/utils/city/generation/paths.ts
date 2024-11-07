import * as THREE from 'three'

export async function generatePaths({
  incrementLoadState = (): void => {},
}: {
  incrementLoadState?: () => void
}): Promise<THREE.Group> {
  const paths: THREE.Group = new THREE.Group()

  incrementLoadState()

  return paths
}
