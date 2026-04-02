import process from 'node:process'
import pkgJson from '../package.json'

export const uPath = process.env.HOME
export const rootPath = `${uPath}/.ninesh`
export { pkgJson }

/**
 * Shell 配置接口
 */
export interface ShellConfig {
  defaultShell: string
  installedShells: string[]
  lastChecked: string
}

/**
 * 应用配置接口
 */
export interface AppConfig {
  base: string[]
  hooks: Record<string, string>
  alias: Record<string, string>
  shell?: ShellConfig
}
