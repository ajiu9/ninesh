import { join, resolve } from 'node:path'
// import fg from 'fast-glob'
import fs from 'fs-extra'

async function run() {
  // zsh plugins
  const zshFrom = resolve('src/app/zsh/plugins')
  const zshTargetRoot = resolve('dist/plugins/zsh')
  await fs.copy(zshFrom, join(zshTargetRoot, 'plugins'))
  await fs.writeFile(join(zshTargetRoot, 'index.zsh'), `fpath+="\${0:A:h}/plugins"

for plugin_file in "\${0:A:h}/plugins"/*.zsh; do
  [[ -f "$plugin_file" ]] && source "$plugin_file"
done
  `)

  // bash plugins
  const bashFrom = resolve('src/app/zsh/plugins/bash')
  const bashTargetRoot = resolve('dist/plugins/bash')
  await fs.ensureDir(bashTargetRoot)
  await fs.copy(bashFrom, bashTargetRoot)
}

run()
