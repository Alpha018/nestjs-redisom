import { RedisOmErrorCode } from './redis-om-error.code';
import { RedisOmException } from './redis-om.exception';

/**
 * Thrown when the Redis instance does not support RediSearch commands.
 * Typically caused by running against a plain Redis Cluster without Redis Stack modules.
 * The repository is still returned — callers should handle the absence of search functionality.
 */
export class RedisOmUnsupportedCommandException extends RedisOmException {
  static override readonly message =
    'Redis does not support this command — Redis Stack modules may not be loaded';
  static override readonly code = RedisOmErrorCode.UNSUPPORTED_COMMAND;
  static override readonly pattern = /unknown command/i;
}

/**
 * Thrown when a RediSearch index already exists.
 * Non-fatal — the repository continues operating normally using the existing index.
 */
export class RedisOmIndexAlreadyExistsException extends RedisOmException {
  static override readonly message =
    'Redis OM index already exists and will be reused';
  static override readonly code = RedisOmErrorCode.INDEX_ALREADY_EXISTS;
  static override readonly pattern = /^Index already exists$/;
}

/**
 * Thrown when index creation fails for an unexpected reason.
 * The original error is available via the standard `cause` property.
 */
export class RedisOmIndexCreationFailedException extends RedisOmException {
  static override readonly code = RedisOmErrorCode.INDEX_CREATION_FAILED;
  static override readonly message = 'Failed to create Redis OM index';
}

/**
 * Catch-all for unexpected Redis OM errors that do not match a more specific type.
 */
export class RedisOmUnexpectedException extends RedisOmException {
  static override readonly message = 'An unexpected Redis OM error occurred';
  static override readonly code = RedisOmErrorCode.UNEXPECTED_ERROR;
}

/**
 * Thrown when the Redis connection cannot be established.
 */
export class RedisOmConnectionFailedException extends RedisOmException {
  static override readonly code = RedisOmErrorCode.CONNECTION_FAILED;
  static override readonly message = 'Failed to connect to Redis';
}
