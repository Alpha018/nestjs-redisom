import { REDIS_OM_PROP_METADATA } from '../redis-om.constants';

/**
 * Options for configuring a property in a Redis OM Schema.
 */
export interface PropOptions {
  /** The data type of the property. Can be a primitive, array, or nested class. */
  type?: RedisOmFieldType;
  /** Whether text search should be case-sensitive. */
  caseSensitive?: boolean;
  /** Enables full-text search capability for string fields. */
  textSearch?: boolean;
  /** Performs text normalization (e.g. trimming, lowercasing) before indexing. */
  normalized?: boolean;
  /** Allows the field to be used for sorting results. */
  sortable?: boolean;
  /** Character used to separate tags in a string. */
  separator?: string; // Tag separator
  /** Enables stemming for full-text search. */
  stemming?: boolean;
  /** Marks the field as indexed for exact match or range queries. */
  indexed?: boolean;
  /** Specifies a custom matcher for the field. */
  matcher?: string;
  /** Relevance weight for text search scoring. */
  weight?: number;
  /** The alias logic: overrides the default property name in Redis. */
  field?: string; // name in redis, alias
  /** The JSON path for mapping nested properties (e.g. `$.address.city`). */
  path?: string; // JSON path
}

/**
 * Supported field types for Redis OM properties, including factories for nested schemas.
 */
export type RedisOmFieldType =
  | { (): { new(...args: any[]): any } } // Allow factory function
  | { new(...args: any[]): any } // Allow class constructor for nested schema
  | 'string[]'
  | 'number[]'
  | 'boolean'
  | 'string'
  | 'number'
  | 'point'
  | 'date'
  | 'text';

/**
 * Decorator to define a property in a Redis OM Entity Schema.
 * @param options Configuration options for the property (indexing, type, alias, etc.).
 * @returns A property decorator.
 */
export function Prop(options: PropOptions = {}): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const existingProps: any[] =
      Reflect.getMetadata(REDIS_OM_PROP_METADATA, target.constructor) || [];
    existingProps.push({ propertyKey, options });
    Reflect.defineMetadata(
      REDIS_OM_PROP_METADATA,
      existingProps,
      target.constructor,
    );
  };
}
