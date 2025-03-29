import path from 'path'
import dotenv from 'dotenv'

dotenv.config({
  override: true,
  path: path.resolve(process.cwd(), '.env.local'),
})

dotenv.config({
  override: true,
  path: path.resolve(process.cwd(), '.env.aws'),
})

import 'module-alias/register'
import { addAliases } from 'module-alias'

addAliases({
  '@': `${__dirname}/../src/`,
})

import fs from 'fs'

const scriptName: string | undefined = process.argv[2]

if (!scriptName) {
  console.error('Pass the name of the script as the next argument.')
  process.exit(1)
}

let scriptPath: string = path.join(__dirname, scriptName)

if (!fs.existsSync(scriptPath)) {
  const possibleExtensions: string[] = ['.ts', '.tsx', '.js', '.jsx']

  for (const ext of possibleExtensions) {
    scriptPath = path.format({
      dir: __dirname,
      name: scriptName,
      ext,
    })

    if (fs.existsSync(scriptPath)) break
  }

  if (!fs.existsSync(scriptPath)) {
    console.error(`Couldn't find script: ${process.argv[2]}`)
    process.exit(1)
  }
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
require(scriptPath)

