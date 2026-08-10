import process from 'node:process'

import * as p from '@clack/prompts'
import { installPackage, isPackageExists } from 'op-pkg'

/**
 * 检查并安装缺失的依赖包
 * @param packages 需要的包名列表
 */
export async function ensurePackages(packages: string[]): Promise<boolean> {
  // 在 CI 环境或非 TTY 环境下跳过
  if (process.env.CI || process.stdout.isTTY === false)
    return true

  // 过滤出不存在的包
  const nonExistingPackages = packages.filter(name => !isPackageExists(name))

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
