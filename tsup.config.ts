import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    'cli': 'src/cli.ts',
    'command/ssh': 'src/command/ssh.ts',
  },
  shims: true,
  format: ['esm'],
})
