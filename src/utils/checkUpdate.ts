import process from 'node:process'
import { execa } from 'execa'
import c from 'picocolors'
import semver from 'semver'
import { pkgJson } from '../constants'

const CHECK_INTERVAL = 1000 * 60 * 60 * 24 // 1 day
const CACHE_FILE = `${process.env.HOME}/.ninesh/.version-check`

interface VersionCache {
  lastChecked: number
  latestVersion: string
}

async function getCache(): Promise<VersionCache | null> {
  try {
    const fs = await import('fs-extra')
    if (await fs.pathExists(CACHE_FILE))
      return await fs.readJson(CACHE_FILE)
  }
  catch {
    // ignore
  }
  return null
}

async function setCache(latestVersion: string): Promise<void> {
  try {
    const fs = await import('fs-extra')
    await fs.ensureDir(`${process.env.HOME}/.ninesh`)
    await fs.writeJson(CACHE_FILE, {
      lastChecked: Date.now(),
      latestVersion,
    })
  }
  catch {
    // ignore
  }
}

export async function checkForUpdate(): Promise<string | null> {
  const currentVersion = pkgJson.version
  const packageName = pkgJson.name

  // Check cache first
  const cache = await getCache()
  if (cache && Date.now() - cache.lastChecked < CHECK_INTERVAL) {
    if (semver.gt(cache.latestVersion, currentVersion))
      return cache.latestVersion

    return null
  }

  // Fetch latest version from npm — try official registry first, mirror as fallback
  const registries = [
    'https://registry.npmjs.org',
    'https://registry.npmmirror.com',
  ]

  for (const registry of registries) {
    try {
      const { stdout: latestVersion } = await execa('npm', [
        'view',
        packageName,
        'version',
        '--registry',
        registry,
      ])

      await setCache(latestVersion)

      if (semver.gt(latestVersion, currentVersion))
        return latestVersion

      return null
    }
    catch {
      // try next registry
    }
  }

  return null
}

export function printUpdateMessage(latestVersion: string): void {
  console.error()
  console.error(
    c.yellow(`  A new version of ninesh is available: ${c.dim(pkgJson.version)} → ${c.green(`v${latestVersion}`)}`),
  )
  console.error(
    c.dim(`  Run ${c.cyan('ninesh update')} to update.`),
  )
  console.error()
}
