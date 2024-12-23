/**
 * ninesh o -w
 */
// import { main as obsidian } from './app/obsidian'

// obsidian()
import process from 'node:process'
import yargs from 'yargs'

export * from './cli/index'

// yargs(process.argv)
//   .command('get', 'make a get HTTP request', {
//     url: {
//       alias: 'u',
//       default: 'http://yargs.js.org/',
//     },
//   })
//   .help()
//   .parse()

// const argv = yargs(process.argv.slice(2))
//   .usage('./$0 - follow ye instructions true')
//   .option('option', {
//     alias: 'o',
//     describe: '\'tis a mighty fine option',
//   })
//   .command('run', 'Arrr, ya best be knowin\' what yer doin\'')
//   .example('$0 run foo', 'shiver me timbers, here\'s an example for ye')
//   .help('help')
//   .wrap(70)
//   .locale('pirate')
//   .parse()
