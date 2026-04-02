import type { ArgumentsCamelCase } from 'yargs'
import * as p from '@clack/prompts'
import c from 'picocolors'
import { detectDefaultShell, listInstalledShells, type ShellType } from './detect'
import { loadShellConfig, saveShellConfig } from './config'
import { BASH_PLUGINS, installBashPlugin } from './plugins/bash'
import { FISH_PLUGINS, installFishPlugin } from './plugins/fish'

export interface ShellArgs {
  action?: string
  target?: string
}

/**
 * Shell 命令入口
 */
export async function run(args: ArgumentsCamelCase<ShellArgs>) {
  const action = args.action || 'info'

  switch (action) {
    case 'info':
      await showShellInfo()
      break
    case 'list':
      await listShells()
      break
    case 'switch':
      await switchShell(args.target)
      break
    case 'install':
      await installShell(args.target)
      break
    case 'config':
      await configureShell()
      break
    default:
      await showShellInfo()
  }
}

/**
 * 显示当前终端信息
 */
async function showShellInfo() {
  const shell = detectDefaultShell()

  p.log.info(c.cyan('当前终端信息:'))
  console.log(`  名称: ${c.green(shell.name)}`)
  console.log(`  路径: ${shell.path}`)
  console.log(`  版本: ${shell.version || '未知'}`)
  console.log(`  配置: ${shell.configPath}`)

  const installed = listInstalledShells()
  console.log()
  p.log.info(c.cyan('已安装的终端:'))

  for (const s of installed) {
    const marker = s.isDefault ? c.yellow(' (默认)') : ''
    console.log(`  ${s.isDefault ? '◉' : '○'} ${s.name.padEnd(10)} ${s.path.padEnd(20)} ${s.version ? `v${s.version}` : '-'}${marker}`)
  }
}

/**
 * 列出所有终端
 */
async function listShells() {
  const installed = listInstalledShells()

  p.log.info(c.cyan('已安装的终端:'))
  for (const s of installed) {
    const marker = s.isDefault ? c.yellow(' (默认)') : ''
    console.log(`  ${s.isDefault ? '◉' : '○'} ${s.name.padEnd(10)} ${s.path.padEnd(20)} ${s.version ? `v${s.version}` : '-'}${marker}`)
  }

  // 显示可安装的终端
  const available: ShellType[] = ['fish', 'zsh'].filter(
    name => !installed.some(s => s.name === name),
  ) as ShellType[]

  if (available.length > 0) {
    console.log()
    p.log.info(c.cyan('可安装的终端:'))
    for (const name of available) {
      const desc = name === 'fish' ? '现代化 shell，语法友好' : '强大的 shell，插件生态丰富'
      console.log(`  ○ ${name.padEnd(10)} ${desc}`)
    }
  }
}

/**
 * 切换默认终端
 */
async function switchShell(target?: string) {
  if (!target) {
    const installed = listInstalledShells()
    const selected = await p.select({
      message: '选择要切换的终端',
      options: installed.map(s => ({
        value: s.name,
        label: `${s.name} (${s.path})`,
      })),
    })

    if (p.isCancel(selected)) {
      p.cancel('已取消')
      return
    }

    target = selected as string
  }

  p.log.info(c.cyan(`切换终端到: ${target}`))
  p.log.warn(c.yellow('请运行以下命令完成切换:'))
  console.log(`  chsh -s $(which ${target})`)
  console.log()
  p.log.info('切换后需要重新登录终端才能生效')

  // 保存配置
  const config = await loadShellConfig()
  config.defaultShell = target
  await saveShellConfig(config)
}

/**
 * 安装终端
 */
async function installShell(target?: string) {
  if (!target) {
    const selected = await p.select({
      message: '选择要安装的终端',
      options: [
        { value: 'zsh', label: 'zsh - 强大的 shell，插件生态丰富' },
        { value: 'fish', label: 'fish - 现代化 shell，语法友好' },
      ],
    })

    if (p.isCancel(selected)) {
      p.cancel('已取消')
      return
    }

    target = selected as string
  }

  p.log.info(c.cyan(`安装终端: ${target}`))
  p.log.warn(c.yellow('请运行以下命令安装:'))

  // 检测包管理器
  if (process.platform === 'darwin') {
    console.log(`  brew install ${target}`)
  }
  else if (process.platform === 'linux') {
    console.log(`  # Ubuntu/Debian`)
    console.log(`  sudo apt install ${target}`)
    console.log()
    console.log(`  # CentOS/RHEL`)
    console.log(`  sudo yum install ${target}`)
    console.log()
    console.log(`  # Arch Linux`)
    console.log(`  sudo pacman -S ${target}`)
  }
}

/**
 * 配置当前终端
 */
async function configureShell() {
  const shell = detectDefaultShell()

  if (shell.name === 'bash') {
    await configureBash()
  }
  else if (shell.name === 'fish') {
    await configureFish()
  }
  else if (shell.name === 'zsh') {
    p.log.info(c.cyan('当前为 zsh，请使用 `ninesh init` 命令配置'))
  }
  else {
    p.log.warn(c.yellow(`当前终端 ${shell.name} 暂不支持自动配置`))
  }
}

/**
 * 配置 Bash
 */
async function configureBash() {
  const selected = await p.multiselect({
    message: '选择要配置的功能',
    options: BASH_PLUGINS.map(p => ({
      value: p.name,
      label: `${p.name} - ${p.description}`,
    })),
  })

  if (p.isCancel(selected)) {
    p.cancel('已取消')
    return
  }

  for (const pluginName of selected as string[]) {
    const result = await installBashPlugin(pluginName)
    if (result) {
      p.log.success(c.green(`已安装插件: ${pluginName}`))
    }
    else {
      p.log.error(c.red(`安装插件失败: ${pluginName}`))
    }
  }

  p.log.info(c.cyan('配置完成，请运行以下命令使配置生效:'))
  console.log('  source ~/.bashrc')
}

/**
 * 配置 Fish
 */
async function configureFish() {
  const selected = await p.multiselect({
    message: '选择要配置的功能',
    options: FISH_PLUGINS.map(p => ({
      value: p.name,
      label: `${p.name} - ${p.description}`,
    })),
  })

  if (p.isCancel(selected)) {
    p.cancel('已取消')
    return
  }

  for (const pluginName of selected as string[]) {
    const result = await installFishPlugin(pluginName)
    if (result) {
      p.log.success(c.green(`已安装插件: ${pluginName}`))
    }
    else {
      p.log.error(c.red(`安装插件失败: ${pluginName}`))
    }
  }

  p.log.info(c.cyan('配置完成，请重新打开终端使配置生效'))
}
