import type { PathsLookup } from '@/../scripts/rva.types'

import type {
  Boundary,
  Contours,
  Lakes,
  MinifiedBoundary,
  MinifiedContour,
  MinifiedLake,
  MinifiedPark,
  MinifiedRailroad,
  MinifiedRoad,
  MinifiedStream,
  MinifiedStructure,
  MinifiedSurface,
  Parks,
  Railroads,
  Roads,
  Streams,
  Structures,
  Surfaces,
} from '@/utils/RVA'

import fs from 'node:fs/promises'
import path from 'node:path'

const rvaDirectory: string = path.join(__dirname, '../public/assets/RVA')
const buildDirectory: string = path.join(rvaDirectory, 'build')

const paths: PathsLookup = {
  rvaDirectory,

  build: {
    directory: buildDirectory,
    contours: path.join(buildDirectory, 'contours.json'),
    roads: path.join(buildDirectory, 'roads.json'),
    railroads: path.join(buildDirectory, 'railroads.json'),
    structures: path.join(buildDirectory, 'structures.json'),
    lakes: path.join(buildDirectory, 'lakes.json'),
    streams: path.join(buildDirectory, 'streams.json'),
    boundary: path.join(buildDirectory, 'boundary.json'),
    parks: path.join(buildDirectory, 'parks.json'),
    surfaces: path.join(buildDirectory, 'surfaces.json'),
  },

  files: {
    contours: path.join(rvaDirectory, 'Contours_.geojson'),
    roads: path.join(rvaDirectory, 'Roads.geojson'),
    railroads: path.join(rvaDirectory, 'Railroads_865801541003419662.geojson'),
    structures: path.join(rvaDirectory, 'Structures.geojson'),
    lakes: path.join(rvaDirectory, 'Lakes.geojson'),
    streams: path.join(rvaDirectory, 'Streams_(Polygon).geojson'),
    boundary: path.join(
      rvaDirectory,
      'CityBoundary_-4850500386491438773.geojson',
    ),
    parks: path.join(rvaDirectory, 'Parks.geojson'),
    surfaces: path.join(rvaDirectory, 'Transportation_Surfaces.geojson'),
  },
}

async function processContours(): Promise<void> {
  const contours: Contours = JSON.parse(
    await fs.readFile(paths.files.contours, { encoding: 'utf8' }),
  )

  const minifiedContours: MinifiedContour[] = []

  for (const feature of contours.features) {
    minifiedContours.push({
      ...feature.properties,
      geometry: feature.geometry,
    })
  }

  await fs.writeFile(paths.build.contours, JSON.stringify(minifiedContours), {
    encoding: 'utf8',
  })
}

async function processRoads(): Promise<void> {
  const roads: Roads = JSON.parse(
    await fs.readFile(paths.files.roads, { encoding: 'utf8' }),
  )

  const minifiedRoads: MinifiedRoad[] = []

  for (const feature of roads.features) {
    minifiedRoads.push({
      objectId: feature.properties.OBJECTID,
      paved: feature.properties.Paved === 'Yes',
      globalID: feature.properties.GlobalID,
      shapeArea: feature.properties.Shape__Area,
      shapeLength: feature.properties.Shape__Length,

      geometry: feature.geometry,
    })
  }

  await fs.writeFile(paths.build.roads, JSON.stringify(minifiedRoads), {
    encoding: 'utf8',
  })
}

// Extent contains the resource: true
//  West longitude: -77.611835
//  East longitude: -77.371185
//  North latitude: 37.59176
//  South latitude: 37.438014

// FIXME: In EPSG:2284 while rest of data is in WGS84
async function processRailroads(): Promise<void> {
  const railroads: Railroads = JSON.parse(
    await fs.readFile(paths.files.railroads, { encoding: 'utf8' }),
  )

  const minifiedRailroads: MinifiedRailroad[] = []

  for (const feature of railroads.features) {
    minifiedRailroads.push({
      SubType: feature.properties.SubType,
      geometry: feature.geometry,
    })
  }

  await fs.writeFile(paths.build.railroads, JSON.stringify(minifiedRailroads), {
    encoding: 'utf8',
  })
}

async function processStructures(): Promise<void> {
  const structures: Structures = JSON.parse(
    await fs.readFile(paths.files.structures, { encoding: 'utf8' }),
  )

  const minifiedStructures: MinifiedStructure[] = []

  for (const feature of structures.features) {
    minifiedStructures.push({
      comment: feature.properties.Comment,
      fips: feature.properties.FIPS,
      ruleIdDs: feature.properties.RuleID_DS,
      subType: feature.properties.Subtype,
      geometry: feature.geometry,
    })
  }

  await fs.writeFile(
    paths.build.structures,
    JSON.stringify(minifiedStructures),
    {
      encoding: 'utf8',
    },
  )
}

async function processLakes(): Promise<void> {
  const lakes: Lakes = JSON.parse(
    await fs.readFile(paths.files.lakes, { encoding: 'utf8' }),
  )

  const minifiedLakes: MinifiedLake[] = []

  for (const feature of lakes.features) {
    minifiedLakes.push({
      commonName: feature.properties.CommonName,
      geometry: feature.geometry,
    })
  }

  await fs.writeFile(paths.build.lakes, JSON.stringify(minifiedLakes), {
    encoding: 'utf8',
  })
}

async function processStreams(): Promise<void> {
  const streams: Streams = JSON.parse(
    await fs.readFile(paths.files.streams, { encoding: 'utf8' }),
  )

  const minifiedStreams: MinifiedStream[] = []

  for (const feature of streams.features) {
    minifiedStreams.push({
      waterBodyName: feature.properties.WaterBodyName,
      geometry: feature.geometry,
    })
  }

  await fs.writeFile(paths.build.streams, JSON.stringify(minifiedStreams), {
    encoding: 'utf8',
  })
}

async function processBoundary(): Promise<void> {
  const boundary: Boundary = JSON.parse(
    await fs.readFile(paths.files.boundary, { encoding: 'utf8' }),
  )

  const minifiedBoundary: MinifiedBoundary =
    boundary.features[0].geometry.coordinates[0]

  await fs.writeFile(paths.build.boundary, JSON.stringify(minifiedBoundary), {
    encoding: 'utf8',
  })
}

async function processParks(): Promise<void> {
  const parks: Parks = JSON.parse(
    await fs.readFile(paths.files.parks, { encoding: 'utf8' }),
  )

  const minifiedParks: MinifiedPark[] = []

  for (const feature of parks.features) {
    minifiedParks.push({
      name: feature.properties.ParkName,
      type: feature.properties.ParkType,
      owner: feature.properties.ParkOwner,
      maintainer: feature.properties.ParkMaintainer,
      geometry: feature.geometry,
    })
  }

  await fs.writeFile(paths.build.parks, JSON.stringify(minifiedParks), {
    encoding: 'utf8',
  })
}

async function processSurfaces(): Promise<void> {
  const surfaces: Surfaces = JSON.parse(
    await fs.readFile(paths.files.surfaces, { encoding: 'utf8' }),
  )

  const minifiedSurfaces: MinifiedSurface[] = []

  for (const feature of surfaces.features) {
    minifiedSurfaces.push({
      subType: feature.properties.SubType,
      paved: feature.properties.Paved === 'Yes',
      geometry: feature.geometry,
    })
  }

  await fs.writeFile(paths.build.surfaces, JSON.stringify(minifiedSurfaces), {
    encoding: 'utf8',
  })
}

async function process(
  name: string,
  icon: string,
  processFunction: () => Promise<void>,
): Promise<boolean> {
  console.log(`Processing: ${icon} ${name}...`)

  try {
    await processFunction()
  } catch {
    console.log(`Failed    : ❌ ${name}\n`)
    return false
  }

  console.log(`Processed : ✅ ${name}\n`)

  return true
}

async function main(): Promise<void> {
  await fs.mkdir(paths.build.directory, { recursive: true })

  await process('Contours', '⛰️ ', processContours)
  await process('Roads', '🛣️ ', processRoads)
  await process('Railroads', '🛤️ ', processRailroads)
  await process('Structures', '🏘️ ', processStructures)
  await process('Lakes', '💧', processLakes)
  await process('Streams', '💦', processStreams)
  await process('Boundary', '⭕️', processBoundary)
  await process('Parks', '🏞️ ', processParks)
  await process('Surfaces', '🚗', processSurfaces)
}

main()
