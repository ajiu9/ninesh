import type { ArgumentsCamelCase } from 'yargs'
import type { SkillsConfig } from './config'
import { existsSync, lstatSync, mkdirSync, readdirSync, readlinkSync, renameSync, symlinkSync, unlinkSync } from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'
import * as p from '@clack/prompts'
import c from 'picocolors'
import { expandHome, getSkillsConfigPath, KNOWN_APPS, loadSkillsConfig, saveSkillsConfig } from './config'

/**
 * 扫描已知应用，返回已安装的候选列表
 */
function scanInstalledApps(): Array<{ name: string, dir: string, defaultTarget: string }> {
  const results: Array<{ name: string, dir: string, defaultTarget: string }> = []
  for (const [name, dir] of Object.entries(KNOWN_APPS)) {
    if (existsSync(dir)) {
      results.push({
        name,
        dir,
        defaultTarget: path.join(dir, 'skills'),
      })
    }
  }
  return results
}

/**
 * 检查目标目录下的死链接并清理
 */
function cleanDeadLinks(targetDir: string): string[] {
  const removed: string[] = []
  if (!existsSync(targetDir))
    return removed

  const entries = readdirSync(targetDir)
  for (const entry of entries) {
    const fullPath = path.join(targetDir, entry)
    try {
      if (lstatSync(fullPath).isSymbolicLink()) {
        // 死链接：目标不存在
        if (!existsSync(fullPath)) {
          unlinkSync(fullPath)
          removed.push(entry)
        }
      }
    }
    catch {
      // 无法读取，跳过
    }
  }
  return removed
}

/**
 * 同步源目录的 skills 到一个目标目录
 */
function syncToTarget(
  source: string,
  targetDir: string,
): { created: string[], skipped: string[], backedUp: string[], deadCleaned: string[] } {
  const created: string[] = []
  const skipped: string[] = []
  const backedUp: string[] = []

  // 防止自己链接自己
  if (source === targetDir)
    throw new Error(`源目录和目标目录不能相同: ${source}`)

  // 确保目标目录存在
  if (!existsSync(targetDir))
    throw new Error(`目标目录不存在: ${targetDir}`)

  // 只获取源目录下的一级子目录
  if (!existsSync(source))
    throw new Error(`源 skills 目录不存在: ${source}`)

  const sourceEntries = readdirSync(source).filter((entry) => {
    const fullPath = path.join(source, entry)
    try {
      return lstatSync(fullPath).isDirectory()
    }
    catch {
      return false
    }
  })

  for (const skill of sourceEntries) {
    const sourcePath = path.join(source, skill)
    const targetPath = path.join(targetDir, skill)

    if (existsSync(targetPath)) {
      try {
        const stat = lstatSync(targetPath)
        if (stat.isSymbolicLink()) {
          const linkTarget = readlinkSync(targetPath)
          if (linkTarget === sourcePath) {
            // 已是正确软链接
            skipped.push(skill)
            continue
          }
          // 错误软链接，删除重建
          unlinkSync(targetPath)
          symlinkSync(sourcePath, targetPath, 'dir')
          created.push(skill)
          continue
        }
        if (stat.isDirectory()) {
          // 真实目录，备份后创建软链接
          const backupPath = `${targetPath}.bak`
          renameSync(targetPath, backupPath)
          backedUp.push(skill)
          symlinkSync(sourcePath, targetPath, 'dir')
          created.push(skill)
          continue
        }
        // 文件或其他类型，删除后创建软链接
        unlinkSync(targetPath)
        symlinkSync(sourcePath, targetPath, 'dir')
        created.push(skill)
      }
      catch (err) {
        p.log.warn(c.yellow(`处理 ${skill} 时出错: ${String(err)}，跳过`))
      }
    }
    else {
      // 不存在，直接创建软链接
      symlinkSync(sourcePath, targetPath, 'dir')
      created.push(skill)
    }
  }

  // 清理死链接
  const deadCleaned = cleanDeadLinks(targetDir)

  return { created, skipped, backedUp, deadCleaned }
}

/**
 * 解除同步：删除目标目录下所有指向源的软链接
 */
function unsyncFromTarget(source: string, targetDir: string): string[] {
  const removed: string[] = []
  if (!existsSync(targetDir))
    return removed

  const entries = readdirSync(targetDir)
  for (const entry of entries) {
    const fullPath = path.join(targetDir, entry)
    try {
      const stat = lstatSync(fullPath)
      if (stat.isSymbolicLink()) {
        const linkTarget = readlinkSync(fullPath)
        // 检查链接是否指向源目录下的内容
        if (linkTarget.startsWith(source)) {
          unlinkSync(fullPath)
          removed.push(entry)
        }
      }
    }
    catch {
      // 跳过无法处理的条目
    }
  }
  return removed
}

// ============================================================
// init
// ============================================================
async function runInit(): Promise<void> {
  p.intro(c.green('ninesh skills init'))

  const installed = scanInstalledApps()

  if (installed.length === 0) {
    p.log.warn(c.yellow('未检测到已安装的应用（claude, multica 等）。'))
    p.log.info(`你可以手动编辑配置文件: ${c.cyan(getSkillsConfigPath())}`)
    p.outro()
    return
  }

  p.log.info(`检测到 ${c.green(String(installed.length))} 个已安装应用:`)
  for (const app of installed)
    console.log(`  ${c.cyan(app.name)} → ${app.dir}`)

  // 第一步：选择要配置哪些应用
  const selected = await p.multiselect({
    message: '选择要配置的应用（空格选中，回车确认）',
    options: installed.map(app => ({
      value: app.name,
      label: `${app.name} → ${app.defaultTarget}`,
    })),
    required: false,
    initialValues: installed.map(app => app.name),
  })

  if (p.isCancel(selected)) {
    p.cancel('已取消')
    return
  }
  if (selected.length === 0) {
    p.log.warn(c.yellow('未选择任何应用。'))
    p.outro()
    return
  }

  const selectedNames = selected as string[]

  // 第二步：逐个配置目标路径
  const targets: Record<string, string> = {}
  const selectedApps = installed.filter(app => selectedNames.includes(app.name))

  for (const app of selectedApps) {
    const targetPath = await p.text({
      message: `${c.cyan(app.name)} 的目标路径`,
      initialValue: app.defaultTarget,
      validate(value: string) {
        if (!value)
          return '路径不能为空'
      },
    })
    if (p.isCancel(targetPath)) {
      p.cancel('已取消')
      return
    }
    targets[app.name] = expandHome(String(targetPath))
  }

  // 第三步：配置 source
  const home = homedir()
  const defaultSource = path.join(home, '.claude', 'skills')
  const sourceInput = await p.text({
    message: 'Skills 源目录路径',
    initialValue: defaultSource,
    validate(value: string) {
      if (!value)
        return '路径不能为空'
    },
  })
  if (p.isCancel(sourceInput)) {
    p.cancel('已取消')
    return
  }
  const source = expandHome(String(sourceInput))

  // 验证 source 不等于任何 target
  for (const [name, targetPath] of Object.entries(targets)) {
    if (source === targetPath) {
      p.log.error(c.red(`源目录与 ${name} 的目标路径相同，这会导致循环链接。请重新配置。`))
      p.outro()
      return
    }
  }

  // 保存
  const config: SkillsConfig = { source, targets }
  await saveSkillsConfig(config)

  p.log.success(c.green('Skills 配置已保存'))
  p.log.info(`  源目录: ${c.cyan(source)}`)
  for (const [name, targetPath] of Object.entries(targets))
    console.log(`  ${c.cyan(name)}: ${targetPath}`)
  p.log.info(`配置文件: ${c.cyan(getSkillsConfigPath())}`)
  p.outro()
}

// ============================================================
// sync
// ============================================================
async function runSync(): Promise<void> {
  p.intro(c.green('ninesh skills sync'))

  const config = await loadSkillsConfig()
  if (!config || Object.keys(config.targets).length === 0) {
    p.log.error(c.red('没有可配置的同步目标'))
    p.log.info(`请先运行 ${c.cyan('ninesh skills init')} 进行配置`)
    p.outro()
    return
  }

  const source = expandHome(config.source)
  if (!existsSync(source)) {
    p.log.error(c.red(`源 skills 目录不存在: ${source}`))
    p.outro()
    return
  }

  // 弹出选择器
  const targetEntries = Object.entries(config.targets)
  const selected = await p.multiselect({
    message: '选择要同步的目标应用',
    options: targetEntries.map(([name, targetPath]) => ({
      value: name,
      label: `${name} → ${targetPath}`,
    })),
    required: false,
    initialValues: targetEntries.map(([name]) => name),
  })

  if (p.isCancel(selected)) {
    p.cancel('已取消')
    return
  }
  if (selected.length === 0) {
    p.log.info('未选择任何目标，退出。')
    p.outro()
    return
  }

  const selectedTargets = selected as string[]

  let totalCreated = 0
  let totalSkipped = 0
  let totalBackedUp = 0
  let totalDeadCleaned = 0

  for (const name of selectedTargets) {
    const targetPath = expandHome(config.targets[name])

    // 确保目标目录存在
    if (!existsSync(targetPath)) {
      mkdirSync(targetPath, { recursive: true })
      p.log.info(`创建目标目录: ${c.cyan(targetPath)}`)
    }

    p.log.info(`同步: ${c.cyan(name)} → ${targetPath}`)

    try {
      const result = syncToTarget(source, targetPath)
      totalCreated += result.created.length
      totalSkipped += result.skipped.length
      totalBackedUp += result.backedUp.length
      totalDeadCleaned += result.deadCleaned.length

      for (const skill of result.created)
        console.log(`  ${c.green('+')} ${skill}`)
      for (const skill of result.backedUp)
        console.log(`  ${c.yellow('↻')} ${skill} (已备份 → ${skill}.bak)`)
      for (const skill of result.skipped)
        console.log(`  ${c.dim('=')} ${skill}`)
      for (const skill of result.deadCleaned)
        console.log(`  ${c.red('✕')} ${skill} (死链接已清理)`)
    }
    catch (err) {
      p.log.error(c.red(`同步 ${name} 失败: ${String(err)}`))
    }
  }

  if (totalCreated === 0 && totalBackedUp === 0 && totalDeadCleaned === 0)
    p.log.success(c.green('all synced, nothing to do'))
  else
    p.log.success(c.green(`同步完成: ${totalCreated} 创建, ${totalSkipped} 跳过, ${totalBackedUp} 备份, ${totalDeadCleaned} 清理`))

  p.outro()
}

// ============================================================
// unsync
// ============================================================
async function runUnsync(): Promise<void> {
  p.intro(c.green('ninesh skills unsync'))

  const config = await loadSkillsConfig()
  if (!config || Object.keys(config.targets).length === 0) {
    p.log.error(c.red('没有可配置的同步目标'))
    p.log.info(`请先运行 ${c.cyan('ninesh skills init')} 进行配置`)
    p.outro()
    return
  }

  const source = expandHome(config.source)

  // 弹出选择器
  const targetEntries = Object.entries(config.targets)
  const selected = await p.multiselect({
    message: '选择要解除同步的目标应用',
    options: targetEntries.map(([name, targetPath]) => ({
      value: name,
      label: `${name} → ${targetPath}`,
    })),
    required: false,
    initialValues: targetEntries.map(([name]) => name),
  })

  if (p.isCancel(selected)) {
    p.cancel('已取消')
    return
  }
  if (selected.length === 0) {
    p.log.info('未选择任何目标，退出。')
    p.outro()
    return
  }

  const selectedTargets = selected as string[]
  let totalRemoved = 0

  for (const name of selectedTargets) {
    const targetPath = expandHome(config.targets[name])

    if (!existsSync(targetPath)) {
      p.log.info(`${c.cyan(name)}: 目标目录不存在，跳过`)
      continue
    }

    p.log.info(`解除同步: ${c.cyan(name)} → ${targetPath}`)

    const removed = unsyncFromTarget(source, targetPath)
    totalRemoved += removed.length

    for (const skill of removed)
      console.log(`  ${c.red('-')} ${skill}`)

    if (removed.length === 0)
      console.log(`  ${c.dim('无软链接需要清理')}`)
  }

  if (totalRemoved === 0)
    p.log.info('没有需要解除的同步')
  else
    p.log.success(c.green(`解除同步完成: ${totalRemoved} 个软链接已删除`))

  p.outro()
}

// ============================================================
// 入口
// ============================================================
export { cleanDeadLinks, scanInstalledApps, syncToTarget, unsyncFromTarget }

export interface SkillsArgs {
  action?: string
}

export async function run(args: ArgumentsCamelCase<SkillsArgs>): Promise<void> {
  const action = args.action || 'sync'

  switch (action) {
    case 'init':
      await runInit()
      break
    case 'sync':
      await runSync()
      break
    case 'unsync':
      await runUnsync()
      break
    default:
      p.log.error(c.red(`未知操作: ${action}`))
      p.log.info(`可用操作: ${c.cyan('init')}, ${c.cyan('sync')}, ${c.cyan('unsync')}`)
      break
  }
}
