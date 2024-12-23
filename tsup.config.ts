import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    'obsidian/index': 'src/index.ts',
    'obsidian/cli': 'src/cli.ts',
  },
  shims: true,
})
