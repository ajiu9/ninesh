import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import json from '@rollup/plugin-json'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import pico from 'picocolors'
import esbuild from 'rollup-plugin-esbuild'
import polyfillNode from 'rollup-plugin-polyfill-node'

const require = createRequire(import.meta.url)
const __dirname = fileURLToPath(new URL('.', import.meta.url))

const packagesDir = path.resolve(__dirname, 'packages')
const packageDir = path.resolve(packagesDir, process.env.TARGET)

const resolve = p => path.resolve(packageDir, p)
const pkg = require(resolve('package.json'))
const packageOptions = pkg.buildOptions || {}
const name = packageOptions.filename || path.basename(packageDir)

const outputConfigs = {
  'esm-bundler': {
    file: resolve(`dist/${name}.esm-bundler.js`),
    format: 'es',
  },
  'esm-browser': {
    file: resolve(`dist/${name}.esm-browser.js`),
    format: 'es',
  },
  'cjs': {
    file: resolve(`dist/${name}.cjs.js`),
    format: 'cjs',
  },
  'global': {
    file: resolve(`dist/${name}.global.js`),
    format: 'iife',
  },
}

const defaultFormats = ['esm-bundler', 'cjs']
const packageFormats = packageOptions.formats || defaultFormats

const packageConfigs = []
if (process.env.NODE_ENV === 'production') {
  packageFormats.forEach((format) => {
    if (packageOptions.prod === false)
      return

    if (format === 'cjs')
      packageConfigs.push(createProductionConfig(format))
    else
      packageConfigs.push(createProductionConfig(format))

    // if (/^(global|esm-browser)/.test(format))
    // packageConfigs.push(createMinifiedConfig(format))
  })
}

export default packageConfigs

function createConfig(format, output, plugins = []) {
  if (!output) {
    console.log(pico.yellow(`invalid format: "${format}"`))
    process.exit(1)
  }
  return {
    input: resolve('src/index.ts'),
    output,
    plugins: [
      ...plugins,
      nodeResolve(),
      json(),
      // polyfillNode(),
      esbuild({
        minify: false,
        target: 'esnext',
      }),
      ...(format === 'cjs' ? [] : [polyfillNode()]),
    ],
    external: [],
    // optimizeDeps: {
    //   include: ['minimist'],
    // },
    onwarn(warning, warn) {
      if (warning.code === 'EVAL' && warning.id.includes('dataView')) return
      warn(warning)
    },
  }
}

function createProductionConfig(format) {
  return createConfig(format, {
    file: resolve(`dist/${name}.${format}.prod.js`),
    format: outputConfigs[format].format,
  })
}
