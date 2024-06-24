import * as THREE from 'three'

const MIN_ROOMS: number = 5
const MAX_ROOMS: number = 20

type Direction = 'North' | 'South' | 'West' | 'East'

interface RoomConstructor {
  walls?: Direction[]
  doors?: Direction[]
  light?: boolean
  position?: THREE.Vector2
}

export class Room {
  public walls: Direction[]
  public doors: Direction[]
  public light: boolean
  public position: THREE.Vector2

  constructor(
    {
      walls = [],
      doors = [],
      light = false,
      position = new THREE.Vector2(0, 0),
    }: RoomConstructor = {
      walls: [],
      doors: [],
      light: false,
      position: new THREE.Vector2(),
    },
  ) {
    this.walls = walls
    this.doors = doors
    this.light = light
    this.position = position
  }
}

function addPerimeterWalls(rooms: Room[]): void {
  for (const room of rooms) {
    const adjacentRooms: Record<Direction, boolean> = {
      North: false,
      East: false,
      West: false,
      South: false,
    }

    for (const _room of rooms) {
      if (room === _room) continue

      if (room.position.y === _room.position.y) {
        if (room.position.x - 1 === _room.position.x) {
          adjacentRooms.West = true
        }

        if (room.position.x + 1 === _room.position.x) {
          adjacentRooms.East = true
        }
      } else if (room.position.x === _room.position.x) {
        if (room.position.y - 1 === _room.position.y) {
          adjacentRooms.North = true
        }

        if (room.position.y + 1 === _room.position.y) {
          adjacentRooms.South = true
        }
      }
    }

    for (const direction in adjacentRooms) {
      if (!adjacentRooms[direction as Direction]) {
        room.walls.push(direction as Direction)
      }
    }
  }
}

export function generateRoomLayout(
  minRooms: number = MIN_ROOMS,
  maxRooms: number = MAX_ROOMS,
): THREE.Vector2[] {
  const rooms: THREE.Vector2[] = [new THREE.Vector2(0, 0)]

  const numberOfRooms: number = Math.floor(
    Math.random() * (maxRooms - minRooms) + minRooms,
  )

  let roomsToUse: THREE.Vector2[] = [...rooms]

  for (let i = 1; i < numberOfRooms; i++) {
    const newRoom: THREE.Vector2 = new THREE.Vector2(0, 0)

    do {
      const roomIndex: number = Math.floor(Math.random() * roomsToUse.length)

      const randomRoom: THREE.Vector2 = roomsToUse[roomIndex]

      if (Math.random() > 0.5) {
        newRoom.x = randomRoom.x + (Math.random() > 0.5 ? 1 : -1)
        newRoom.y = randomRoom.y
      } else {
        newRoom.x = randomRoom.x
        newRoom.y = randomRoom.y + (Math.random() > 0.5 ? 1 : -1)
      }

      roomsToUse.splice(roomIndex, 1)

      if (roomsToUse.length <= 0) {
        roomsToUse = [...rooms]
      }
    } while (
      rooms.find(
        (room: THREE.Vector2): boolean =>
          room.x === newRoom.x && room.y === newRoom.y,
      )
    )

    rooms.push(newRoom)
  }

  return rooms
}

export function generateRoomLayoutWithWalls(
  minRooms: number = MIN_ROOMS,
  maxRooms: number = MAX_ROOMS,
): Room[] {
  const rooms: Room[] = [new Room()]

  const numberOfRooms: number = Math.floor(
    Math.random() * (maxRooms - minRooms) + minRooms,
  )

  let roomsToUse: Room[] = [...rooms]

  for (let i: number = 1; i < numberOfRooms; i++) {
    const newRoom: Room = new Room()

    do {
      const roomIndex: number = Math.floor(Math.random() * roomsToUse.length)

      const randomRoom: Room = roomsToUse[roomIndex]

      if (Math.random() > 0.5) {
        newRoom.position.x =
          randomRoom.position.x + (Math.random() > 0.5 ? 1 : -1)
        newRoom.position.y = randomRoom.position.y
      } else {
        newRoom.position.x = randomRoom.position.x
        newRoom.position.y =
          randomRoom.position.y + (Math.random() > 0.5 ? 1 : -1)
      }

      roomsToUse.splice(roomIndex, 1)

      if (roomsToUse.length <= 0) {
        roomsToUse = [...rooms]
      }
    } while (
      rooms.find(
        (room: Room): boolean =>
          room.position.x === newRoom.position.x &&
          room.position.y === newRoom.position.y,
      )
    )

    rooms.push(newRoom)
  }

  addPerimeterWalls(rooms)

  return rooms
}

export interface HallwaysOptions {
  minHallways: number
  maxHallways: number

  minHallwayLength: number
  maxHallwayLength: number
}

export function generateHallways(
  hallwayOptions: Partial<HallwaysOptions> = {},
): Room[] {
  const options: HallwaysOptions = {
    minHallways: 5,
    maxHallways: 10,

    minHallwayLength: 3,
    maxHallwayLength: 6,

    ...hallwayOptions,
  }

  if (options.minHallways > options.maxHallways) {
    throw new Error('Min hallways must be greater than max hallways')
  }

  if (options.minHallwayLength > options.maxHallwayLength) {
    throw new Error(
      'Min hallway length must be greater than max hallway length',
    )
  }

  const hallways: Room[] = [new Room()]
  let previousHallwayPosition: THREE.Vector2 = hallways[0].position.clone()

  let hallwayDirection: THREE.Vector2 =
    Math.random() > 0.5
      ? new THREE.Vector2(Math.random() > 0.5 ? -1 : 1, 0)
      : new THREE.Vector2(0, Math.random() > 0.5 ? -1 : 1)

  const hallwaysToGenerateCount: number = Math.round(
    Math.random() * (options.maxHallways - options.minHallways) +
      options.minHallways,
  )

  for (let i: number = 0; i < hallwaysToGenerateCount; i++) {
    if (hallwayDirection.x !== 0) {
      hallwayDirection = new THREE.Vector2(0, Math.random() > 0.5 ? -1 : 1)
    } else {
      hallwayDirection = new THREE.Vector2(Math.random() > 0.5 ? -1 : 1, 0)
    }

    const hallwayLength: number = Math.round(
      Math.random() * (options.maxHallwayLength - options.minHallwayLength) +
        options.minHallwayLength,
    )

    for (let i: number = 0; i < hallwayLength; i++) {
      const hallway: Room = new Room({
        light: i % 3 === 0,
        position: previousHallwayPosition,
      })

      hallway.position.add(hallwayDirection)

      previousHallwayPosition = hallway.position.clone()

      // if (
      //   hallways.find(
      //     (hw: Room): boolean =>
      //       hw.position.x === hallway.position.x &&
      //       hw.position.y === hallway.position.y,
      //   )
      // ) {
      //   break
      // }

      hallways.push(hallway)
    }
  }

  return hallways
}

interface GenerateRoomOnHallwaysOptions {
  minRooms: number
  maxRooms: number

  minRoomWidth: number
  maxRoomWidth: number

  minRoomHeight: number
  maxRoomHeight: number
}

export function generateRoomsOnHallways(
  hallways: Room[],
  _options: Partial<GenerateRoomOnHallwaysOptions> = {},
): Room[] {
  const options: GenerateRoomOnHallwaysOptions = {
    minRooms: 1,
    maxRooms: 10,

    minRoomWidth: 3,
    maxRoomWidth: 6,

    minRoomHeight: 3,
    maxRoomHeight: 6,

    ..._options,
  }

  if (options.minRooms > options.maxRooms) {
    throw new Error('Min rooms must be greater than max rooms')
  }

  if (options.minRoomWidth > options.maxRoomWidth) {
    throw new Error('Min room width must be greater than max room width')
  }

  if (options.minRoomHeight > options.maxRoomHeight) {
    throw new Error('Min room height must be greater than max room height')
  }

  const rooms: Room[] = []

  const roomsToGenerateCount: number = Math.round(
    Math.random() * (options.maxRooms - options.minRooms) + options.minRooms,
  )

  for (let i: number = 0; i < roomsToGenerateCount; i++) {
    const roomWidth: number = Math.round(
      Math.random() * (options.maxRoomWidth - options.minRoomWidth) +
        options.minRoomWidth,
    )

    const roomHeight: number = Math.round(
      Math.random() * (options.maxRoomHeight - options.minRoomHeight) +
        options.minRoomHeight,
    )

    const hallwaySegment: Room =
      hallways[Math.floor(Math.random() * hallways.length)]

    const roomDirection =
      Math.random() > 0.5
        ? new THREE.Vector2(Math.random() > 0.5 ? -1 : 1, 0)
        : new THREE.Vector2(0, Math.random() > 0.5 ? -1 : 1)
    const roomBasePosition = hallwaySegment.position.clone().add(roomDirection)

    if (hallways.find((hallway) => hallway.position.equals(roomBasePosition))) {
      roomBasePosition.sub(roomDirection)

      if (roomDirection.x) {
        roomDirection.x = -roomDirection.x
      } else {
        roomDirection.y = -roomDirection.y
      }

      roomBasePosition.add(roomDirection)

      if (
        hallways.find((hallway) => hallway.position.equals(roomBasePosition))
      ) {
        roomBasePosition.sub(roomDirection)

        if (roomDirection.x) {
          roomDirection.y = roomDirection.x
          roomDirection.x = 0
        } else {
          roomDirection.x = roomDirection.y
          roomDirection.y = 0
        }

        roomBasePosition.add(roomDirection)

        if (
          hallways.find((hallway) => hallway.position.equals(roomBasePosition))
        ) {
          roomBasePosition.sub(roomDirection)

          if (roomDirection.x) {
            roomDirection.x = -roomDirection.x
          } else {
            roomDirection.y = -roomDirection.y
          }

          roomBasePosition.add(roomDirection)

          if (
            hallways.find((hallway) =>
              hallway.position.equals(roomBasePosition),
            )
          ) {
            continue
          }
        }
      }
    }

    const baseRoom = new Room({
      position: roomBasePosition,
    })

    const newRooms: Room[] = [baseRoom]

    for (let x = 0; x < roomWidth; x++) {
      for (let y = 0; y < roomHeight; y++) {
        const newRoom: Room = new Room({
          light:
            x === Math.floor(roomWidth / 2) && y === Math.floor(roomHeight / 2),
          position: roomBasePosition
            .clone()
            .add(
              new THREE.Vector2(
                (roomDirection.x ? roomDirection.x : 1) * x,
                (roomDirection.y ? roomDirection.y : 1) * y,
              ),
            ),
        })

        if (newRoom.position.equals(baseRoom.position)) {
          continue
        }

        const boundingHallwayOrRoom =
          hallways.find((hallway) =>
            hallway.position.equals(newRoom.position),
          ) || rooms.find((room) => room.position.equals(newRoom.position))

        if (boundingHallwayOrRoom) {
          // FIXME: Stop generation past this rooms limits
          continue
        }

        if (
          hallways.find(
            (hallway) =>
              hallway.position.x === newRoom.position.x &&
              hallway.position.y === newRoom.position.y + 1,
          ) ||
          rooms.find(
            (room) =>
              room.position.x === newRoom.position.x &&
              room.position.y === newRoom.position.y + 1,
          )
        ) {
          newRoom.walls.push('North')
        } else if (
          hallways.find(
            (hallway) =>
              hallway.position.x === newRoom.position.x &&
              hallway.position.y === newRoom.position.y - 1,
          ) ||
          rooms.find(
            (room) =>
              room.position.x === newRoom.position.x &&
              room.position.y === newRoom.position.y - 1,
          )
        ) {
          newRoom.walls.push('South')
        }

        if (
          hallways.find(
            (hallway) =>
              hallway.position.x === newRoom.position.x + 1 &&
              hallway.position.y === newRoom.position.y,
          ) ||
          rooms.find(
            (room) =>
              room.position.x === newRoom.position.x + 1 &&
              room.position.y === newRoom.position.y,
          )
        ) {
          newRoom.walls.push('East')
        } else if (
          hallways.find(
            (hallway) =>
              hallway.position.x === newRoom.position.x - 1 &&
              hallway.position.y === newRoom.position.y,
          ) ||
          rooms.find(
            (room) =>
              room.position.x === newRoom.position.x - 1 &&
              room.position.y === newRoom.position.y,
          )
        ) {
          newRoom.walls.push('West')
        }

        newRooms.push(newRoom)
      }
    }

    rooms.push(...newRooms)
  }

  return rooms
}

export function generateBuildingLayout(): Room[] {
  const hallways: Room[] = generateHallways()

  const rooms: Room[] = [...hallways, ...generateRoomsOnHallways(hallways)]

  addPerimeterWalls(rooms)

  return rooms
}
