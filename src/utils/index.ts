import { execSync } from 'node:child_process'

export function pushStringToZsh(cmdStr: string): boolean {
  try {
    execSync(`echo ${cmdStr} >> ~/.zshrc`)
    return true
  }
  catch {
    return false
  }
}
