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
    const commandStr = `source ${zshDir}/index.zsh`
    const included = await zshIncludesString(commandStr)
    if (included) return

    await pushStringToZshAndLog(commandStr)
    return
  }
  if (args.omz) {
    const plugins = {
      'zsh-autosuggestions': 'https://github.com/zsh-users/zsh-autosuggestions',
      'zsh-completions': 'https://github.com/zsh-users/zsh-completions',
      'fast-syntax-highlighting': 'https://github.com/zdharma-continuum/fast-syntax-highlighting.git',
    }
    for (const plugin of Object.entries(plugins) as [string, string][])
      await runOmz(plugin)
    return
  }

  if (args.starship) {
    const commandStr = `eval "$(starship init zsh)"`
    const markerItem = marker('starship')
    const blockCommandStr = `\r\'${markerItem}\\n${commandStr}\\n${markerItem}\\n'`
    await removeStringBlock('starship')

    await pushStringToZshAndLog(String(blockCommandStr))
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

    const commandStr = `source ${pluginPath}/${pluginName}.plugin.zsh`
    const included = await zshIncludesString(commandStr)
    if (included) return

    pushStringToZshAndLog(commandStr)
  }

  async function zshIncludesString(searchString: string) {
    const zshContext = await fsp.readFile(zshrcPath, 'utf-8')
    const included = zshContext.includes(searchString)
    if (included)
      p.log.step(c.cyan(`Zsh config existing: ${searchString}`))

    return included
  }

  async function pushStringToZshAndLog(cmdStr: string) {
    await pushStringToZsh(cmdStr)
    p.log.success(c.green(`Added ${cmdStr} to ${zshrcPath}`))
  }

  function marker(name: string) {
    const marker = `\# <<< ${name} initialize <<<`
    return marker
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
