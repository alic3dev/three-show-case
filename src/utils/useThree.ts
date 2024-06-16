import React from 'react'

import * as THREE from 'three'
// import WebGL from 'three/addons/capabilities/WebGL.js'

export const useThree = ({
  container,
}: {
  container: React.MutableRefObject<HTMLElement>
}) => {
  const [renderer] = React.useState<THREE.WebGLRenderer>(
    (): THREE.WebGLRenderer => {
      const newRenderer = new THREE.WebGLRenderer()
      newRenderer.setSize(window.innerWidth, window.innerHeight)

      return newRenderer
    },
  )

  React.useEffect(() => {
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    )

    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    const cube = new THREE.Mesh(geometry, material)
    scene.add(cube)

    camera.position.z = 5

    container.current?.appendChild(renderer.domElement)

    function animate() {
      cube.rotation.x += 0.01
      cube.rotation.y += 0.01

      renderer.render(scene, camera)
    }
    renderer.setAnimationLoop(animate)

    return () => {}
  }, [container, renderer])
}
