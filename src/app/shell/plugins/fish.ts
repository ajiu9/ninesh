import { appendFile, existsSync, mkdirSync, readFile, writeFile } from 'node:fs'
import { homedir } from 'node:os'
import * as path from 'node:path'
import { promisify } from 'node:util'

const appendFileAsync = promisify(appendFile)
const readFileAsync = promisify(readFile)
const writeFileAsync = promisify(writeFile)

const home = homedir()
const fishConfigDir = path.join(home, '.config', 'fish')
const fishConfigPath = path.join(fishConfigDir, 'config.fish')

/**
 * Fish 插件配置
 */
export interface FishPluginConfig {
  name: string
  description: string
  content: string
}

/**
 * 预定义的 Fish 插件
 */
export const FISH_PLUGINS: FishPluginConfig[] = [
  {
    name: 'aliases',
    description: '常用别名',
    content: `
# ninesh fish aliases
alias ll 'ls -alF'
alias la 'ls -A'
alias l 'ls -CF'
alias .. 'cd ..'
alias ... 'cd ../..'
`,
  },
  {
    name: 'git',
    description: 'Git 别名',
    content: `
# ninesh git aliases
alias gs 'git status'
alias ga 'git add'
alias gc 'git commit'
alias gp 'git push'
alias gl 'git log --oneline'
alias gd 'git diff'
alias gb 'git branch'
alias gco 'git checkout'
`,
  },
  {
    name: 'env',
    description: '环境变量设置',
    content: `
# ninesh environment
set -x EDITOR vim
set -x VISUAL vim
set -x LANG en_US.UTF-8
`,
  },
]

/**
 * 添加内容到 Fish 配置
 */
export async function addToFishConfig(content: string, marker?: string): Promise<boolean> {
  try {
    // 确保 Fish 配置目录存在
    if (!existsSync(fishConfigDir))
      mkdirSync(fishConfigDir, { recursive: true })

    // 如果配置文件不存在，创建一个
    if (!existsSync(fishConfigPath))
      await writeFileAsync(fishConfigPath, '# Fish configuration created by ninesh\n')

    // 如果有标记，先移除旧内容
    if (marker)
      await removeFromFishConfig(marker)

    // 添加新内容
    const wrappedContent = marker
      ? `\n# <<< ${marker} <<<\n${content}\n# <<< ${marker} <<<\n`
      : `\n${content}`

    await appendFileAsync(fishConfigPath, wrappedContent)
    return true
  }
  catch {
    return false
  }
}

/**
 * 从 Fish 配置移除标记内容
 */
export async function removeFromFishConfig(marker: string): Promise<boolean> {
  try {
    if (!existsSync(fishConfigPath))
      return true

    let content = await readFileAsync(fishConfigPath, 'utf-8')
    const startMarker = `# <<< ${marker} <<<`
    const endMarker = `# <<< ${marker} <<<`
    const regex = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`, 'g')
    content = content.replace(regex, '').trim()

    await writeFileAsync(fishConfigPath, content, 'utf-8')
    return true
  }
  catch {
    return false
  }
}

/**
 * 安装 Fish 插件
 */
export async function installFishPlugin(pluginName: string): Promise<boolean> {
  const plugin = FISH_PLUGINS.find(p => p.name === pluginName)
  if (!plugin)
    return false

  return addToFishConfig(plugin.content, `ninesh-${pluginName}`)
}

/**
 * 获取 Fish 配置文件路径
 */
export function getFishConfigPath(): string {
  return fishConfigPath
}

/**
 * 检查 Fish 配置是否存在
 */
export function fishConfigExists(): boolean {
  return existsSync(fishConfigPath)
}

/**
 * 确保 Fish 配置文件存在
 */
export async function ensureFishConfigExists(): Promise<void> {
  if (!existsSync(fishConfigDir))
    mkdirSync(fishConfigDir, { recursive: true })

  if (!existsSync(fishConfigPath))
    await writeFileAsync(fishConfigPath, '# Fish configuration created by ninesh\n')
}
