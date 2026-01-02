# Redis Configuration

## Basic Connection

The simplest way to connect is using a single Redis URL.

```typescript
RedisOmModule.forRoot({
  url: 'redis://localhost:6379'
})
```

## TLS Connection (Production)

For secure connections (e.g. AWS ElastiCache, Redis Cloud), use the `rediss://` protocol and configure the `socket` options.

### Static Configuration

```typescript
RedisOmModule.forRoot({
  url: 'rediss://your-redis-instance:6380',
  socket: {
    tls: true,
    rejectUnauthorized: false, // Set to true if you are verifying the CA
    // ca: [fs.readFileSync('path/to/ca.pem')] // If using a custom CA
  }
})
```

### Async Configuration (Recommended)

Using `ConfigService` ensures your secrets aren't hardcoded.

```typescript
// app.module.ts
RedisOmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    url: config.get('REDIS_URL'),
    socket: {
      tls: config.get('REDIS_TLS') === 'true',
      rejectUnauthorized: config.get('REDIS_REJECT_UNAUTHORIZED') !== 'false',
    }
  })
})
```

> **Tip**: For advanced environment validation (e.g. using `class-validator` to ensure all these variables exist), see **[Patterns: Environment Validation](../patterns/Environment-Validation.md)**.
> **Tip**: To abstract these string keys into a type-safe service, see **[Patterns: Configuration Service](../patterns/Configuration-Service.md)**.

## Redis Cluster

> **Note**: `nestjs-redisom` currently uses the standard `createClient` method from `node-redis`, which is designed for standalone or sentinel setups. Native `createCluster` support is not yet exposed via the module options.

If you are using a Cluster-enabled provider (like AWS ElastiCache with Cluster Mode Disabled, or a proxy like Envoy), the standard connection above works fine. For full Cluster Mode Enabled support, the library requires an update to use `createCluster`.
