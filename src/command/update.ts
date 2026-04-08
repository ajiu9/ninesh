import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import * as p from '@clack/prompts'
import { execa } from 'execa'
import c from 'picocolors'
import semver from 'semver'
import { pkgJson } from '../constants'

const ZSH_MARKER = 'custom zsh'
const BASH_MARKER = 'custom bash'

type PackageManager = 'npm' | 'pnpm' | 'yarn'

export interface UpdateOptions {
  check?: boolean
}

function detectPackageManager(): PackageManager {
  const execPath = process.execPath
  if (execPath.includes('pnpm'))
    return 'pnpm'
  if (execPath.includes('yarn'))
    return 'yarn'
  return 'npm'
}

function getZshSourcePath(): string {
  const __dirname = fileURLToPath(new URL('.', import.meta.url))
  return `${__dirname}plugins/zsh/index.zsh`
}

function getBashSourcePath(): string {
  const __dirname = fileURLToPath(new URL('.', import.meta.url))
  return `${__dirname}plugins/bash/index.sh`
}

function getZshrcPath(): string {
  return `${homedir()}/.zshrc`
}

function getBashrcPath(): string {
  return `${homedir()}/.bashrc`
}

function getDefaultShell(): 'zsh' | 'bash' {
  const shell = process.env.SHELL || ''
  if (shell.includes('zsh'))
    return 'zsh'
  if (shell.includes('bash'))
    return 'bash'
  return 'bash'
}

function marker(name: string): string {
  return `# <<< ${name} initialize <<<`
}

function generateBlock(name: string, command: string): string {
  const markerLine = marker(name)
  return `\n${markerLine}\n${command}\n${markerLine}\n`
}

function findConfig(content: string, markerName: string): { found: boolean, currentPath: string | null } {
  const startMarker = marker(markerName)
  const regex = new RegExp(`${startMarker}[\\s\\S]*?${startMarker}`, 'g')
  const match = content.match(regex)

  if (!match)
    return { found: false, currentPath: null }

  // Extract source path from the block
  const sourceMatch = match[0].match(/source\s+(.+?)\/index\.(zsh|sh)/)
  if (sourceMatch)
    return { found: true, currentPath: sourceMatch[1] }

  return { found: true, currentPath: null }
}

function removeConfig(content: string, markerName: string): string {
  const startMarker = marker(markerName)
  const regex = new RegExp(`${startMarker}[\\s\\S]*?${startMarker}`, 'g')
  return content.replace(regex, '').trim()
}

async function checkAndPromptShellConfig(): Promise<void> {
  const defaultShell = getDefaultShell()

  if (defaultShell === 'zsh')
    await checkZshConfig()

  else
    await checkBashConfig()
}

async function checkZshConfig(): Promise<void> {
  const zshrcPath = getZshrcPath()
  const expectedPath = getZshSourcePath()

  if (!existsSync(zshrcPath))
    return

  const content = readFileSync(zshrcPath, 'utf-8')
  const { found, currentPath } = findConfig(content, ZSH_MARKER)

  if (!found) {
    const shouldInstall = await p.confirm({
      message: `No ${c.cyan('ninesh zsh')} config found in .zshrc. Add it?`,
      initialValue: true,
    })

    if (shouldInstall) {
      const block = generateBlock(ZSH_MARKER, `source ${expectedPath}`)
      writeFileSync(zshrcPath, content + block)
      p.log.success(c.green('Added ninesh zsh config to .zshrc'))
    }
    return
  }

  if (currentPath && currentPath !== expectedPath.replace('/index.zsh', '')) {
    const shouldUpdate = await p.confirm({
      message: `Zsh config path is outdated. Update to ${c.cyan(expectedPath)}?`,
      initialValue: true,
    })

    if (shouldUpdate) {
      const newContent = removeConfig(content, ZSH_MARKER)
      const block = generateBlock(ZSH_MARKER, `source ${expectedPath}`)
      writeFileSync(zshrcPath, newContent + block)
      p.log.success(c.green('Updated ninesh zsh config in .zshrc'))
    }
  }
}

async function checkBashConfig(): Promise<void> {
  const bashrcPath = getBashrcPath()
  const expectedPath = getBashSourcePath()

  if (!existsSync(bashrcPath))
    return

  const content = readFileSync(bashrcPath, 'utf-8')
  const { found, currentPath } = findConfig(content, BASH_MARKER)

  if (!found) {
    const shouldInstall = await p.confirm({
      message: `No ${c.cyan('ninesh bash')} config found in .bashrc. Add it?`,
      initialValue: true,
    })

    if (shouldInstall) {
      const block = generateBlock(BASH_MARKER, `source ${expectedPath}`)
      writeFileSync(bashrcPath, content + block)
      p.log.success(c.green('Added ninesh bash config to .bashrc'))
    }
    return
  }

  if (currentPath && currentPath !== expectedPath.replace('/index.sh', '')) {
    const shouldUpdate = await p.confirm({
      message: `Bash config path is outdated. Update to ${c.cyan(expectedPath)}?`,
      initialValue: true,
    })

    if (shouldUpdate) {
      const newContent = removeConfig(content, BASH_MARKER)
      const block = generateBlock(BASH_MARKER, `source ${expectedPath}`)
      writeFileSync(bashrcPath, newContent + block)
      p.log.success(c.green('Updated ninesh bash config in .bashrc'))
    }
  }
}

export async function run(options: UpdateOptions = {}): Promise<void> {
  const currentVersion = pkgJson.version
  const packageName = pkgJson.name

  p.log.info(`Current version: ${c.green(`v${currentVersion}`)}`)

  const s = p.spinner()
  s.start('Checking for updates...')

  try {
    // Get latest version from npm
    const { stdout: latestVersion } = await execa('npm', [
      'view',
      packageName,
      'version',
      '--registry',
      'https://registry.npmmirror.com',
    ])

    s.stop(`Latest version: ${c.cyan(`v${latestVersion}`)}`)

    // Compare versions
    if (semver.lte(latestVersion, currentVersion)) {
      p.log.success(c.green('You are already on the latest version!'))

      // Still check shell config
      await checkAndPromptShellConfig()
      return
    }

    // Check only mode
    if (options.check) {
      p.log.info(`A new version is available: ${c.yellow(`v${latestVersion}`)}`)
      p.log.info(`Run ${c.cyan('ninesh update')} to update.`)
      return
    }

    // Ask for confirmation
    const shouldUpdate = await p.confirm({
      message: `Update to ${c.cyan(`v${latestVersion}`)}?`,
      initialValue: true,
    })

    if (!shouldUpdate) {
      p.log.info('Update cancelled.')
      return
    }

    // Update the package globally
    const updateSpinner = p.spinner()
    updateSpinner.start('Updating ninesh...')

    const pkgManager = detectPackageManager()
    const registry = 'https://registry.npmmirror.com'

    if (pkgManager === 'pnpm') {
      await execa('pnpm', [
        'add',
        '-g',
        `${packageName}@latest`,
        '--registry',
        registry,
      ], {
        stdio: 'inherit',
      })
    }
    else {
      await execa('npm', [
        'install',
        '-g',
        `${packageName}@latest`,
        '--registry',
        registry,
      ], {
        stdio: 'inherit',
      })
    }

    updateSpinner.stop(`Updated to ${c.green(`v${latestVersion}`)}!`)
    p.log.success(c.green('ninesh has been updated successfully!'))

    // Check shell config after update
    await checkAndPromptShellConfig()
  }
  catch (error) {
    s.stop('Failed to check for updates')
    p.log.error(c.red(`Failed to update: ${String(error)}`))
    throw error
  }
}
