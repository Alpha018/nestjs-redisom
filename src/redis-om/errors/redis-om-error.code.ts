/**
 * Error codes for all Redis OM module exceptions.
 * Each code uniquely identifies the error type and can be used for
 * programmatic error handling without relying on message strings.
 */
export enum RedisOmErrorCode {
  INDEX_CREATION_FAILED = 'REDIS_OM_INDEX_CREATION_FAILED',
  INDEX_ALREADY_EXISTS = 'REDIS_OM_INDEX_ALREADY_EXISTS',
  UNSUPPORTED_COMMAND = 'REDIS_OM_UNSUPPORTED_COMMAND',
  CONNECTION_FAILED = 'REDIS_OM_CONNECTION_FAILED',
  UNEXPECTED_ERROR = 'REDIS_OM_UNEXPECTED_ERROR',
}
