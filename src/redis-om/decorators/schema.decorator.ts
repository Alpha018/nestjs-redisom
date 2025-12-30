import { REDIS_OM_SCHEMA_METADATA } from '../redis-om.constants';

/**
 * Configuration options for a Redis OM Entity Schema.
 */
export interface SchemaOptions {
  /** The underlying data structure in Redis (JSON or HASH). Defaults to JSON. */
  dataStructure?: 'JSON' | 'HASH';
  /** Custom name for the search index. */
  indexName?: string;
  /** The schema prefix/name used for key generation (e.g., `Person` -> `Person:ID`). */
  name?: string;
}

/**
 * Decorator to mark a class as a Redis OM Entity.
 * @param options Configuration for the schema (structure, names).
 * @returns A class decorator.
 */
export function Schema(options: SchemaOptions = {}): ClassDecorator {
  return (target: object) => {
    Reflect.defineMetadata(REDIS_OM_SCHEMA_METADATA, options, target);
  };
}
