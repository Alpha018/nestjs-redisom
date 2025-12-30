import { Type } from '@nestjs/common';
import { Schema } from 'redis-om';

import {
  REDIS_OM_SCHEMA_METADATA,
  REDIS_OM_PROP_METADATA,
} from '../redis-om.constants';

/**
 * Factory class responsible for generating Redis OM Schemas from decorated classes.
 * It handles metadata reflection, field mapping, and recursive schema generation for nested objects.
 */
export class SchemaFactory {
  /**
   * Creates a Redis OM Schema instance from a decorated class.
   * @param target The class constructor decorated with @Schema.
   * @returns A properly configured Schema instance.
   * @throws Error if the class is missing the @Schema decorator.
   */
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

  /**
   * Processes a single standard (non-nested) field and adds it to the schema definition.
   */
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

  /**
   * Recursively processes a nested class property, flattening it into the parent schema.
   */
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

  /**
   * Routes property processing to either nested class handling or standard field handling.
   */
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

  /**
   * Iterates over decorated properties of a target class and populates the schema definition.
   */
  private static buildSchemaProperties(
    target: { new(...args: any[]): any },
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
