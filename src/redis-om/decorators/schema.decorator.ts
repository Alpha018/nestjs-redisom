import { REDIS_OM_SCHEMA_METADATA } from '../redis-om.constants';

export interface SchemaOptions {
  dataStructure?: 'JSON' | 'HASH';
  indexName?: string;
  name?: string;
}

export function Schema(options: SchemaOptions = {}): ClassDecorator {
  return (target: object) => {
    Reflect.defineMetadata(REDIS_OM_SCHEMA_METADATA, options, target);
  };
}
