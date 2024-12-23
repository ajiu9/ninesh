import process from 'node:process'
import * as p from '@clack/prompts'
import c from 'picocolors'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

import { run as obsidianRun } from '../app/obsidian/run'

import { pkgJson } from './constants'

function header(): void {
  p.intro(`${c.green(`ninesh `)}${c.dim(`v${pkgJson.version}`)}`)
}

const instance = yargs(hideBin(process.argv))
  .scriptName('ninesh')
  .usage('Usage: $0 [-v | --version] [-h | --help] <command> [<args>]')
  .epilog(`
  These are common Ninesh commands used in various situations:

  Obsidian plugin (see also:  ninesh obsidian help)
    obsidian     Genarate Obsidian template

  For more information on a specific command, run:
    ninesh help <command>
`)
  .showHelpOnFail(false)
  .alias('h', 'help')
  .version('version', `${pkgJson.name} ${pkgJson.version}`)
  .alias('v', 'version')
  .command(
    'obsidian [options]',
    'Obsidian plugin, Genarate Obsidian template(see also: ninesh obsidian help)',
    args => args
      .option('daily', {
        alias: 'd',
        describe: 'Generate daily plan template',
        type: 'boolean',
      })
      .option('weekly', {
        alias: 'w',
        describe: 'Generate weekly plan template',
        type: 'boolean',
      })
      .option('empty', {
        alias: 'e',
        describe: 'Generate empty template',
        type: 'boolean',
      })
      .option('task', {
        alias: 't',
        describe: 'Generate daily plan template',
        type: 'string',
        choices: ['weekly', 'yearly'],
      })
      .option('next', {
        alias: 'n',
        describe: 'Generate daily plan template',
        type: 'boolean',
      })
      .help(),
    async (args) => {
      header()
      try {
        await obsidianRun(args)
      }
      catch (error) {
        p.log.error(c.inverse(c.red(' Failed to clone ')))
        p.log.error(c.red(`✘ ${String(error)}`))
        process.exit(1)
      }
    },
  )

// eslint-disable-next-line ts/no-unused-expressions
instance
  .help()
  .argv
