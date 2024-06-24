export function quadsToTriangles(vertices: Float32Array): Float32Array {
  if (vertices.length % 12 !== 0) {
    throw new Error('Invalid vertices passed')
  }

  const triangleVertices: Float32Array = new Float32Array(
    vertices.length + (vertices.length / 12) * 6,
  ).fill(-1)

  for (
    let i: number = 0, tI: number = 0;
    i < vertices.length;
    i += 12, tI += 18
  ) {
    triangleVertices[tI] = vertices[i]
    triangleVertices[tI + 1] = vertices[i + 1]
    triangleVertices[tI + 2] = vertices[i + 2]

    triangleVertices[tI + 3] = vertices[i + 3]
    triangleVertices[tI + 4] = vertices[i + 4]
    triangleVertices[tI + 5] = vertices[i + 5]

    triangleVertices[tI + 6] = vertices[i + 6]
    triangleVertices[tI + 7] = vertices[i + 7]
    triangleVertices[tI + 8] = vertices[i + 8]

    triangleVertices[tI + 9] = vertices[i + 9]
    triangleVertices[tI + 10] = vertices[i + 10]
    triangleVertices[tI + 11] = vertices[i + 11]

    triangleVertices[tI + 12] = vertices[i]
    triangleVertices[tI + 13] = vertices[i + 1]
    triangleVertices[tI + 14] = vertices[i + 2]

    triangleVertices[tI + 15] = vertices[i + 6]
    triangleVertices[tI + 16] = vertices[i + 7]
    triangleVertices[tI + 17] = vertices[i + 8]
  }

  return triangleVertices
}
