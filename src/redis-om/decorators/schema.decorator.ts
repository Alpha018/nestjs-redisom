import { REDIS_OM_SCHEMA_METADATA } from '../redis-om.constants';

export interface SchemaOptions {
  indexName?: string;
  dataStructure?: 'JSON' | 'HASH';
}

export function Schema(options: SchemaOptions = {}): ClassDecorator {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  return (target: Function) => {
    Reflect.defineMetadata(REDIS_OM_SCHEMA_METADATA, options, target);
  };
}
