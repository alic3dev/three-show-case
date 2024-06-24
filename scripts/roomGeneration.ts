import { Room, generateRoomLayoutWithWalls } from '@/utils/rooms'

const rooms = generateRoomLayoutWithWalls()

let minX: number = 0
let maxX: number = 0
let minY: number = 0
let maxY: number = 0

for (const room of rooms) {
  if (room.position.x < minX) minX = room.position.x
  if (room.position.x > maxX) maxX = room.position.x
  if (room.position.y < minY) minY = room.position.y
  if (room.position.y > maxY) maxY = room.position.y
}

const txtRooms: (Room | null)[][] = new Array(maxY + Math.abs(minY) + 1)
  .fill(null)
  .map(() => new Array(maxX + Math.abs(minX) + 1).fill(null))

for (const room of rooms) {
  txtRooms[room.position.y + Math.abs(minY)][room.position.x + Math.abs(minX)] =
    room
}

console.log(`Rooms generated: ${rooms.length}`)

for (const xRooms of txtRooms) {
  let n = ''
  let m = ''
  let s = ''

  for (const room of xRooms) {
    if (room) {
      if (room.walls.includes('West')) {
        n += '|'
        m += '|·'
        s += '|'
      } else {
        if (room.walls.includes('North')) {
          n += '⎺'
        } else {
          n += ' '
        }
        m += ' ·'
        if (room.walls.includes('South')) {
          s += '⎽'
        } else {
          s += ' '
        }
      }

      if (room.walls.includes('North')) {
        n += '⎺'
      } else {
        n += ' '
      }

      if (room.walls.includes('South')) {
        s += '⎽'
      } else {
        s += ' '
      }

      if (room.walls.includes('East')) {
        n += '|'
        m += '|'
        s += '|'
      } else {
        if (room.walls.includes('North')) {
          n += '⎺'
        } else {
          n += ' '
        }
        m += ' '
        if (room.walls.includes('South')) {
          s += '⎽'
        } else {
          s += ' '
        }
      }
    } else {
      n += '   '
      m += '   '
      s += '   '
    }
  }

  if (n.trim()) {
    console.log(`\x1b[34m${n}\x1b[0m`)
  }
  if (m.trim()) {
    console.log(
      `\x1b[34m${m
        .split('')
        .map((a) => (a === '·' ? '\x1b[35m·\x1b[34m' : a))
        .join('')}\x1b[0m`,
    )
  }
  if (s.trim()) {
    console.log(`\x1b[34m${s}\x1b[0m`)
  }
}
