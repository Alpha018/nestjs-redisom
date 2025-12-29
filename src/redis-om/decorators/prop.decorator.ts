import { REDIS_OM_PROP_METADATA } from '../redis-om.constants';

export interface PropOptions {
  type?: RedisOmFieldType;
  caseSensitive?: boolean;
  textSearch?: boolean;
  normalized?: boolean;
  sortable?: boolean;
  separator?: string; // Tag separator
  stemming?: boolean;
  indexed?: boolean;
  matcher?: string;
  weight?: number;
  field?: string; // name in redis, alias
  path?: string; // JSON path
}

export type RedisOmFieldType =
  | { (): { new (...args: any[]): any } } // Allow factory function
  | { new (...args: any[]): any } // Allow class constructor for nested schema
  | 'string[]'
  | 'number[]'
  | 'boolean'
  | 'string'
  | 'number'
  | 'point'
  | 'date'
  | 'text';

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
