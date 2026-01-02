# NestJS RedisOM

<div align="center">
  <a href="http://nestjs.com/" target="_blank">
    <img src="https://nestjs.com/img/logo_text.svg" width="150" alt="Nest Logo" />
  </a>
</div>

<h3 align="center">A NestJS module for RedisOM, providing a structured way to use Redis Stack JSON/Search features.</h3>

<div align="center">
  <a href="https://nestjs.com" target="_blank">
    <img src="https://img.shields.io/badge/built%20with-NestJs-red.svg" alt="Built with NestJS">
  </a>
    <a href="https://github.com/Alpha018/nestjs-redisom/actions">
    <img src="https://github.com/Alpha018/nestjs-redisom/actions/workflows/build.yml/badge.svg" alt="Test Status">
  </a>
  <a href="https://github.com/Alpha018/nestjs-redisom">
    <img src="https://img.shields.io/github/stars/Alpha018/nestjs-redisom?style=social" alt="GitHub stars">
  </a>
  <a href="https://www.buymeacoffee.com/alpha018" target="_blank">
    <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="20px">
  </a>
</div>

## Description

This library seamlessly integrates [RedisOM](https://redis.io/docs/latest/integrate/redisom-for-node-js/) into NestJS, offering:

- **Decorator-based Schema Definition**: Define your entities using `@Schema` and `@Prop`.
- **Repository Injection**: Inject repositories directly into your services using `@InjectRepository`.
- **Seamless Connection**: Configure your Redis connection globally with `forRoot` or `forRootAsync`.

## Installation

```bash
npm install nestjs-redisom redis-om redis
```

## Quick Start

### 1. Define an Entity

Use the `@Schema()` decorator to define your entity and `@Prop()` for properties. Extends `BaseEntity` to easily access the auto-generated ID.

```typescript
import { Schema } from 'nestjs-redisom';
import { Prop } from 'nestjs-redisom';
import { BaseEntity } from 'nestjs-redisom';

@Schema()
export class CatEntity extends BaseEntity {
  @Prop()
  name: string;

  @Prop()
  age: number;
}
```

### 2. Import the Module

Register `RedisOmModule` in your root `AppModule` and register your entities with `forFeature`.

```typescript
import { Module } from '@nestjs/common';
import { RedisOmModule } from 'nestjs-redisom';
import { CatEntity } from './cat.entity';

@Module({
  imports: [
    RedisOmModule.forRoot({
        url: 'redis://localhost:6379'
    }),
    RedisOmModule.forFeature([CatEntity]),
  ],
})
export class AppModule {}
```

### 3. Usage in a Service

Inject the repository to save and search for entities.

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from 'nestjs-redisom';
import { Repository } from 'redis-om';
import { CatEntity } from './cat.entity';

@Injectable()
export class CatsService {
  constructor(
    @InjectRepository(CatEntity) private readonly catRepo: Repository<CatEntity>,
  ) {}

  async create(name: string, age: number) {
    const entity = new CatEntity();
    entity.name = name;
    entity.age = age;
    return await this.catRepo.save(entity);
  }

  async findAll() {
    return await this.catRepo.search().return.all();
  }
}
```

## Advanced Usage

### 1. Nested Typed Objects

You can define nested objects using classes and the `@Prop({ type: () => Class })` syntax. This allows Redis OM to automatically generate the correct schema fields for your nested data.

**How it works:**
The library flattens nested properties into the Redis schema using the format `parentProperty_childProperty` (underscore separator). This allows you to index and search deeply nested fields without complex JSON path syntax.

**Define the Embedded Class:**

```typescript
export class Address {
  @Prop({ indexed: true })
  street: string;

  @Prop({ indexed: true })
  city: string; // Will become 'address_city' in the schema
}
```

**Use in Parent Entity:**

```typescript
@Schema({ dataStructure: 'JSON' })
export class Person extends BaseEntity {
  @Prop()
  name: string;

  @Prop({ type: () => Address })
  address: Address;
}
```

**Search using flattened/nested fields:**

Since the schema uses flattened keys, you query them using the underscore syntax:

```typescript
// Search for persons where address.city is 'New York'
const results = await this.personRepo.search()
  .where('address_city' as any) // Use the flattened key
  .eq('New York')
  .return.all();
```

### 2. Custom IDs

You can explicitly set the ID when saving an entity if you don't want to use the auto-generated ULID. This is useful for using existing IDs (like UUIDs, emails, or external system IDs).

```typescript
// Using a UUID
import { v4 as uuidv4 } from 'uuid';
const id = uuidv4();
await this.catRepo.save(id, entity);

// Using a custom string
await this.catRepo.save('unique-custom-id', entity);
```

### 3. TTL (Time To Live)

You can set an expiration time (in seconds) for an entity. The key will automatically be deleted from Redis after the specified time.

```typescript
const id = 'temp-session-123';
await this.catRepo.save(id, sessionEntity);

// Expire after 60 seconds
await this.catRepo.expire(id, 60);
```

### 4. TLS Connection (Production / Cloud)

For secure connections (e.g., AWS ElastiCache, Redis Cloud), use the `rediss://` protocol and provide TLS options in the `socket` configuration.

**Static Configuration:**

```typescript
import * as fs from 'fs';

RedisOmModule.forRoot({
  url: 'rediss://your-redis-instance:6380',
  socket: {
    tls: true,
    rejectUnauthorized: false, // Set to true if using a public CA
    // ca: fs.readFileSync('path/to/ca.pem'), // Optional: Load custom CA
  },
})
```

**Async Configuration (e.g., using ConfigService):**

```typescript
RedisOmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    url: config.get('REDIS_URL'), // e.g., 'rediss://...'
    socket: {
      tls: true,
      rejectUnauthorized: config.get('REDIS_TLS_REJECT_UNAUTHORIZED') === 'true',
    },
  }),
})
```

## Features

- **Schema Factory**: Automatically generates RedisOM schemas from your class metadata.
- **Nested Objects**: Support for typed nested objects with automatic schema flattening.
- **Async Configuration**: Supports `useFactory`, `useClass`, and `useExisting` for configuration.
- **Validation**: Compatible with `class-validator` (standard NestJS practice).

## Performance & Search Mechanics

This library leverages **RediSearch** (module of Redis Stack), meaning searches are **efficient and non-blocking**.

### 1. How Search Works

When you use `@Prop({ indexed: true })`, Redis OM creates an **Inverted Index**.

- **Search**: `repo.search()...` queries this index directly. It does **NOT** perform a linear scan (SCAN command) over the keyspace.
- **Complexity**: Searches are typically **O(K)** (where K is the number of results) or **O(log N)** for range queries. Retrieving by ID is **O(1)**.

#### Search Complexity by Type

| Data Type | Operation | Complexity | Notes |
| :--- | :--- | :--- | :--- |
| **ID** | Retrieve (`fetch`) | **O(1)** | Direct key access (fastest). |
| **Tag / String** | Exact Match (`eq`) | **O(K)** | `K` = number of results returned. |
| **Numeric / Date** | Range (`gt`, `lt`, `between`) | **O(log N + K)** | Uses sorted sets/trees. efficient for ranges. |
| **Text** | Full-Text (`matches`) | **O(M + K)** | `M` = number of terms/words being searched. |
| **Geo** | Radius / Polygon | **O(K + log N)** | Geospacial indexing. |

### 2. Resource Usage

- **Memory (RAM)**: Indexes consume additional memory. **Best Practice:** Only index fields that you intend to filter by.
- **CPU**: Search operations are highly optimized. Initial indexing of a large existing dataset may temporarily consume CPU, but incremental updates (`save`) are lightweight.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Tomás Alegre](https://github.com/Alpha018)

## License

NestJS RedisOM is [MIT licensed](LICENSE).
