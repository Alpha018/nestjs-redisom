/**
 * Determines whether a `@Prop` `type` option refers to a nested class rather
 * than a primitive/array RedisOmFieldType.
 */
export function isNestedClass(type: any): boolean {
  return (
    typeof type === 'function' &&
    ![Boolean, String, Number, Date].includes(type)
  );
}

/**
 * Resolves the actual class constructor behind a `@Prop` `type` option,
 * unwrapping factory functions (`() => Class`) used to avoid circular imports.
 */
export function resolveNestedTarget(type: any): { new (...args: any[]): any } {
  return type.prototype instanceof Object ? type : type();
}
