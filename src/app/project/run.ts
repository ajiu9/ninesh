import type { ArgumentsCamelCase } from 'yargs'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import * as p from '@clack/prompts'
import { parseGitUrl } from 'comuse-shared'
import { execa } from 'execa'
import c from 'picocolors'
import { rootPath, uPath } from '../../constants'
import { clipboard } from '../../utils'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

const configPath = path.join(rootPath, 'config.json')
export interface BasicConfigJson {
  base: string[]
  hooks: Record<string, string>
  alias: Record<string, string>
}

const defaultBaseUrl = `${uPath}/Code`
const defaults: BasicConfigJson = {
  base: [defaultBaseUrl],
  hooks: {},
  alias: {
    'github://': 'https://github.com/',
  },
}
export function run(args: ArgumentsCamelCase) {
  const { path } = args
  init(path as string)
}

async function init(pathArg: string) {
  const config = await loadConfig()
  const repo = normalizeRepo(pathArg)
  // https://github.com/ajiu9/ninesh.git
  // => $BASE/github.com/ajiu9/ninesh
  const key = parseGitUrl(repo).replace(/https?:\/\//, '')

  const base = await chooseBaseDirectory(config.base)
  const targetPath = path.join(base as string, key)
  p.log.step(c.cyan(`Start adding repository: ${repo}`))

  if (await existsSync(targetPath)) {
    p.log.info(c.cyan(`${targetPath} already exist`))
    await clipboard.write(`cd ${targetPath}`)
    p.log.info(`${c.green('📋  Copied to clipboard')}, just use Ctrl+V`)
    p.log.info(c.green(`${targetPath} already exist`))
  }

  if (!existsSync(targetPath)) await mkdir(targetPath, { recursive: true })

  try {
    p.log.info(c.green(`'Cloning into ${targetPath}`))
    // TODO
    // support window system
    const env = Object.assign({
      GIT_SSH: path.join(__dirname, '/command/ssh.js'),
    }, process.env)

    await execa('git',
      [
        'clone',
        repo,
        targetPath,
      ],
      { env, stdio: 'inherit' },
    )

    await clipboard.write(`cd ${targetPath}`)
    p.log.info(`${c.green('📋  Copied to clipboard')}, just use Ctrl+V`)
  }
  catch (e) {
    const error = e as unknown as Error
    p.log.warn(`Failed to clone or copy to clipboard: ${error.message}`)
  }

  function normalizeRepo(url: string): string {
    const alias = config.alias
    const keys = Object.keys(alias)
    for (const key of keys) {
      // github://ajiu9/ninesh -> https://github.com/ajiu9/ninesh.git
      if (url.startsWith(key)) {
        url = `${alias[key] + url.substring(key.length)}.git`
        break
      }
    }
    return url
  }
}

async function loadConfig(): Promise<BasicConfigJson> {
  if (!existsSync(rootPath)) await mkdir(rootPath, { recursive: true })
  let config
  if (existsSync(configPath)) {
    config = await readFile(configPath, 'utf8')
    config = resolveConfig(JSON.parse(config), defaults)
    if (config.base) return config
  }
  const result = await p.group({
    base: () => p.text({
      message: 'Set base directory:',
      placeholder: defaultBaseUrl,
      defaultValue: defaultBaseUrl,
      validate: (value) => {
        if (!value)
          return 'Please enter a valid directory'
      },
    }),
  }, {
    onCancel: () => {
      p.cancel('Operation cancelled')
      process.exit(0)
    },
  })
  const { base } = result
  config = resolveConfig({ base: [base] }, defaults)
  await writeFile(configPath, JSON.stringify(config, null, 2))
  return config
}

function resolveConfig(config: Pick<BasicConfigJson, 'base'>, defaults: BasicConfigJson): BasicConfigJson {
  const dataConfig = Object.assign({}, defaults, config)
  if (!Array.isArray(dataConfig.base))
    dataConfig.base = dataConfig.base ? [dataConfig.base] : defaults.base

  dataConfig.base = dataConfig.base.map((baseDir: string) => {
    switch (baseDir[0]) {
      case '.':
        return path.join(path.dirname(configPath), baseDir)
      case '~':
        return baseDir.replace('~', uPath as string)
      case '/':
        return baseDir
      default:
        return path.join(process.cwd(), baseDir)
    }
  })

  return dataConfig
}

async function chooseBaseDirectory(baseData: string[]) {
  if (baseData.length === 1) return baseData[0]

  const base = await p.select({
    message: 'Pick a  base directory.',
    options: baseData.map(url => ({ value: url, label: url })),
  })

  return base
}
