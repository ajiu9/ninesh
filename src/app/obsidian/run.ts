import type { CurrentTimeType } from './utils/index'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
// import { parseArgs } from 'node:util'
import path from 'node:path'
import { formatDate, getTasksData } from './utils/index'

const uPath = process.env.HOME
console.log('uPath:', uPath)
const scopeUrl = fileURLToPath(new URL('.', import.meta.url))
const require = createRequire(scopeUrl)
const configDir = path.join(uPath as string, '.obsiflow')
const resolve = (p: string) => path.resolve(configDir, p)
const configPath = resolve('config.json')

let config: { [x: string]: {
  target: string
  template?: string
} }

export async function run(argsOptions) {
  const { target, ...args } = argsOptions

  await loadConfig()

  const now = new Date()
  if (args.next && ['daily', 'saturday', 'sunday'].includes(target)) now.setDate(now.getDate() + 1)
  if (args.next && target === 'weekly') now.setDate(now.getDate() + 7)
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
    targetTemplateData = getTasksData(args)

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
