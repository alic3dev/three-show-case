import type { PutBlobResult } from '@vercel/blob'

import fs from 'node:fs'
import path from 'node:path'

import { put /*, list*/ } from '@vercel/blob'

// TODO: List and pull info from vercel in case our JSON file isn't up to date

const pathBlobsJSON: string = path.join(__dirname, '../src/data/blobs.json')
const pathPuzzlesDir: string = path.join(__dirname, '../public/assets/puzzles')

interface Blob extends PutBlobResult {
  originalName: string
}

interface BlobLookupFile {
  puzzles?: Blob[]
}

interface FileWithData {
  file: string
  data: Buffer
}

interface FileWithPutBlobResult {
  file: string
  putBlobResult: PutBlobResult
}

new Promise<string>((resolve, reject) => {
  fs.readFile(
    pathBlobsJSON,
    { encoding: 'utf-8' },
    (err: NodeJS.ErrnoException, data: string) => {
      if (err && err.code === 'ENOENT') {
        resolve('')
      }

      if (err) {
        reject(err)
      }

      resolve(data)
    },
  )
})
  .then(
    (data: string) =>
      new Promise<BlobLookupFile>((resolve, reject) => {
        try {
          const tmpPreviousBlobs: unknown = JSON.parse(data)

          if (
            typeof tmpPreviousBlobs === 'object' &&
            !Array.isArray(tmpPreviousBlobs)
          ) {
            return resolve(tmpPreviousBlobs)
          } else {
            return reject('Invalid file found at `src/data/blobs')
          }
        } catch {
          resolve({})
        }

        resolve({})
      }),
  )
  .then(
    (previousBlobs) =>
      new Promise<{ previousBlobs: BlobLookupFile; files: string[] }>(
        (resolve, reject) =>
          fs.readdir(
            pathPuzzlesDir,
            (err: NodeJS.ErrnoException, files: string[]) => {
              if (err) {
                return reject(err)
              }

              resolve({ previousBlobs, files })
            },
          ),
      ),
  )
  .then(
    ({ previousBlobs, files }) =>
      new Promise<BlobLookupFile>((resolve, reject) => {
        const promises: Promise<FileWithData>[] = []

        if (!previousBlobs.puzzles) {
          previousBlobs.puzzles = []
        }

        for (const file of files) {
          if (
            previousBlobs.puzzles.find((puzzle) => puzzle.originalName === file)
          ) {
            continue
          }

          promises.push(
            new Promise<FileWithData>((resolve, reject): void => {
              fs.readFile(
                path.join(pathPuzzlesDir, file),
                (err: NodeJS.ErrnoException, data: Buffer): void => {
                  if (err) return reject(err)

                  resolve({ file, data })
                },
              )
            }),
          )
        }

        Promise.all<Promise<FileWithData>>(promises)
          .then((filesWithData: FileWithData[]): void => {
            Promise.all<Promise<FileWithPutBlobResult>>(
              filesWithData.map(
                (fileWithData: FileWithData) =>
                  new Promise<FileWithPutBlobResult>((resolve, reject) =>
                    put(`puzzles/puzzle.jpeg`, fileWithData.data, {
                      access: 'public',
                      multipart: true,
                    })
                      .then((putBlobResult: PutBlobResult): void =>
                        resolve({ file: fileWithData.file, putBlobResult }),
                      )
                      .catch((reason) => reject(reason)),
                  ),
              ),
            )
              .then((filesWithPutBlobResult: FileWithPutBlobResult[]): void => {
                resolve({
                  ...previousBlobs,
                  puzzles: [
                    ...previousBlobs.puzzles,
                    ...filesWithPutBlobResult.map(
                      (a): Blob => ({
                        originalName: a.file,
                        ...a.putBlobResult,
                      }),
                    ),
                  ],
                })
              })
              .catch((reason): void => reject(reason))
          })
          .catch((reason: unknown): void => reject(reason))
      }),
  )
  .then(
    (newBlobs) =>
      new Promise<void>((resolve, reject) =>
        fs.writeFile(
          pathBlobsJSON,
          JSON.stringify(newBlobs),
          { encoding: 'utf-8' },
          (err: NodeJS.ErrnoException) => {
            if (err) {
              return reject(err)
            }

            resolve()
          },
        ),
      ),
  )
  .catch((reason: unknown) => {
    throw new Error(JSON.stringify(reason))
  })

// {
//   url: 'https://gca9gd63ytt7901j.public.blob.vercel-storage.com/puzzles/-5gkI0nTtGxjz9tIoxtwFZoEkvyt2S2.jpeg',
//   downloadUrl: 'https://gca9gd63ytt7901j.public.blob.vercel-storage.com/puzzles/-5gkI0nTtGxjz9tIoxtwFZoEkvyt2S2.jpeg?download=1',
//   pathname: 'puzzles/.jpeg',
//   contentType: 'application/json',
//   contentDisposition: 'inline; filename=".jpeg"'
// }

// fs.readdir(path.join(__dirname, '../public/assets/puzzles'), (err, files) => {
//   console.log(files)
// })

// fs.readFile(
//   path.join(
//     __dirname,
//     '../public/assets/puzzles/_0a5ee09a-70ef-45d5-9534-43b7b6bb8bfe.jpeg',
//   ),
//   (err, data) => {
//     if (err || !data) return

//     put('puzzles/puzzle.jpeg', data, {
//       access: 'public',
//       multipart: true,
//     }).then((value) => {
//       console.log(value)
//     })
//   },
// )
