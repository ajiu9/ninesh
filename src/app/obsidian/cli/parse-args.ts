import cac from 'cac'
import { version } from '../../../../package.json'
import { ExitCode } from './exit-code'

export interface ParsedArgs {
  help?: boolean
  version?: boolean
  quiet?: boolean
  options: any
}

export async function parseArgs(): Promise<ParsedArgs> {
  try {
    const { args, resultArgs } = loadCliArgs()
    const { help, version, quiet, daily, weekly, empty, task } = args

    let target = 'empty'
    if (task) target = 'task'
    else if (daily) target = 'daily'
    else if (weekly) target = 'weekly'

    else if (empty) target = 'empty'

    const parsedArgs: ParsedArgs = {
      help: help as boolean,
      version: version as boolean,
      quiet: quiet as boolean,
      options: {
        ...args,
        target,
        other: [...(args['--'] || []), ...resultArgs],
      },
    }
    return parsedArgs
  }
  catch (error) {
    return errorHandler(error as Error)
  }
}

export function loadCliArgs(argv = process.argv) {
  const cli = cac('obsiflow')
  cli.version(version)
    .usage('[options]')
    .option('-d, --daily', 'Generate daily plan template')
    .option('-w, --weekly', 'Generate weekly plan template')
    .option('-e, --empty', 'Generate empty template')
    .option('-t, --task', 'Generate daily plan template')
    .option('-n, --next', 'Generate daily plan template')
    .option('-q, --quiet', 'Quiet mode')
    .option('-v, --version <version>', 'Target version')
    .help()

  const result = cli.parse(argv)
  const args = result.options

  return {
    args,
    resultArgs: result.args,
  }
}

function errorHandler(error: Error): never {
  console.error(error.message)
  return process.exit(ExitCode.InvalidArgument)
}
