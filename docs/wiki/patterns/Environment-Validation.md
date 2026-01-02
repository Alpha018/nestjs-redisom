# Environment Validation Pattern

Robust applications require fail-safe configuration. We recommend enforcing type safety and constraints on your environment variables before the application even starts.

> **Note**: This pattern allows you to leverage features like `enableImplicitConversion`, automatically transforming generic strings from `.env` into typed primitives (booleans, numbers) for your app to consume.

## Why Validate?

Standard `process.env` access is risky. It returns `string | undefined` for everything, leading to fragile code that must constantly check if values exist or manually parse them. By validating at startup, you treat configuration as a trusted contract.

## Key Benefits

1. **Fail Fast**:
    * The application **refuses to start** if required variables are missing.
    * *Result*: You catch config errors immediately during deployment, not when a user hits a specific endpoint 3 days later.

2. **Type Safety & Implicit Conversion**:
    * Variables are automatically converted to their real types (`"true"` -> `true`, `"3000"` -> `3000`).
    * Your code consumes `boolean` or `number`, not strings that need casting (`val === 'true'`).

3. **Complex Logic & Dependencies**:
    * Enforce rules like "If `USE_EXTERNAL_CACHE` is true, then `REDIS_PORT` is mandatory".
    * Validates Enums (e.g., `NODE_ENV` must be `development`, `production`, or `test`).

## Implementation Pattern

### 1. Define the Schema (`app.env.ts`)

Create a class that describes your configuration. Use decorators to enforce types and constraints.

```typescript
import { IsBoolean, IsNotEmpty, IsString, IsOptional, ValidateIf, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class AppEnv {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  // transform is handled by enableImplicitConversion
  @IsOptional()
  @IsBoolean()
  ENABLE_logging: boolean;

  @IsNotEmpty()
  @IsString()
  REDIS_URL: string;

  // Example: Conditional Validation
  // Only require REDIS_PORT if USE_EXTERNAL_CACHE is true
  @IsOptional()
  @IsBoolean()
  USE_EXTERNAL_CACHE: boolean;

  @ValidateIf((o) => o.USE_EXTERNAL_CACHE)
  @IsNotEmpty()
  REDIS_PORT: string;
}
```

### 2. The Validation Factory (`app.validate.ts`)

This function transforms the plain `process.env` object into a class instance and validates it.

```typescript
import { plainToClass } from 'class-transformer';
import { validateSync, ValidationError } from 'class-validator';
import { AppEnv } from './app.env';

// Helper to format validation errors
export function validationErrorsToString(errors: ValidationError[]): string {
  return errors
    .reduce(
      (result: string[], error: ValidationError) => [
        ...result,
        Object.values(error.constraints || {}),
      ],
      [],
    )
    .join(', ');
}

// Custom Exception (Optional: Extend standard Error or NestJS HttpException)
export class ArgumentInvalidException extends Error {
  readonly statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = 'ArgumentInvalidException';
  }
}

export function validate(config: Record<string, unknown>) {
  // 1. Convert plain object to Class instance (enabling @Transform)
  const validatedConfig = plainToClass(AppEnv, config, {
    enableImplicitConversion: true,
  });

  // 2. Run synchronous validation
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  // 3. Fail fast with formatted error if validation fails
  if (errors.length > 0) {
    throw new ArgumentInvalidException(validationErrorsToString(errors));
  }

  return validatedConfig;
}
```

### 3. Registration (`app.module.ts`)

Plug the validation function into the `ConfigModule`.

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({
      validate,
      isGlobal: true, // Available everywhere
    }),
  ],
})
export class AppModule {}
```

---

## Unit Testing Your Configuration

It is critical to test your validation logic to ensure your constraints work as expected.

```typescript
// app.validate.spec.ts
import { validate } from './app.validate';
import { AppEnv } from './app.env';

describe('Environment Validation', () => {
  it('should pass with valid config', () => {
    const config = {
      REDIS_URL: 'redis://localhost:6379',
      USE_EXTERNAL_CACHE: 'false'
    };
    const result = validate(config);
    expect(result).toBeInstanceOf(AppEnv);
    expect(result.REDIS_URL).toBe('redis://localhost:6379');
  });

  it('should transform booleans correctly', () => {
    const config = {
      REDIS_URL: '...',
      ENABLE_LOGGING: 'true' // String
    };
    const result = validate(config);
    expect(result.ENABLE_LOGGING).toBe(true); // Boolean
  });

  it('should throw error on missing required fields', () => {
    const config = {
      // Missing REDIS_URL
    };
    expect(() => validate(config)).toThrow();
  });

  it('should validate conditional fields', () => {
    const config = {
      REDIS_URL: '...',
      USE_EXTERNAL_CACHE: 'true',
      // Missing REDIS_PORT, which is required when USE_EXTERNAL_CACHE is true
    };
    expect(() => validate(config)).toThrow();
  });
});
```

By adding these tests, you guarantee that your application will only boot effectively in a correctly configured environment.
