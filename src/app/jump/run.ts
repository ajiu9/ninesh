import type { ArgumentsCamelCase } from 'yargs'
import process from 'node:process'
import * as p from '@clack/prompts'
import c from 'picocolors'
import { add, decay, purge, query } from './database'
import { search } from './match'

export interface JumpArgs {
  query?: string
  add?: string
  stat?: boolean
  purge?: boolean
  top?: number
  decay?: boolean
}

export async function run(args: ArgumentsCamelCase<JumpArgs>): Promise<void> {
  if (args.add) {
    add(args.add)
    return
  }

  if (args.purge) {
    const removed = purge()
    p.log.success(c.green(`Purged ${removed} non-existent director${removed === 1 ? 'y' : 'ies'}`))
    return
  }

  if (args.decay) {
    decay()
    p.log.success(c.green('All weights decayed'))
    return
  }

  if (args.stat || !args.query) {
    showStats(args.top || 10)
    return
  }

  // Query mode: find best match and print path to stdout
  const db = query()
  const results = search(args.query, db, 1)

  if (results.length === 0) {
    p.log.error(c.red(`No matching directory for: ${args.query}`))
    process.exit(1)
  }

  // Only output the path — shell function captures this for cd
  console.log(results[0].path)
}

function showStats(top: number): void {
  const db = query()
  const entries = Object.entries(db.entries)
    .sort(([, a], [, b]) => b.weight - a.weight)
    .slice(0, top)

  if (entries.length === 0) {
    p.log.info(c.dim('No entries yet. Start navigating directories to build up the database.'))
    return
  }

  p.log.info(c.cyan(`Top ${Math.min(top, entries.length)} directories:`))
  console.log()

  const maxWeight = entries[0]?.[1]?.weight ?? 1
  const maxPathLen = Math.max(...entries.map(([p]) => p.length))

  for (const [dirPath, entry] of entries) {
    const barLen = Math.max(1, Math.round((entry.weight / maxWeight) * 20))
    const bar = '█'.repeat(barLen)
    const paddedPath = dirPath.padEnd(maxPathLen + 2)
    console.log(`  ${c.green(bar)} ${c.yellow(String(entry.weight).padStart(4))}  ${paddedPath}`)
  }

  console.log()
  console.log(c.dim(`Total entries: ${Object.keys(db.entries).length}`))
}
