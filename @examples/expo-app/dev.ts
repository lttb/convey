import type { SpawnOptions } from 'bun'

const spawnOptions: SpawnOptions.OptionsObject = {
  stdin: 'inherit',
  stdout: 'inherit',
  stderr: 'inherit',
}

Bun.spawn(['bun', 'run', 'start:resolvers'], spawnOptions)
Bun.spawn(['bun', 'run', 'start'], spawnOptions)
