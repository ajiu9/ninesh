import process from 'node:process'
import pkgJson from '../package.json'

export const uPath = process.env.HOME
export const rootPath = `${uPath}/.ninesh`
export { pkgJson }
