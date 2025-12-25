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
</div>


## Description

This library seamlessly integrates [RedisOM](https://redis.io/docs/latest/integrate/redisom-for-node-js/) into NestJS, offering:
-   **Decorator-based Schema Definition**: Define your entities using `@Schema` and `@Prop`.
-   **Repository Injection**: Inject repositories directly into your services using `@InjectRepository`.
-   **Seamless Connection**: Configure your Redis connection globally with `forRoot` or `forRootAsync`.

## Installation

```bash
$ npm install nestjs-redisom redis-om redis
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

## Features

-   **Schema Factory**: Automatically generates RedisOM schemas from your class metadata.
-   **Async Configuration**: Supports `useFactory`, `useClass`, and `useExisting` for configuration.
-   **Validation**: Compatible with `class-validator` (standard NestJS practice).

## Resources

Check out a few resources that may come in handy when working with NestJS:

-   Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
-   Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

-   Author - [Tomás Alegre](https://github.com/Alpha018)

## License

NestJS RedisOM is [MIT licensed](LICENSE).
