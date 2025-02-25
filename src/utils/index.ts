import { execSync } from 'node:child_process'

export async function pushStringToZsh(cmdStr: string) {
  try {
    execSync(`echo ${cmdStr} >> ~/.zshrc`)
    return true
  }
  catch {
    return false
  }
}
