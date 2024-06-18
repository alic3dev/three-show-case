import * as THREE from 'three'

const MIN_ROOMS: number = 5
const MAX_ROOMS: number = 20

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
