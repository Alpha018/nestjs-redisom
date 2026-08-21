import { Type } from '@nestjs/common';

import {
  REDIS_OM_SCHEMA_METADATA,
  REDIS_OM_PROP_METADATA,
} from '../redis-om.constants';
import { resolveNestedTarget, isNestedClass } from './nested-class.util';

/**
 * Resolves the flattened field key for a root or nested `@Prop`, so callers
 * don't need to know (or hardcode) the entity's flattening separator.
 *
 * Accepts either a dot-separated string path or a typed property selector —
 * both describe the same nested path and produce the same flattened key.
 *
 * @example
 * ```typescript
 * repo.search().where(fieldPath(PersonEntity, 'homeAddress.city')).eq('NY');
 * repo.search().where(fieldPath(PersonEntity, (p) => p.homeAddress.city)).eq('NY');
 * ```
 */
export function fieldPath<T>(entity: Type<T>, path: string): string;
export function fieldPath<T>(
  entity: Type<T>,
  selector: (proxy: T) => unknown,
): string;
export function fieldPath<T>(
  entity: Type<T>,
  pathOrSelector: ((proxy: T) => unknown) | string,
): string {
  const segments =
    typeof pathOrSelector === 'string'
      ? pathOrSelector.split('.')
      : captureSelectorPath(pathOrSelector);

  if (segments.length === 0 || segments.some((s) => s.length === 0)) {
    throw new Error(
      `Invalid field path passed to fieldPath(${entity.name}, ...): path segments cannot be empty.`,
    );
  }

  validatePath(entity, segments);

  const schemaOptions =
    Reflect.getMetadata(REDIS_OM_SCHEMA_METADATA, entity) || {};
  const nestedSeparator = schemaOptions.nestedSeparator ?? '_';

  return segments.join(nestedSeparator);
}
/**
 * Walks the `@Prop` metadata of `entity` (and any nested classes) following
 * `segments`, throwing if a segment isn't a decorated property or an
 * intermediate segment isn't a nested class.
 */
function validatePath(entity: Type<any>, segments: string[]): void {
  let target: any = entity;

  segments.forEach((segment, index) => {
    const propMetadata: any[] =
      Reflect.getMetadata(REDIS_OM_PROP_METADATA, target) || [];
    const prop = propMetadata.find((p) => p.propertyKey === segment);

    if (!prop) {
      throw new Error(
        `Invalid field path '${segments.join('.')}': '${segment}' is not a @Prop() of ${target.name ?? target}.`,
      );
    }

    const isLast = index === segments.length - 1;
    if (!isLast) {
      if (!isNestedClass(prop.options.type)) {
        throw new Error(
          `Invalid field path '${segments.join('.')}': '${segment}' is not a nested object, so '${segments[index + 1]}' cannot be accessed on it.`,
        );
      }
      target = resolveNestedTarget(prop.options.type);
    }
  });
}
/**
 * Captures a chain of property accesses (e.g. `p => p.homeAddress.city`) into
 * an ordered list of property names, using a Proxy that records every `get`.
 */
function captureSelectorPath(selector: (proxy: any) => unknown): string[] {
  const segments: string[] = [];
  const handler: ProxyHandler<object> = {
    get(_target, prop) {
      if (typeof prop === 'string') segments.push(prop);
      return new Proxy({}, handler);
    },
  };
  selector(new Proxy({}, handler));
  return segments;
}
