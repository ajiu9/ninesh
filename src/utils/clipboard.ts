import process from 'node:process'
import { execa, execaSync } from 'execa'

const env = {
  LC_CTYPE: 'UTF-8',
}

const macos = {
  copy: async (options: { input: string }) => execa('pbcopy', { ...options, env }),
  async paste(options: { stripFinalNewline?: boolean }) {
    const { stdout } = await execa('pbpaste', { ...options, env })
    return stdout
  },
  copySync: (options: { input: string }) => execaSync('pbcopy', { ...options, env }),
  pasteSync: (options: { stripFinalNewline?: boolean }) => execaSync('pbpaste', { ...options, env }).stdout,
}

interface Clipboard {
  write: (text: string) => Promise<void>
  read: () => Promise<string>
  writeSync: (text: string) => void
  readSync: () => string
}

export const clipboard: Clipboard = (() => {
  const clipboard: Clipboard = {} as Clipboard
  const platform = platformLib()

  clipboard.write = async (text: string) => {
    if (typeof text !== 'string')
      throw new TypeError(`Expected a string, got ${typeof text}`)
    await platform.copy({ input: text })
  }

  clipboard.read = async () => platform.paste({ stripFinalNewline: false })

  clipboard.writeSync = (text: string) => {
    if (typeof text !== 'string')
      throw new TypeError(`Expected a string, got ${typeof text}`)

    platform.copySync({ input: text })
  }

  clipboard.readSync = () => platform.pasteSync({ stripFinalNewline: false })

  return clipboard
})()

function platformLib() {
  const defaultFn = {
    copy: async () => {},
    paste: async () => '',
    copySync: () => {},
    pasteSync: () => '',
  }
  switch (process.platform) {
    case 'darwin': {
      return macos
    }

    case 'win32': {
      return defaultFn
    }

    case 'android': {
      if (process.env.PREFIX !== '/data/data/com.termux/files/usr')
        throw new Error('You need to install Termux for this module to work on Android: https://termux.com')

      return defaultFn
    }

    default: {
      return defaultFn
    }
  }
}
