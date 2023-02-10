import {createEntityNamespace, registerEntities} from '@convey/core';

const entity = createEntityNamespace('example');

export class ExampleEntity extends entity<{
    id: number;
    name: string;
}>() {}

registerEntities({ExampleEntity});
