import * as p from '@clack/prompts'
import { execa } from 'execa'
import c from 'picocolors'
import semver from 'semver'
import { pkgJson } from '../constants'

export interface UpdateOptions {
  check?: boolean
}

export async function run(options: UpdateOptions = {}): Promise<void> {
  const currentVersion = pkgJson.version
  const packageName = pkgJson.name

  p.log.info(`Current version: ${c.green(`v${currentVersion}`)}`)

  const s = p.spinner()
  s.start('Checking for updates...')

  try {
    // Get latest version from npm
    const { stdout: latestVersion } = await execa('npm', [
      'view',
      packageName,
      'version',
      '--registry',
      'https://registry.npmmirror.com',
    ])

    s.stop(`Latest version: ${c.cyan(`v${latestVersion}`)}`)

    // Compare versions
    if (semver.lte(latestVersion, currentVersion)) {
      p.log.success(c.green('You are already on the latest version!'))
      return
    }

    // Check only mode
    if (options.check) {
      p.log.info(`A new version is available: ${c.yellow(`v${latestVersion}`)}`)
      p.log.info(`Run ${c.cyan('ninesh update')} to update.`)
      return
    }

    // Ask for confirmation
    const shouldUpdate = await p.confirm({
      message: `Update to ${c.cyan(`v${latestVersion}`)}?`,
      defaultValue: true,
    })

    if (!shouldUpdate) {
      p.log.info('Update cancelled.')
      return
    }

    // Update the package globally
    const updateSpinner = p.spinner()
    updateSpinner.start('Updating ninesh...')

    await execa('npm', [
      'install',
      '-g',
      `${packageName}@latest`,
      '--registry',
      'https://registry.npmmirror.com',
    ])

    updateSpinner.stop(`Updated to ${c.green(`v${latestVersion}`)}!`)
    p.log.success(c.green('ninesh has been updated successfully!'))
  }
  catch (error) {
    s.stop('Failed to check for updates')
    p.log.error(c.red(`Failed to update: ${String(error)}`))
    throw error
  }
}
