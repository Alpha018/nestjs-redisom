# Error Handling

When working with `nestjs-redisom`, it is important to understand how the library handles internal and external exceptions, especially regarding indexing and schema synchronization.

This library encapsulates all raw errors originating from `redis-om` or the underlying `redis` client into standard NestJS architectural patterns, specifically exposing custom exceptions that you can natively catch, log, or filter using NestJS's `ExceptionFilter`.

## Exception Hierarchy

All custom exceptions thrown by `nestjs-redisom` inherit from the base class: `RedisOmException`.

You can use this base class to catch any error specifically emitted by the module without inadvertently catching standard HTTP exceptions or unrelated database errors.

```typescript
import { Catch, ExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { RedisOmException } from 'nestjs-redisom';

@Catch(RedisOmException)
export class RedisOmExceptionFilter implements ExceptionFilter {
  catch(exception: RedisOmException, host: ArgumentsHost) {
    // Handle the custom exception gracefully
    console.error('Redis OM operation failed:', exception.message);
  }
}
```

## Specific Exceptions

The module exposes several specific exception classes to help you programmatically handle diverse failure scenarios:

- **`RedisOmUnsupportedCommandException`**: Thrown when a Redis command is executed but the target server does not support the necessary module (e.g., executing a full-text search against a Redis server that does not have the `RediSearch` module loaded).
- **`RedisOmIndexAlreadyExistsException`**: Thrown when attempting to create an index that already exists on the Redis server with identical schema configurations.
- **`RedisOmIndexCreationFailedException`**: A generic wrapper indicating that the `createIndex` process failed during application boot (which often wraps the underlying raw Node-Redis stack trace).

## "Ignorable" Exceptions during Bootstrap

When you inject a Repository into your services (using `@InjectRepository()`), the `nestjs-redisom` module asynchronously provisions the schema index via `createIndex()` under the hood during the NestJS bootstrap phase.

Inevitably, two common scenarios arise during development and production deploys:

 1. **The index already exists**: The application restarted and the index is already loaded in Redis.
 2. **Missing Modules**: You deploy the application pointing to a standard Redis instance (e.g., ElastiCache without RediSearch), meaning `createIndex()` throws an unknown command error.

**By design, `nestjs-redisom` silently swallows `RedisOmIndexAlreadyExistsException` and `RedisOmUnsupportedCommandException` during bootstrap.**

This intentional "swallowing" logic guarantees that your core Key-Value operations (saving and fetching by ID, TTL logic, etc.) continue to function 100% reliably even if RediSearch advanced querying features are unavailable in the target cluster. If the module were to throw these errors fatally, your entire NestJS application crash loop would prevent boot-up.
