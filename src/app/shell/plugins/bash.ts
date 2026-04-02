import { appendFile, existsSync, mkdirSync, readFile, writeFile } from 'node:fs'
import { homedir } from 'node:os'
import * as path from 'node:path'
import { promisify } from 'node:util'

const appendFileAsync = promisify(appendFile)
const readFileAsync = promisify(readFile)
const writeFileAsync = promisify(writeFile)

const home = homedir()
const bashrcPath = path.join(home, '.bashrc')
const bashProfilePath = path.join(home, '.bash_profile')

/**
 * Bash 插件配置
 */
export interface BashPluginConfig {
  name: string
  description: string
  content: string
}

/**
 * 预定义的 Bash 插件
 */
export const BASH_PLUGINS: BashPluginConfig[] = [
  {
    name: 'aliases',
    description: '常用别名',
    content: `
# ninesh bash aliases
alias ll='ls -alF'
alias la='ls -A'
alias l='ls -CF'
alias ..='cd ..'
alias ...='cd ../..'
alias grep='grep --color=auto'
alias fgrep='fgrep --color=auto'
alias egrep='egrep --color=auto'
`,
  },
  {
    name: 'git',
    description: 'Git 别名',
    content: `
# ninesh git aliases
alias gs='git status'
alias ga='git add'
alias gc='git commit'
alias gp='git push'
alias gl='git log --oneline'
alias gd='git diff'
alias gb='git branch'
alias gco='git checkout'
`,
  },
  {
    name: 'completion',
    description: '自动补全增强',
    content: `
# ninesh bash completion
if [ -f /etc/bash_completion ]; then
    . /etc/bash_completion
fi

# Enable programmable completion features
if ! shopt -oq posix; then
  if [ -f /usr/share/bash-completion/bash_completion ]; then
    . /usr/share/bash-completion/bash_completion
  elif [ -f /etc/bash_completion ]; then
    . /etc/bash_completion
  fi
fi
`,
  },
]

/**
 * 添加内容到 bashrc
 */
export async function addToBashrc(content: string, marker?: string): Promise<boolean> {
  try {
    const targetPath = existsSync(bashrcPath) ? bashrcPath : bashProfilePath

    // 如果有标记，先移除旧内容
    if (marker) {
      await removeFromBashrc(marker)
    }

    // 添加新内容
    const wrappedContent = marker
      ? `\n# <<< ${marker} <<<\n${content}\n# <<< ${marker} <<<\n`
      : `\n${content}`

    await appendFileAsync(targetPath, wrappedContent)
    return true
  }
  catch {
    return false
  }
}

/**
 * 从 bashrc 移除标记内容
 */
export async function removeFromBashrc(marker: string): Promise<boolean> {
  try {
    const targetPath = existsSync(bashrcPath) ? bashrcPath : bashProfilePath

    if (!existsSync(targetPath)) {
      return true
    }

    let content = await readFileAsync(targetPath, 'utf-8')
    const startMarker = `# <<< ${marker} <<<`
    const endMarker = `# <<< ${marker} <<<`
    const regex = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`, 'g')
    content = content.replace(regex, '').trim()

    await writeFileAsync(targetPath, content, 'utf-8')
    return true
  }
  catch {
    return false
  }
}

/**
 * 安装 Bash 插件
 */
export async function installBashPlugin(pluginName: string): Promise<boolean> {
  const plugin = BASH_PLUGINS.find(p => p.name === pluginName)
  if (!plugin) {
    return false
  }

  return addToBashrc(plugin.content, `ninesh-${pluginName}`)
}

/**
 * 获取 Bash 配置文件路径
 */
export function getBashConfigPath(): string {
  return existsSync(bashrcPath) ? bashrcPath : bashProfilePath
}

/**
 * 确保 Bash 配置文件存在
 */
export function ensureBashConfigExists(): void {
  const targetPath = getBashConfigPath()
  if (!existsSync(targetPath)) {
    const dir = path.dirname(targetPath)
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
    // 创建空的配置文件
    require('fs').writeFileSync(targetPath, '# Created by ninesh\n')
  }
}
