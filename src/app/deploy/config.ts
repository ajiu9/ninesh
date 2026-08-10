import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { rootPath } from '../../constants'

export const deployConfigPath = path.join(rootPath, 'deploy.json')

export interface DeployServerConfig {
  port: number
  path: string
  secret: string
}

export interface DeployProjectConfig {
  name: string
  sourceDir: string
  targetDir: string
  buildOutput: string
  gitUrl: string
  branch: string
}

export interface DeployConfig {
  server: DeployServerConfig
  projects: DeployProjectConfig[]
}

export const defaultServerConfig: DeployServerConfig = {
  port: 3000,
  path: '/webhooks',
  secret: '',
}

export const defaultDeployConfig: DeployConfig = {
  server: defaultServerConfig,
  projects: [],
}

export async function loadDeployConfig(): Promise<DeployConfig> {
  if (!existsSync(deployConfigPath))
    return { ...defaultDeployConfig }

  const content = await readFile(deployConfigPath, 'utf8')
  const config = JSON.parse(content) as Partial<DeployConfig>

  return {
    server: { ...defaultServerConfig, ...config.server },
    projects: config.projects || [],
  }
}

export async function saveDeployConfig(config: DeployConfig): Promise<void> {
  if (!existsSync(rootPath))
    await mkdir(rootPath, { recursive: true })
  await writeFile(deployConfigPath, JSON.stringify(config, null, 2))
}
