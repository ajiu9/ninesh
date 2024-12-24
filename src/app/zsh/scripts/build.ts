import { join, resolve } from 'node:path'
// import fg from 'fast-glob'
import fs from 'fs-extra'

async function run() {
  const from = resolve('src/app/zsh/plugins')
  const targetRoot = resolve('dist/plugins/zsh')
  await fs.copy(from, join(targetRoot, 'plugins'))
  await fs.writeFile(join(targetRoot, 'index.zsh'), `fpath+="\${0:A:h}/plugins"

for plugin_file in "\${0:A:h}/plugins"/*.zsh; do
  [[ -f "$plugin_file" ]] && source "$plugin_file"
done
  `)
}

run()
