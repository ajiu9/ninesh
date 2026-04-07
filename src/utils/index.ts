import fs from 'node:fs'

export async function pushStringToTarget(content: string, targetPath: string) {
  try {
    fs.appendFileSync(targetPath, content)
    return true
  }
  catch {
    return false
  }
}

export async function pushStringToZsh(content: string) {
  return pushStringToTarget(content, '~/.zshrc')
}
