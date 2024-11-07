import * as _FaceLandmarksDetection from '@tensorflow-models/face-landmarks-detection'
type FaceLandmarksDetection = typeof _FaceLandmarksDetection

declare global {
  interface Window {
    faceLandmarksDetection: () => Promise<FaceLandmarksDetection>
  }
}

export const addFaceLandmarksDetectionLoaderToWindow = (): void => {
  if (Object.prototype.hasOwnProperty.call(window, 'faceLandmarksDetection'))
    return

  window.faceLandmarksDetection = (): Promise<FaceLandmarksDetection> =>
    new Promise<FaceLandmarksDetection>(
      (resolve: (value: FaceLandmarksDetection) => void): void => {
        import('@tensorflow-models/face-landmarks-detection').then(
          (c: FaceLandmarksDetection): void => resolve(c),
        )
      },
    )
}
