import type { CurrentTimeType } from './utils/index'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { ExitCode } from './cli/exit-code'
import { formatDate, getTasksData } from './utils/index'

const uPath = process.env.HOME
const require = createRequire(import.meta.url)
const configDir = path.resolve(uPath as string, '.obsiflow')
const resolve = (p: string) => path.resolve(configDir, p)
const configPath = resolve('config.json')

const { values, positionals: targets } = parseArgs({
  allowPositionals: true,
  options: {
    next: {
      type: 'boolean',
      short: 'n',
    },
    weekly: {
      type: 'boolean',
      short: 'w',
    },
    task: {
      type: 'boolean',
      short: 't',
    },
  },
})

console.log(values, targets)
const target = targets[0] || 'daily'

let config: { [x: string]: {
  target: string
  template?: string
} }

main()

export async function main() {
  try {
    // Setup global error handlers
    process.on('uncaughtException', errorHandler)
    process.on('unhandledRejection', errorHandler)

    await loadConfig()

    const now = new Date()
    if (values.next && ['daily', 'saturday', 'sunday'].includes(target)) now.setDate(now.getDate() + 1)
    if (values.next && target === 'weekly') now.setDate(now.getDate() + 7)
    const currentTime: CurrentTimeType = formatDate(now)
    const nameEnum = {
      daily: 'time',
      saturday: 'time',
      sunday: 'time',
      weekly: 'week',
      empty: 'empty',
      task: 'task',
    }
    const fileName = currentTime[nameEnum[target]]
    let targetTemplateData = ''
    if (fileName === 'task')
      targetTemplateData = getTasksData(values)

    else {
      let templateData = ''
      const templatePath = config[target]?.template
      if (templatePath)
        templateData = await readFile(templatePath, 'utf8')

      targetTemplateData = getTargetTemplateData(templateData)
    }

    console.log('name:', `${config[target].target}/${fileName}.md`)

    return writeFile(`${config[target].target}/${fileName}.md`, targetTemplateData)

    function getTargetTemplateData(data: string) {
      if (target === 'weekly') {
        const time = now
        time.setDate(time.getDate() + 7)
        const { week } = formatDate(time)
        data = data.replace(/\{week\}/g, week)
      }
      return data
    }
  }
  catch (error) {
    errorHandler(error as Error)
  }
}

function errorHandler(error: Error): void {
  let message = error.message || String(error)

  if (process.env.DEBUG || process.env.NODE_ENV === 'development')
    message = error.stack || message

  console.error(message)
  process.exit(ExitCode.FatalError)
}

async function loadConfig() {
  if (!existsSync(configDir)) await mkdir(configDir)

  const exit = existsSync(configPath)

  const defaultConfig = {
    daily: {
      template: `${uPath}/Documents/Code/github.com/ajiu9/Notes/Extras/Templates/Calendar模板/Daily notes模板.md`,
      target: `${uPath}/Documents/Code/github.com/ajiu9/Notes/Calendar/Daily notes`,
    },
    saturday: {
      template: `${uPath}/Documents/Code/github.com/ajiu9/Notes/Extras/Templates/Calendar模板/Daily notes模板.md`,
      target: `${uPath}/Documents/Code/github.com/ajiu9/Notes/Calendar/Daily notes`,
    },
    sunday: {
      template: `${uPath}/Documents/Code/github.com/ajiu9/Notes/Extras/Templates/Calendar模板/Daily notes模板.md`,
      target: `${uPath}/Documents/Code/github.com/ajiu9/Notes/Calendar/Daily notes`,
    },
    weekly: {
      template: `${uPath}/Documents/Code/github.com/ajiu9/Notes/Extras/Templates/Calendar模板/Weekly notes模版.md`,
      target: `${uPath}/Documents/Code/github.com/ajiu9/Notes/Calendar/Weekly`,
    },
    empty: {
      target: `${uPath}/Documents/Code/github.com/ajiu9/Notes/0-Inbox`,
    },
    task: {
      target: `${uPath}/Documents/Code/github.com/ajiu9/Notes/0-Inbox`,
    },
  }
  if (!exit)
    await writeFile(configPath, JSON.stringify(defaultConfig, null, 2))

  config = await require(resolve('config.json'))
}
