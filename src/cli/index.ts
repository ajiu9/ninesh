import process from 'node:process'
import * as p from '@clack/prompts'
import c from 'picocolors'
import yargs from 'yargs'

import { hideBin } from 'yargs/helpers'

import { run as jumpRun } from '../app/jump/run'
import { run as obsidianRun } from '../app/obsidian/run'
import { run as projectRun } from '../app/project/run'
import { run as zshRun } from '../app/zsh/run'
import { run as updateRun } from '../command/update'
import { pkgJson } from '../constants'
import { checkForUpdate, printUpdateMessage } from '../utils/checkUpdate'

function header(): void {
  p.intro(`${c.green(`ninesh `)}${c.dim(`v${pkgJson.version}`)}`)
}

const instance = yargs(hideBin(process.argv))
  .scriptName('ninesh')
  .usage('Usage: $0 [-v | --version] [-h | --help] <command> [<args>]')
  .epilog(`
These are common Ninesh commands used in various situations:

Obsidian plugin (see also:  ninesh obsidian help)
  obsidian     Generate Obsidian template

Init zsh plugin (see also:  ninesh init help)
  init         Add common zsh plugins, customize zsh config

Jump directories (see also:  ninesh jump help)
  jump         Jump to frequently visited directories

Update ninesh (see also:  ninesh update help)
  update       Check for updates and update to the latest version

For more information on a specific command, run:
  ninesh help <command>
  `)
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
        handleError(error)
      }
    },
  )
  .command(
    'init [options]',
    'Add common zsh plugins, customize zsh config',
    args => args
      .option('zsh', {
        alias: 'z',
        describe: 'Add common zsh plugins to ~/.zshrc',
        type: 'boolean',
      })
      .option('bash', {
        alias: 'b',
        describe: 'Add common bash plugins to ~/.bashrc',
        type: 'boolean',
      })
      .option('omz', {
        alias: 'o',
        describe: 'Add o-my-zsh plugins to ~/.zshrc',
        type: 'boolean',
      })
      .option('starship', {
        alias: 's',
        describe: 'Add zsh theme starship plugins to ~/.zshrc',
        type: 'boolean',
      })
      .option('ninesh', {
        alias: 'n',
        describe: 'Add common ninesh plugins to ~/.zshrc',
        type: 'boolean',
      })
      .option('jump', {
        alias: 'j',
        describe: 'Add autojump-style directory jumping (j command)',
        type: 'boolean',
      })
      .help(),
    async (args) => {
      header()
      try {
        await zshRun(args)
        p.outro(c.green('Done!'))
      }
      catch (error) {
        handleError(error)
      }
    },
  )
  .command(
    'add <path>',
    'Add a new repository to you directory',
    (yargs: any) => {
      return yargs
        .positional('path', {
          describe: 'Add a new repository to you directory',
        })
        .option('base', {
          alias: 'b',
          describe: 'Set base directory for repository (skip interactive prompt)',
          type: 'string',
        })
    },
    async (args) => {
      header()
      try {
        await projectRun(args)
      }
      catch (error) {
        handleError(error)
      }
    },
  )
  .command(
    'shell [action] [target]',
    'Shell management - detect, list, configure terminals',
    (yargs: any) => {
      return yargs
        .positional('action', {
          describe: 'Action to perform',
          choices: ['info', 'list', 'switch', 'install', 'config'],
          default: 'info',
        })
        .positional('target', {
          describe: 'Target shell name (for switch/install)',
          type: 'string',
        })
    },
    async (args) => {
      header()
      try {
        const { run } = await import('../app/shell')
        await run(args)
      }
      catch (error) {
        handleError(error)
      }
    },
  )
  .command(
    'jump [query]',
    'Jump to frequently visited directories (like autojump)',
    (yargs: any) => yargs
      .positional('query', {
        describe: 'Directory pattern to match',
        type: 'string',
      })
      .option('add', {
        alias: 'a',
        describe: 'Add/increment a directory in the database',
        type: 'string',
      })
      .option('stat', {
        alias: 's',
        describe: 'Show jump statistics (top directories)',
        type: 'boolean',
      })
      .option('purge', {
        describe: 'Remove non-existent directories from database',
        type: 'boolean',
      })
      .option('top', {
        alias: 't',
        describe: 'Number of top directories to show',
        type: 'number',
      })
      .option('decay', {
        describe: 'Decay all directory weights',
        type: 'boolean',
      }),
    async (args) => {
      try {
        await jumpRun(args)
      }
      catch (error) {
        handleError(error)
      }
    },
  )
  .command(
    'update',
    'Check for updates and update ninesh to the latest version',
    args => args
      .option('check', {
        alias: 'c',
        describe: 'Only check for updates, do not update',
        type: 'boolean',
      })
      .help(),
    async (args) => {
      header()
      try {
        await updateRun(args)
        // After update, check if we're now on the latest version
        checkForUpdate().then((latestVersion) => {
          if (latestVersion)
            printUpdateMessage(latestVersion)
        })
      }
      catch (error) {
        handleError(error)
      }
    },
  )
  .showHelpOnFail(false)
  .alias('h', 'help')
  .version('version', `${pkgJson.name} ${pkgJson.version}`)
  .alias('v', 'version')

// eslint-disable-next-line ts/no-unused-expressions
instance
  .help()
  .argv

function handleError(error: unknown) {
  p.log.error(c.inverse(c.red(' Failed to clone ')))
  p.log.error(c.red(`✘ ${String(error)}`))
  process.exit(1)
}
