import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

import * as p from '@clack/prompts'
import { installPackage } from 'op-pkg'

/**
 * Resolve a package's entry file path from CWD's node_modules.
 * Returns null if the package is not installed in CWD.
 */
function resolvePackageInCWD(name: string): string | null {
  const pkgJsonPath = path.join(process.cwd(), 'node_modules', name, 'package.json')
  if (!existsSync(pkgJsonPath))
    return null
  try {
    const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'))
    const entry = pkg.exports?.['.']?.import
      || pkg.exports?.['.']?.require
      || pkg.main
      || 'index.js'
    return path.join(path.dirname(pkgJsonPath), entry)
  }
  catch {
    return null
  }
}

/**
 * Dynamically import a package from CWD's node_modules.
 * Use this instead of bare import() for packages installed at runtime,
 * since Node.js ESM resolution does not search CWD when resolving
 * from a globally-installed CLI.
 */
export async function importFromCWD(name: string): Promise<any> {
  const entryPath = resolvePackageInCWD(name)
  if (!entryPath)
    throw new Error(`Package "${name}" not found in CWD`)
  return import(pathToFileURL(entryPath).href)
}

/**
 * 检查并安装缺失的依赖包
 * @param packages 需要的包名列表
 */
export async function ensurePackages(packages: string[]): Promise<boolean> {
  // 在 CI 环境或非 TTY 环境下跳过
  if (process.env.CI || process.stdout.isTTY === false)
    return true

  // 检查 CWD 中是否已安装（而非全局 ninesh 上下文中）
  const nonExistingPackages = packages.filter(name => !resolvePackageInCWD(name))

  if (nonExistingPackages.length === 0)
    return true

  const message = nonExistingPackages.length === 1
    ? `需要安装依赖: ${nonExistingPackages[0]}，是否安装？`
    : `需要安装依赖: ${nonExistingPackages.join(', ')}，是否安装？`

  const result = await p.confirm({
    message,
    initialValue: true,
  })

  if (p.isCancel(result) || !result)
    return false

  try {
    await installPackage(nonExistingPackages, { dev: true })
    return true
  }
  catch (error) {
    p.log.error(`安装依赖失败: ${String(error)}`)
    return false
  }
}
