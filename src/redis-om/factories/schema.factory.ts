import { Type } from '@nestjs/common';
import { Schema } from 'redis-om';

import {
  REDIS_OM_SCHEMA_METADATA,
  REDIS_OM_PROP_METADATA,
} from '../redis-om.constants';

export class SchemaFactory {
  static createForClass(target: Type<any>): Schema {
    const schemaOptions =
      Reflect.getMetadata(REDIS_OM_SCHEMA_METADATA, target) || {};
    const propMetadata =
      Reflect.getMetadata(REDIS_OM_PROP_METADATA, target) || [];

    const schemaDefinition: Record<string, any> = {};

    propMetadata.forEach((prop: any) => {
      const { propertyKey, options } = prop;

      const fieldDefinition: any = { type: options.type || 'string' };

      if (options.indexed) fieldDefinition.sortable = options.sortable;

      Object.assign(fieldDefinition, options);

      schemaDefinition[propertyKey as string] = fieldDefinition;
    });

    return new Schema(target.name, schemaDefinition, {
      ...schemaOptions,
      entityCtor: target,
    });
  }
}
