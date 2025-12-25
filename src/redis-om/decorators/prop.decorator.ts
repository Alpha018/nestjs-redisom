/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { REDIS_OM_PROP_METADATA } from '../redis-om.constants';

export type RedisOmFieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'string[]'
  | 'date'
  | 'point'
  | 'text';

export interface PropOptions {
  type?: RedisOmFieldType;
  indexed?: boolean;
  sortable?: boolean;
  textSearch?: boolean;
  normalized?: boolean;
  weight?: number;
  caseSensitive?: boolean;
  matcher?: string;
  field?: string; // name in redis, alias
}

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
