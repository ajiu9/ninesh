import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pushStringToZsh } from '../../utils'

export function run(args) {
  const __dirname = fileURLToPath(new URL('.', import.meta.url))
  const zshDir = path.resolve(__dirname, 'plugins/zsh')

  if (args.init)
    pushStringToZsh(`source \\"${zshDir}/index.zsh\\"`)
}
