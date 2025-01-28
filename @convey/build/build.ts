import { $ } from 'bun'

import * as path from 'node:path'

const cwd = process.cwd()
const dist = path.resolve(cwd, 'dist/')

await $`rm -rf ${dist}`

await $`bun --bun rollup -c .config.rollup.ts`

await $`cp README.md ${dist}`
await $`cp package.json ${dist}`
await $`cp ../../LICENSE ${dist}`
