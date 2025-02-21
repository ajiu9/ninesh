import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import fs from 'node:fs/promises'
import { createRequire } from 'node:module'
import { cpus } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { parseArgs } from 'node:util'
import minimist from 'minimist'
import { targets as allTargets, exec } from './utils.js'

const require = createRequire(import.meta.url)
const commit = spawnSync('git', ['rev-parse', '--short=7', 'HEAD'])
  .stdout.toString()
  .trim()

const args = minimist(process.argv.slice(2))

const sourceMap = args.sourcemap || args.s
const { positionals: targets } = parseArgs({
  allowPositionals: true,
  options: {
    formats: {
      type: 'string',
      short: 'f',
    },
    withTypes: {
      type: 'boolean',
      short: 't',
    },
    sourceMap: {
      type: 'boolean',
      short: 's',
    },
    release: {
      type: 'boolean',
    },
    all: {
      type: 'boolean',
      short: 'a',
    },
    size: {
      type: 'boolean',
    },
  },
})

run()

function run() {
  const resolvedTargets = targets.length ? targets : allTargets
  buildAll(resolvedTargets)
}

async function buildAll(targets) {
  await runParallel(cpus.length, targets, build)
}

async function runParallel(maxConcurrency, source, iteratorFn) {
  const ret = []

  const executing = []
  for (const item of source) {
    const p = Promise.resolve().then(() => iteratorFn(item, source))
    ret.push(p)

    if (maxConcurrency <= source.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1))
      executing.push(e)
      if (executing.length >= maxConcurrency)
        await Promise.race(executing)
    }
  }
  return Promise.all(ret)
}

async function build(target) {
  const pkgDir = path.resolve(`packages/${target}`)
  const pkg = require(`${pkgDir}/package.json`)
  // ignore private package
  if (pkg.private) return
  // remove dist
  if (existsSync(`${pkgDir}/dist`))
    fs.rm(`${pkgDir}/dist`, { recursive: true })

  const env = (pkg.buildOptions && pkg.buildOptions.env) || 'production'
  await exec('rollup',
    [
      '-c',
      '--environment',
      [
        `NODE_ENV:${env}`,
        `COMMIT:${commit}`,
        `TARGET:${target}`,
        sourceMap ? 'SOURCE_MAP:true' : '',
      ]
        .filter(Boolean)
        .join(','),
    ],
    { stdio: 'inherit' },
  )
}
