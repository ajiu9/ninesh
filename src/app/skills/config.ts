import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'

export interface SkillsConfig {
  source: string
  targets: Record<string, string>
}

const home = homedir()
const configDir = path.join(home, '.ninesh')
const configPath = path.join(configDir, 'config.json')

/** 预定义的应用扫描列表：app名 → 检测目录 */
export const KNOWN_APPS: Record<string, string> = {
  claude: path.join(home, '.claude'),
  multica: path.join(home, '.multica'),
  workbuddy: path.join(home, '.workbuddy'),
}

interface NineshConfig {
  skills?: SkillsConfig
}

/**
 * 加载 ninesh 全局配置
 */
async function loadNineshConfig(): Promise<NineshConfig> {
  if (!existsSync(configDir))
    await mkdir(configDir, { recursive: true })

  if (!existsSync(configPath))
    return {}

  try {
    const content = await readFile(configPath, 'utf-8')
    return JSON.parse(content)
  }
  catch {
    return {}
  }
}

/**
 * 保存 ninesh 全局配置
 */
async function saveNineshConfig(config: NineshConfig): Promise<void> {
  if (!existsSync(configDir))
    await mkdir(configDir, { recursive: true })

  await writeFile(configPath, JSON.stringify(config, null, 2))
}

/**
 * 加载 skills 配置
 */
export async function loadSkillsConfig(): Promise<SkillsConfig | null> {
  const config = await loadNineshConfig()
  return config.skills ?? null
}

/**
 * 保存 skills 配置
 */
export async function saveSkillsConfig(skillsConfig: SkillsConfig): Promise<void> {
  const config = await loadNineshConfig()
  config.skills = skillsConfig
  await saveNineshConfig(config)
}

/**
 * 获取配置文件路径
 */
export function getSkillsConfigPath(): string {
  return configPath
}

/**
 * 展开路径中的 ~ 为 homedir
 */
export function expandHome(p: string): string {
  if (p.startsWith('~/'))
    return path.join(home, p.slice(2))
  return p
}
