import {entity, registerEntities} from '@convey/core'

export class Tags extends entity(Set<string>) {}

export class MyComplicatedStructure extends entity<{
  createdAt: Date
  tags: Tags
}>() {}

export class BaseError extends entity<{
  code: string
}>() {}

export class EntityDate extends entity(Date) {}

registerEntities({Tags, MyComplicatedStructure, EntityDate, BaseError})
