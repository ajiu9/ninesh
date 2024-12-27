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

import { pushStringToZsh } from '../../utils'

const _homeDir = homedir()
const zshrcPath = path.join(_homeDir, '.zshrc')

export async function run(args: ArgumentsCamelCase) {
  const __dirname = fileURLToPath(new URL('.', import.meta.url))
  const zshDir = path.resolve(__dirname, 'plugins/zsh')

  if (args.zsh) {
    await execCommand('custom zsh', `source ${zshDir}/index.zsh`)
    return
  }

  if (args.starship)
    await execCommand('starship', `eval "$(starship init zsh)"`)

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

    await execCommand(pluginName, `source ${pluginPath}/${pluginName}.plugin.zsh`)
  }

  async function execCommand(name: string, command: string) {
    await removeStringBlock(name)
    await pushStringToZshAndLog(String(blockCommandStr(name, command)))
  }

  async function pushStringToZshAndLog(cmdStr: string) {
    await pushStringToZsh(cmdStr)
    p.log.success(c.green(`Added ${cmdStr} to ${zshrcPath}`))
  }

  function marker(name: string) {
    const marker = `\# <<< ${name} initialize <<<`
    return marker
  }

  function blockCommandStr(name: string, command: string) {
    const markerItem = marker(name)
    return `\r\r\'${markerItem}\\r${command}\\n${markerItem}\\n'`
  }

  async function removeStringBlock(name: string) {
    try {
      let zshrcContent = await fsp.readFile(zshrcPath, 'utf-8')

      const startMarker = `# <<< ${name} initialize <<<`
      const endMarker = `# <<< ${name} initialize <<<`
      const regex = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`, 'g')
      zshrcContent = zshrcContent.replace(regex, '').trim()

      await fs.promises.writeFile(zshrcPath, zshrcContent, 'utf-8')
    }
    catch (err) {
      console.error(err)
    }
  }
}
