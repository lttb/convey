import { $ } from 'bun'

await $`rm -rf dist`

await $`rollup -c`

await $`cp README.md dist/`
await $`cp package.json dist/`
await $`cp ../../LICENSE dist/`
