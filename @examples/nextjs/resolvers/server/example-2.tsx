import {createResolver} from '@convey/core'
import {guard} from '@examples/nextjs/utils/guard'
import * as s from 'superstruct'

export const getServerGreeting = createResolver(
  guard(
    s.object({
      name: s.enums(['world', 'universe']),
      age: s.number(),
    }),
    (data) => {
      return `Hello, ${data.name}`
    },
  ),
)
