import type { DataSets } from '@/utils/CHO/types'

import * as shapefile from 'shapefile'

import fs from 'node:fs/promises'
import path from 'node:path'

import { processWithLog } from '@/utils/helpers/processWithLog'

const choDirectory: string = path.join(__dirname, '../public/assets/CHO')
const buildDirectory: string = path.join(choDirectory, 'build')

export interface PathsLookup<T = string> {
  choDirectory: string

  build: DataSets<T> & {
    directory: T
  }

  files: DataSets<T>
}

const paths: PathsLookup = {
  choDirectory,

  build: {
    architectural_design_control_districts: path.join(
      buildDirectory,
      'architectural_design_control_districts.json',
    ),
    directory: buildDirectory,
    bicycle_lane: path.join(buildDirectory, 'bicycle_lane.json'),
    bicycle_rack: path.join(buildDirectory, 'bicycle_rack.json'),
    contour_line_2006_2ft: path.join(
      buildDirectory,
      'contour_line_2006_2ft.json',
    ),
    elementary_school_zone_area: path.join(
      buildDirectory,
      'elementary_school_zone_area.json',
    ),
    entrance_corridor_area: path.join(
      buildDirectory,
      'entrance_corridor_area.json',
    ),
    historic_conservation_district_area: path.join(
      buildDirectory,
      'historic_conservation_district_area.json',
    ),
    municipal_boundary_area: path.join(
      buildDirectory,
      'municipal_boundary_area.json',
    ),
    parcel_area: path.join(buildDirectory, 'parcel_area.json'),
    parcel_point: path.join(buildDirectory, 'parcel_point.json'),
    park_area: path.join(buildDirectory, 'park_area.json'),
    parking_exempt_area: path.join(buildDirectory, 'parking_exempt_area.json'),
    pedestrian_sidewalk_area: path.join(
      buildDirectory,
      'pedestrian_sidewalk_area.json',
    ),
    pedestrian_sidewalk_bridge_area: path.join(
      buildDirectory,
      'pedestrian_sidewalk_bridge_area.json',
    ),
    pedestrian_walkway_area: path.join(
      buildDirectory,
      'pedestrian_walkway_area.json',
    ),
    planning_area: path.join(buildDirectory, 'planning_area.json'),
    railroad_centerline: path.join(buildDirectory, 'railroad_centerline.json'),
    road_area: path.join(buildDirectory, 'road_area.json'),
    road_bridge_area: path.join(buildDirectory, 'road_bridge_area.json'),
    road_centerline: path.join(buildDirectory, 'road_centerline.json'),
    structure_existing_area: path.join(
      buildDirectory,
      'structure_existing_area.json',
    ),
    surface_water_course_area: path.join(
      buildDirectory,
      'surface_water_course_area.json',
    ),
    surface_water_course_line: path.join(
      buildDirectory,
      'surface_water_course_line.json',
    ),
    trail_line: path.join(buildDirectory, 'trail_line.json'),
    vehicle_alley_area: path.join(buildDirectory, 'vehicle_alley_area.json'),
    vehicle_driveway_area: path.join(
      buildDirectory,
      'vehicle_driveway_area.json',
    ),
    vehicle_parking_area: path.join(
      buildDirectory,
      'vehicle_parking_area.json',
    ),
    wetland_area: path.join(buildDirectory, 'wetland_area.json'),
  },

  files: {
    architectural_design_control_districts: path.join(
      choDirectory,
      'ADC_district_area',
      'ADC_district_area_11_02_2023.shp',
    ),
    bicycle_lane: path.join(
      choDirectory,
      'bicycle_lane_line',
      'bicycle_lane_line_11_02_2023.shp',
    ),
    bicycle_rack: path.join(
      choDirectory,
      'bicycle_rack_point',
      'bicycle_rack_point_11_02_2023.shp',
    ),

    contour_line_2006_2ft: path.join(
      choDirectory,
      'contour_line_2006_2ft',
      'contour_line_2006_2ft.shp',
    ),

    elementary_school_zone_area: path.join(
      choDirectory,
      'elementary_school_zone_area',
      'elementary_school_zone_area_11_02_2023.shp',
    ),
    entrance_corridor_area: path.join(
      choDirectory,
      'entrance_corridor_area',
      'entrance_corridor_area_11_02_2023.shp',
    ),
    historic_conservation_district_area: path.join(
      choDirectory,
      'historic_conservation_district_area',
      'historic_conservation_district_area_11_02_2023.shp',
    ),
    municipal_boundary_area: path.join(
      choDirectory,
      'municipal_boundary_area',
      'municipal_boundary_area_11_02_2023.shp',
    ),
    parcel_area: path.join(
      choDirectory,
      'parcel_area',
      'parcel_area_11_02_2023.shp',
    ),
    parcel_point: path.join(
      choDirectory,
      'parcel_point',
      'parcel_point_11_02_2023.shp',
    ),
    park_area: path.join(choDirectory, 'park_area', 'park_area_11_02_2023.shp'),
    parking_exempt_area: path.join(
      choDirectory,
      'parking_exempt_area',
      'parking_exempt_area_11_02_2023.shp',
    ),
    pedestrian_sidewalk_area: path.join(
      choDirectory,
      'pedestrian_sidewalk_area',
      'pedestrian_sidewalk_area_11_02_2023.shp',
    ),
    pedestrian_sidewalk_bridge_area: path.join(
      choDirectory,
      'pedestrian_sidewalk_bridge_area',
      'pedestrian_sidewalk_bridge_area_11_02_2023.shp',
    ),
    pedestrian_walkway_area: path.join(
      choDirectory,
      'pedestrian_walkway_area',
      'pedestrian_walkway_area_11_02_2023.shp',
    ),
    planning_area: path.join(
      choDirectory,
      'planning_area',
      'planning_area_11_02_2023.shp',
    ),
    railroad_centerline: path.join(
      choDirectory,
      'railroad_centerline',
      'railroad_centerline_11_02_2023.shp',
    ),
    road_area: path.join(choDirectory, 'road_area', 'road_area_11_02_2023.shp'),
    road_bridge_area: path.join(
      choDirectory,
      'road_bridge_area',
      'road_bridge_area_11_02_2023.shp',
    ),
    road_centerline: path.join(
      choDirectory,
      'road_centerline',
      'road_centerline_11_02_2023.shp',
    ),
    structure_existing_area: path.join(
      choDirectory,
      'structure_existing_area',
      'structure_existing_area_11_02_2023.shp',
    ),
    surface_water_course_area: path.join(
      choDirectory,
      'surface_water_course_area',
      'surface_water_course_area_11_02_2023.shp',
    ),
    surface_water_course_line: path.join(
      choDirectory,
      'surface_water_course_line',
      'surface_water_course_line_11_02_2023.shp',
    ),
    trail_line: path.join(
      choDirectory,
      'trail_line',
      'trail_line_11_02_2023.shp',
    ),
    vehicle_alley_area: path.join(
      choDirectory,
      'vehicle_alley_area',
      'vehicle_alley_area_11_02_2023.shp',
    ),
    vehicle_driveway_area: path.join(
      choDirectory,
      'vehicle_driveway_area',
      'vehicle_driveway_area_11_02_2023.shp',
    ),
    vehicle_parking_area: path.join(
      choDirectory,
      'vehicle_parking_area',
      'vehicle_parking_area_11_02_2023.shp',
    ),
    wetland_area: path.join(
      choDirectory,
      'wetland_area',
      'wetland_area_11_02_2023.shp',
    ),
  },
}

async function processBasic(
  inputPath: string,
  outputPath: string,
): Promise<void> {
  const source = await shapefile.open(inputPath)
  let result = await source.read()

  const geometries = []

  while (!result.done) {
    geometries.push(result.value.geometry)

    result = await source.read()
  }

  await fs.writeFile(outputPath, JSON.stringify(geometries), {
    encoding: 'utf8',
  })
}

async function processRoads(): Promise<void> {
  processBasic(paths.files.road_area, paths.build.road_area)
  processBasic(paths.files.road_bridge_area, paths.build.road_bridge_area)
  processBasic(paths.files.road_centerline, paths.build.road_centerline)
}

async function processSidewalks(): Promise<void> {
  processBasic(
    paths.files.pedestrian_sidewalk_area,
    paths.build.pedestrian_sidewalk_area,
  )
  processBasic(
    paths.files.pedestrian_sidewalk_bridge_area,
    paths.build.pedestrian_sidewalk_bridge_area,
  )
  processBasic(
    paths.files.pedestrian_walkway_area,
    paths.build.pedestrian_walkway_area,
  )
}

async function processMunicipalBoundaryArea(): Promise<void> {
  const source = await shapefile.open(paths.files.municipal_boundary_area)

  // This result has a `done` prop, not needed in this file but may be in others
  const result = await source.read()

  const coordinates: [number, number][] =
    result.value.geometry['coordinates'][0]

  await fs.writeFile(
    paths.build.municipal_boundary_area,
    JSON.stringify(coordinates),
    {
      encoding: 'utf8',
    },
  )
}

async function main(): Promise<void> {
  await fs.mkdir(paths.build.directory, { recursive: true })

  const filePathSet = new Set<string>()

  for (const fileIndex in paths.files) {
    const filePath: string = paths.files[fileIndex]

    try {
      await fs.access(filePath)

      if (filePathSet.has(filePath)) {
        console.error(`Duplicate file [${fileIndex}]: ${filePath}`)
      } else {
        filePathSet.add(filePath)
      }
    } catch (e) {
      console.error(`File doesn't exist [${fileIndex}]: ${filePath}`)
    }
  }

  for (const fileIndex in paths.build) {
    const filePath: string = `build: ${paths.build[fileIndex]}`

    if (filePathSet.has(filePath)) {
      console.log(`Duplicate output path [${fileIndex}]: ${filePath}`)
    } else {
      filePathSet.add(paths.build[fileIndex])
    }
  }

  // await processWithLog('Contours', '⛰️ ', processContours)
  await processWithLog('Roads', '🛣️ ', processRoads)
  // await processWithLog('Railroads', '🛤️ ', processRailroads)
  // await processWithLog('Structures', '🏘️ ', processStructures)
  // await processWithLog('Lakes', '💧', processLakes)
  // await processWithLog('Streams', '💦', processStreams)
  await processWithLog('Boundary', '⭕️', processMunicipalBoundaryArea)
  // await processWithLog('Parks', '🏞️ ', processParks)
  // await processWithLog('Surfaces', '🚗', processSurfaces)
  await processWithLog('Sidewalks', '🚷', processSidewalks)
}

main()
