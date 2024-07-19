import type { Dirent } from 'node:fs'
import type { UUID } from 'crypto'
import type { PutObjectOutput } from '@aws-sdk/client-s3'

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

import path from 'node:path'
import fs from 'node:fs/promises'

const pathAssetsFolder: string = path.join(__dirname, '../public/assets/')

const pathCloudFrontJSON: string = path.join(__dirname, './data/cf.json')
const pathCloudFrontClientJSON: string = path.join(
  __dirname,
  '../src/data/cf-client.json',
)

const ignoredFiles: string[] = ['.DS_Store']

interface CloudFrontFileData {
  name: string
  UUID: UUID
  ext: string
  mtimeMs: number
}

interface CloudFrontData {
  modifiedAt: string
  files: Record<string, CloudFrontFileData>
}

async function main(): Promise<void> {
  const dir: Dirent[] = await fs.readdir(pathAssetsFolder, {
    withFileTypes: true,
    recursive: true,
  })

  const relativeFilePaths: string[] = dir
    .filter(
      (file: Dirent): boolean =>
        file.isFile() && !ignoredFiles.includes(file.name),
    )
    .map((file: Dirent): string =>
      path.join(path.relative(pathAssetsFolder, file.parentPath), file.name),
    )
    .filter((filePath: string): boolean => filePath.length > 0)

  const cfDataJSONContent: string = await fs.readFile(pathCloudFrontJSON, {
    encoding: 'utf-8',
  })

  let cfData: CloudFrontData = {
    modifiedAt: new Date().toJSON(),
    files: {},
  }

  try {
    cfData = JSON.parse(cfDataJSONContent)

    if (!cfData.files) {
      cfData.files = {}
    }
  } catch {
    /* Empty */
  }

  let client: S3Client | null = null

  const filesToUpload: Record<string, CloudFrontFileData> = {}

  for (const filePath of relativeFilePaths) {
    const fullFilePath = path.join(pathAssetsFolder, filePath)
    const fileStat = await fs.stat(fullFilePath)

    const ext: string = path.extname(filePath)

    if (cfData.files[filePath]) {
      const cfFileData: CloudFrontFileData = cfData.files[filePath]

      if (cfFileData.mtimeMs < fileStat.mtimeMs) {
        cfFileData.mtimeMs = fileStat.mtimeMs
        filesToUpload[fullFilePath] = cfFileData
      }
    } else {
      const cfFileData: CloudFrontFileData = {
        name: filePath,
        UUID: crypto.randomUUID(),
        ext,
        mtimeMs: fileStat.mtimeMs,
      }

      while (
        Object.values(cfData.files).find(
          (prevFile: CloudFrontFileData): boolean =>
            prevFile.UUID === cfFileData.UUID,
        )
      ) {
        cfFileData.UUID = crypto.randomUUID()
      }

      filesToUpload[fullFilePath] = cfFileData
    }
  }

  const filesToUploadSorted: [string, CloudFrontFileData][] = Object.entries(
    filesToUpload,
  ).sort(
    (
      [fullFilePathA, cfFileDataA]: [string, CloudFrontFileData],
      [fullFilePathB, cfFileDataB]: [string, CloudFrontFileData],
    ): number => {
      if (cfFileDataA.ext === cfFileDataB.ext) {
        return fullFilePathA.localeCompare(fullFilePathB)
      } else if (cfFileDataA.ext === '.gltf') {
        return 1
      } else if (cfFileDataB.ext === '.gltf') {
        return -1
      }

      return fullFilePathA.localeCompare(fullFilePathB)
    },
  )

  const uploadFile = async (
    fullFilePath: string,
    cfFileData: CloudFrontFileData,
  ): Promise<void> => {
    if (!client) {
      client = new S3Client()
    }

    let putObjectOutput: PutObjectOutput

    if (cfFileData.ext === '.gltf') {
      let fileData: string = await fs.readFile(fullFilePath, {
        encoding: 'utf8',
      })

      const dirPath: string = path.dirname(cfFileData.name)

      const associatedFiles: string[] = Object.keys(cfData.files)
        .filter((fileName: string): boolean => fileName.startsWith(dirPath))
        .map((filePath: string): string =>
          filePath.substring(dirPath.length + 1),
        )

      for (const associatedFile of associatedFiles) {
        const associatedFileData: CloudFrontFileData =
          cfData.files[`${dirPath}/${associatedFile}`]

        fileData = fileData.replaceAll(
          `"${associatedFile}"`,
          `"${associatedFileData.UUID}${associatedFileData.ext}"`,
        )
      }

      putObjectOutput = await client.send(
        new PutObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: `${process.env.VITE_CF_PREFIX}${cfFileData.UUID}${cfFileData.ext}`,
          Body: fileData,
        }),
      )
    } else {
      const fileData: Buffer = await fs.readFile(fullFilePath)

      putObjectOutput = await client.send(
        new PutObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: `${process.env.VITE_CF_PREFIX}${cfFileData.UUID}${cfFileData.ext}`,
          Body: fileData,
        }),
      )
    }

    if (putObjectOutput['$metadata'].httpStatusCode !== 200) {
      throw new Error(JSON.stringify(putObjectOutput))
    }

    console.log(
      `Uploaded: ${cfFileData.name} [${cfFileData.UUID}${cfFileData.ext}]`,
    )

    cfData.files[cfFileData.name] = cfFileData

    await fs.writeFile(pathCloudFrontJSON, JSON.stringify(cfData), {
      encoding: 'utf-8',
    })

    await fs.writeFile(
      pathCloudFrontClientJSON,
      JSON.stringify(
        Object.values(cfData.files).reduce((output, file) => {
          output[file.name] = `${file.UUID}${file.ext}`

          return output
        }, {}),
      ),
      {
        encoding: 'utf-8',
      },
    )
  }

  for (const [fullFilePath, cfFileData] of filesToUploadSorted) {
    await uploadFile(fullFilePath, cfFileData)
  }

  cfData.modifiedAt = new Date().toJSON()
}

main()
