# Abstracting Configuration Service

For scalable and maintainable NestJS applications, we strongly recommend abstracting the standard `ConfigService` behind a custom, type-safe provider.

> **Prerequisite**: This pattern works best when paired with rigorous **[Environment Validation](./Environment-Validation.md)**. Validation ensures the raw data exists; this service ensures it is consumed correctly.

## Why Abstract Configuration?

Relying on "magic strings" (like `config.get('SOME_KEY')`) scattered throughout your services creates hidden dependencies and makes refactoring difficult. By wrapping configuration access in a service, you treat configuration as a first-class citizen in your domain.

## Key Benefits

1. **Type Safety & Transformation**:
    * Return distinct types (`number`, `boolean`, `Url`) instead of just strings.
    * *Example*: `PORT` is automatically parsed to a number, preventing "Listen on port '3000'" string errors.

2. **Centralized Management**:
    * Environment variable keys (`REDIS_URL`, `SERVICE_URL`) are defined in **one place**.
    * If a key changes in the `.env` file, you only update this service, not every file in your codebase.

3. **Computed Properties**:
    * You can derive values dynamically.
    * *Example*: Constructing a full `baseUrl` from separate `HOST` and `PORT` variables, or building a connection string.

4. **Decoupling & Testing**:
    * Your business logic depends on an explicit API (`appConfig.port`), not on the implementation details of `ConfigService`.
    * Mocking a class with defined getters is often cleaner in unit tests than mocking a generic `get()` method with specific string arguments.

## Implementation Pattern

### 1. Create the Service

```typescript
// src/app/config/app-config.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private config: ConfigService) {}

  /**
   * Safe primitive getter.
   * Note: The '+' cast is NOT needed if you use the Validation Pattern,
   * because class-transformer already converted 'PORT' to a number.
   */
  get port(): number {
    return this.config.get<number>('PORT'); 
  }

  get isProduction(): boolean {
    return this.config.get<string>('NODE_ENV') === 'production';
  }

  /**
   * Grouped configuration prevents 'parameter explosion'.
   */
  get redisConfig() {
    return {
      url: this.config.get<string>('REDIS_URL'),
      // If validation (via implicit conversion) handled this, it's already a number
      connectTimeout: this.config.get<number>('REDIS_TIMEOUT') || 10000,
      tls: this.isProduction, 
    };
  }
  /**
   * Example: Parsing complex secrets (like JSON stored in a variable)
   */
  get authConfig() {
     const raw = this.config.get<string>('AUTH_CLIENT_SECRETS_JSON');
     return raw ? JSON.parse(raw) : {};
  }
}
```

### Synergy with Environment Validation

If you implemented the **[Environment Validation](./Environment-Validation.md)** pattern (specifically with `enableImplicitConversion: true`):

1. **Implicit Conversion**: The validation step automatically converts strings `"true"` -> boolean `true` and `"3000"` -> number `3000`.
2. **ConfigService stores results**: The transformed object replaces the raw strings.
3. **AppConfigService consumes types**: You can trust `this.config.get<number>('PORT')` to actually return a number.

Without validation (or without implicit conversion), `ConfigService` returns strings, and you **must** manually cast values (e.g., `+this.config.get(...)`).

### 2. Register and Export

Make sure to export this service from a Global module (or a specific Core module) so it can be injected effortlessly across your application.

```typescript
@Global()
@Module({
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
```

### 3. Usage in Services

Inject `AppConfigService` directly. Note how clean the usage becomes compared to `ConfigService`.

```typescript
@Injectable()
export class UserService {
  constructor(private appConfig: AppConfigService) {}

  async onModuleInit() {
    // Clean, readable, and type-checked
    if (this.appConfig.isProduction) {
       console.log(`Connecting to secure Redis at ${this.appConfig.redisConfig.url}`);
    }
  }
}
```
