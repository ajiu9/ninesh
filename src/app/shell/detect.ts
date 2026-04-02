import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import * as process from 'node:process'

export type ShellType = 'bash' | 'zsh' | 'fish' | 'dash' | 'sh' | 'unknown'

export interface ShellInfo {
  name: ShellType
  path: string
  version: string
  configPath: string
  isDefault: boolean
  isInstalled: boolean
}

const SHELL_CONFIG_MAP: Record<string, string[]> = {
  bash: ['~/.bashrc', '~/.bash_profile'],
  zsh: ['~/.zshrc'],
  fish: ['~/.config/fish/config.fish'],
  dash: ['~/.profile'],
  sh: ['~/.profile'],
}

/**
 * 检测当前系统默认终端
 */
export function detectDefaultShell(): ShellInfo {
  // 1. 从 $SHELL 环境变量获取
  const shellPath = process.env.SHELL || '/bin/sh'

  // 2. 解析终端名称
  const name = parseShellName(shellPath)

  // 3. 获取版本
  const version = getShellVersion(name)

  // 4. 确定配置文件路径
  const configPath = findConfigFile(name)

  return {
    name,
    path: shellPath,
    version,
    configPath,
    isDefault: true,
    isInstalled: true,
  }
}

/**
 * 解析终端名称
 */
function parseShellName(path: string): ShellType {
  const basename = path.split('/').pop() || ''
  const shellTypes: ShellType[] = ['bash', 'zsh', 'fish', 'dash', 'sh']

  return shellTypes.find(type => basename.includes(type)) || 'unknown'
}

/**
 * 获取终端版本
 */
function getShellVersion(name: ShellType): string {
  if (name === 'unknown' || name === 'sh' || name === 'dash')
    return ''

  try {
    const output = execSync(`${name} --version`, { encoding: 'utf-8' })
    const match = output.match(/version\s+(\d+\.\d+)/i)
    return match ? match[1] : ''
  }
  catch {
    return ''
  }
}

/**
 * 查找配置文件路径
 */
function findConfigFile(name: ShellType): string {
  const home = homedir()
  const configs = SHELL_CONFIG_MAP[name] || []

  for (const config of configs) {
    const fullPath = config.replace('~', home)
    if (existsSync(fullPath))
      return fullPath
  }

  // 返回默认配置路径
  return configs[0]?.replace('~', home) || ''
}

/**
 * 列出系统已安装的所有终端
 */
export function listInstalledShells(): ShellInfo[] {
  const shells: ShellType[] = ['bash', 'zsh', 'fish', 'dash', 'sh']
  const results: ShellInfo[] = []
  const defaultShellPath = process.env.SHELL

  for (const shell of shells) {
    const paths = [`/bin/${shell}`, `/usr/bin/${shell}`]

    for (const path of paths) {
      if (existsSync(path)) {
        results.push({
          name: shell,
          path,
          version: getShellVersion(shell),
          configPath: findConfigFile(shell),
          isDefault: defaultShellPath === path,
          isInstalled: true,
        })
        break
      }
    }
  }

  return results
}

/**
 * 检查指定终端是否已安装
 */
export function isShellInstalled(name: ShellType): boolean {
  const paths = [`/bin/${name}`, `/usr/bin/${name}`]
  return paths.some(path => existsSync(path))
}

/**
 * 获取终端的配置文件路径
 */
export function getShellConfigPath(name: ShellType): string {
  return findConfigFile(name)
}
