import type { ArgumentsCamelCase } from 'yargs'
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import fsp from 'node:fs/promises'

import { homedir } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import * as p from '@clack/prompts'
import c from 'picocolors'

import { pushStringToTarget } from '../../utils'

const _homeDir = homedir()
const zshrcPath = path.join(_homeDir, '.zshrc')
const bashrcPath = path.join(_homeDir, '.bashrc')

function getDefaultShell(): 'zsh' | 'bash' {
  const shell = process.env.SHELL || ''
  if (shell.includes('zsh'))
    return 'zsh'
  return 'bash'
}

function getDefaultRcPath(): string {
  return getDefaultShell() === 'zsh' ? zshrcPath : bashrcPath
}

export async function run(args: ArgumentsCamelCase) {
  const __dirname = fileURLToPath(new URL('.', import.meta.url))
  const zshDir = path.resolve(__dirname, 'plugins/zsh')
  const bashDir = path.resolve(__dirname, 'plugins/bash')

  if (args.bash)
    await execCommand('custom bash', `source ${bashDir}/index.sh`, bashrcPath)

  if (args.zsh)
    await execCommand('custom zsh', `source ${zshDir}/index.zsh`, zshrcPath)

  if (args.ninesh) {
    const targetPath = args.bash ? bashrcPath : (args.zsh ? zshrcPath : getDefaultRcPath())
    await execCommand('custom ninesh',
      `alias n="ninesh"
alias na="ninesh add"
alias no="ninesh obsidian"
alias ni="ninesh init"`,
      targetPath,
    )
  }

  if (args.jump) {
    const targetPath = args.bash ? bashrcPath : (args.zsh ? zshrcPath : getDefaultRcPath())
    const defaultShell = args.bash ? 'bash' : (args.zsh ? 'zsh' : getDefaultShell())
    if (defaultShell === 'zsh')
      await execCommand('jump zsh', `source ${zshDir}/jump.zsh`, targetPath)
    else
      await execCommand('jump bash', `source ${bashDir}/jump.sh`, targetPath)
  }

  if (args.starship)
    await execCommand('starship', `eval "$(starship init zsh)"`, zshrcPath)

  if (args.omz) {
    const plugins = {
      'zsh-autosuggestions': 'https://github.com/zsh-users/zsh-autosuggestions',
      'zsh-completions': 'https://github.com/zsh-users/zsh-completions',
      'fast-syntax-highlighting': 'https://github.com/zdharma-continuum/fast-syntax-highlighting.git',
    }
    for (const plugin of Object.entries(plugins) as [string, string][])
      await runOmz(plugin)
  }

  async function runOmz(plugin: [string, string]) {
    const [pluginName, pluginUrl] = plugin
    const ZSH_CUSTOM = process.env.ZSH_CUSTOM
    const defaultPath = path.join(_homeDir, '.oh-my-zsh/custom/plugins')
    const pluginPath = path.join(ZSH_CUSTOM || defaultPath, pluginName)

    if (fs.existsSync(pluginPath)) {
      try {
        fs.rmSync(pluginPath, { recursive: true })
        p.log.step(c.cyan(`Directory cleaned: ${pluginPath}`))
      }
      catch (err) {
        console.error('Error cleaning directory:', err)
        p.log.error(c.red(`✘ Directory cleaned: ${pluginPath}`))
        process.exit(1)
      }
    }

    try {
      p.log.step(c.cyan(`Start cloning:  ${pluginUrl} to  ${pluginPath}`))
      execSync(`git clone ${pluginUrl} ${pluginPath}`, { stdio: 'inherit' })
      p.log.success(c.green(`Cloned ${pluginName} to: ${pluginPath}`))
    }
    catch (err) {
      p.log.error(c.red(`✘ ${String(err)}`))
      process.exit(1)
    }

    await execCommand(pluginName, `source ${pluginPath}/${pluginName}.plugin.zsh`, zshrcPath)
  }

  async function execCommand(name: string, command: string, targetPath: string) {
    await removeStringBlock(name, targetPath)
    await pushStringToTargetAndLog(generateBlock(name, command), targetPath)
  }

  async function pushStringToTargetAndLog(cmdStr: string, targetPath: string) {
    await pushStringToTarget(cmdStr, targetPath)
    p.log.success(c.green(`Added ${cmdStr} to ${targetPath}`))
  }

  function marker(name: string) {
    return `# <<< ${name} initialize <<<`
  }

  function generateBlock(name: string, command: string) {
    const markerLine = marker(name)
    return `\n${markerLine}\n${command}\n${markerLine}\n`
  }

  async function removeStringBlock(name: string, targetPath: string) {
    try {
      if (!fs.existsSync(targetPath))
        return

      let content = await fsp.readFile(targetPath, 'utf-8')

      const startMarker = `# <<< ${name} initialize <<<`
      const endMarker = `# <<< ${name} initialize <<<`
      const regex = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`, 'g')
      content = content.replace(regex, '').trim()

      await fs.promises.writeFile(targetPath, content, 'utf-8')
    }
    catch (err) {
      console.error(err)
    }
  }
}
