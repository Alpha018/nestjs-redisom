import { RedisOmErrorCode } from './redis-om-error.code';

/**
 * Base exception for all Redis OM module errors.
 *
 * Uses `new.target` to read `code` and `message` from the concrete subclass's
 * static properties — subclasses never need their own constructor.
 *
 * Follows the ES2022 standard `{ cause }` option for wrapping original errors.
 *
 * @example
 * ```typescript
 * catch (e) {
 *   if (e instanceof RedisOmException) {
 *     console.error(e.code, e.cause);
 *   }
 * }
 * ```
 */
export abstract class RedisOmException extends Error {
  static readonly code: RedisOmErrorCode;
  /** Optional regex to match against the raw error message from Redis. */
  static readonly pattern?: RegExp;
  static readonly message: string;

  readonly code: RedisOmErrorCode;

  constructor(cause?: unknown) {
    const { message, code } = new.target as typeof RedisOmException;
    super(message, cause !== undefined ? { cause } : undefined);
    this.name = this.constructor.name;
    this.code = code;
  }

  /** Returns true when the given raw message matches this exception's pattern. */
  static matches(msg: string): boolean {
    return this.pattern?.test(msg) ?? false;
  }
}
