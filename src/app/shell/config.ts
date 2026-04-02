import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import * as path from 'node:path'

export interface ShellConfig {
  defaultShell: string
  installedShells: string[]
  lastChecked: string
}

const home = homedir()
const configDir = path.join(home, '.ninesh')
const configPath = path.join(configDir, 'shell.json')

/**
 * 加载终端配置
 */
export async function loadShellConfig(): Promise<ShellConfig> {
  if (!existsSync(configDir)) {
    await mkdir(configDir, { recursive: true })
  }

  if (!existsSync(configPath)) {
    return createDefaultConfig()
  }

  try {
    const content = await readFile(configPath, 'utf-8')
    return JSON.parse(content)
  }
  catch {
    return createDefaultConfig()
  }
}

/**
 * 保存终端配置
 */
export async function saveShellConfig(config: ShellConfig): Promise<void> {
  if (!existsSync(configDir)) {
    await mkdir(configDir, { recursive: true })
  }

  await writeFile(configPath, JSON.stringify(config, null, 2))
}

/**
 * 创建默认配置
 */
async function createDefaultConfig(): Promise<ShellConfig> {
  const defaultConfig: ShellConfig = {
    defaultShell: '',
    installedShells: [],
    lastChecked: new Date().toISOString(),
  }

  await saveShellConfig(defaultConfig)
  return defaultConfig
}

/**
 * 更新最后检查时间
 */
export async function updateLastChecked(): Promise<void> {
  const config = await loadShellConfig()
  config.lastChecked = new Date().toISOString()
  await saveShellConfig(config)
}

/**
 * 获取配置文件路径
 */
export function getShellConfigPath(): string {
  return configPath
}
