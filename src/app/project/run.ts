import type { ArgumentsCamelCase } from 'yargs'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import * as p from '@clack/prompts'
import c from 'picocolors'
import { rootPath, uPath } from '../../constants'

p.intro(`${c.green(`nineshqqq `)}`)

const configPath = path.join(rootPath, 'config.json')

const defaults = {
  base: rootPath,
  hooks: {},
  alias: {
    'github://': 'https://github.com/',
  },
}
export function run(args: ArgumentsCamelCase) {
  const { path } = args
  init()
}

async function init() {
  await loadConfig()
}

async function loadConfig() {
  if (!existsSync(rootPath)) await mkdir(rootPath, { recursive: true })
  let config
  if (existsSync(configPath)) {
    config = await readFile(configPath, 'utf8')
    config = resolveConfig(config, defaults)
    // ignore when base has been defined in ~/.projj/config
    if (config.base) return
  }

  // const question = {
  //   type: 'input',
  //   name: 'base',
  //   message: 'Set base directory:',
  //   default: defaults.base,
  // }
  // const { base } = await this.prompt([question])
  // const config = resolveConfig({ base }, defaults)
  // await writeFile(configPath, JSON.stringify(config, null, 2))
}

function resolveConfig(config, defaults) {
  config = Object.assign({}, defaults, config)
  if (!Array.isArray(config.base))
    config.base = [config.base]

  config.base = config.base.map((baseDir) => {
    switch (baseDir[0]) {
      case '.':
        return path.join(path.dirname(configPath), baseDir)
      case '~':
        return baseDir.replace('~', uPath)
      case '/':
        return baseDir
      default:
        return path.join(process.cwd(), baseDir)
    }
  })

  return config
}
