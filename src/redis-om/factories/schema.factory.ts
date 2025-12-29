import { Type } from '@nestjs/common';
import { Schema } from 'redis-om';

import {
  REDIS_OM_SCHEMA_METADATA,
  REDIS_OM_PROP_METADATA,
} from '../redis-om.constants';

export class SchemaFactory {
  static createForClass(target: Type<any>): Schema {
    const schemaOptions = Reflect.getMetadata(REDIS_OM_SCHEMA_METADATA, target);

    if (!schemaOptions) {
      throw new Error(
        `Class ${target.name} is not decorated with @Schema decorator`,
      );
    }

    const schemaDefinition: Record<string, any> = {};
    this.buildSchemaProperties(target, schemaDefinition);

    return new Schema(schemaOptions.name || target.name, schemaDefinition, {
      ...schemaOptions,
    });
  }

  private static processStandardField(
    propertyKey: string,
    options: any,
    schemaDefinition: Record<string, any>,
    pathPrefix: string,
    keyPrefix: string,
  ) {
    const fieldDefinition: any = { type: options.type || 'string' };

    if (options.indexed) {
      fieldDefinition.sortable = options.sortable;
    }

    Object.assign(fieldDefinition, options);

    if (!fieldDefinition.path && pathPrefix !== '$') {
      fieldDefinition.path = `${pathPrefix}.${propertyKey}`;
    }

    const fieldKey = keyPrefix ? `${keyPrefix}_${propertyKey}` : propertyKey;

    schemaDefinition[fieldKey] = fieldDefinition;
  }

  private static processNestedClass(
    type: any,
    propertyKey: string,
    schemaDefinition: Record<string, any>,
    pathPrefix: string,
    keyPrefix: string,
  ) {
    const nestedPathPrefix = `${pathPrefix}.${propertyKey}`;
    const nestedKeyPrefix = keyPrefix
      ? `${keyPrefix}_${propertyKey}`
      : propertyKey;

    // Resolve factory function if needed
    const nestedTarget =
      type.prototype instanceof Object ? type : (type as any)();

    this.buildSchemaProperties(
      nestedTarget,
      schemaDefinition,
      nestedPathPrefix,
      nestedKeyPrefix,
    );
  }

  private static processProperty(
    prop: any,
    schemaDefinition: Record<string, any>,
    pathPrefix: string,
    keyPrefix: string,
  ) {
    const { propertyKey, options } = prop;
    const type = options.type;

    if (this.isNestedClass(type)) {
      this.processNestedClass(
        type,
        propertyKey,
        schemaDefinition,
        pathPrefix,
        keyPrefix,
      );
    } else {
      this.processStandardField(
        propertyKey,
        options,
        schemaDefinition,
        pathPrefix,
        keyPrefix,
      );
    }
  }

  private static buildSchemaProperties(
    target: { new (...args: any[]): any },
    schemaDefinition: Record<string, any>,
    pathPrefix = '$',
    keyPrefix = '',
  ) {
    const propMetadata =
      Reflect.getMetadata(REDIS_OM_PROP_METADATA, target) || [];

    propMetadata.forEach((prop: any) => {
      this.processProperty(prop, schemaDefinition, pathPrefix, keyPrefix);
    });
  }

  private static isNestedClass(type: any): boolean {
    return (
      typeof type === 'function' &&
      ![Boolean, String, Number, Date].includes(type)
    );
  }
}
