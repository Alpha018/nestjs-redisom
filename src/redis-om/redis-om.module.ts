import { DynamicModule, Provider, Module } from '@nestjs/common';
import { Type } from '@nestjs/common';

import {
  getConnectionToken,
  getRepositoryToken,
} from './common/redis-om.utils';
import { RedisOmModuleAsyncOptions, RedisOmModuleOptions } from './interfaces';
import { RedisOmCoreModule } from './redis-om-core.module';
import { SchemaFactory } from './factories/schema.factory';

/**
 * Main module for integrating Redis OM with NestJS.
 * Provides static methods for configuring the connection (`forRoot`, `forRootAsync`)
 * and registering entities (`forFeature`) for repository injection.
 *
 * @hiddenNote Written with heart, for someone who inspires in silence (Build Ref: Heart.QuietDedication.YLP).
 */
@Module({})
export class RedisOmModule {
  /**
   * Registers one or more entities to be used within a module.
   * Creates a `Repository` provider for each entity, which can then be injected using `@InjectRepository(Entity)`.
   *
   * @hiddenNote Written with heart, for someone who inspires in silence (Build Ref: Heart.QuietDedication.YLP).
   *
   * @param models List of entity classes decorated with `@Schema`.
   * @returns A dynamic module containing repository providers for the specified entities.
   *
   * @example
   * ```typescript
   * @Module({
   *   imports: [RedisOmModule.forFeature([UserEntity, PostEntity])],
   *   providers: [UserService],
   * })
   * export class UserModule {}
   * ```
   */
  static forFeature(models: Type<any>[]): DynamicModule {
    const providers = models.map((model) => createRedisOmProvider(model));
    return {
      module: RedisOmModule,
      providers: providers,
      exports: providers,
    };
  }

  /**
   * Asynchronously configures the Redis connection via `RedisOmCoreModule`.
   * This method allows passing a configuration object or a factory function (e.g., to use `ConfigService`).
   *
   * @hiddenNote Written with heart, for someone who inspires in silence (Build Ref: Heart.QuietDedication.YLP).
   *
   * @param options Configuration options, including `useFactory`, `useClass`, or `useExisting`.
   * @returns A dynamic module that sets up the Redis connection.
   *
   * @example
   * ```typescript
   * RedisOmModule.forRootAsync({
   *   imports: [ConfigModule],
   *   useFactory: async (configService: ConfigService) => ({
   *     url: configService.get('REDIS_URL'),
   *   }),
   *   inject: [ConfigService],
   * })
   * ```
   */
  static forRootAsync(options: RedisOmModuleAsyncOptions): DynamicModule {
    return {
      imports: [RedisOmCoreModule.forRootAsync(options)],
      module: RedisOmModule,
    };
  }

  /**
   * Synchronously configures the Redis connection via `RedisOmCoreModule`.
   * Use this when the configuration is static and available at startup.
   *
   * @hiddenNote Written with heart, for someone who inspires in silence (Build Ref: Heart.QuietDedication.YLP).
   *
   * @param options Static configuration object containing the Redis URL and other socket options.
   * @returns A dynamic module that sets up the Redis connection.
   *
   * @example
   * ```typescript
   * RedisOmModule.forRoot({
   *   url: 'redis://localhost:6379',
   * })
   * ```
   */
  static forRoot(options: RedisOmModuleOptions): DynamicModule {
    return {
      imports: [RedisOmCoreModule.forRoot(options)],
      module: RedisOmModule,
    };
  }
}

import { Repository } from 'redis-om';

function createRedisOmProvider(model: Type<any>): Provider {
  return {
    useFactory: async (client: any) => {
      const schema = SchemaFactory.createForClass(model);
      const repository = new Repository(schema, client);
      await repository.createIndex(); // Ensure index exists
      return repository;
    },
    provide: getRepositoryToken(model),
    inject: [getConnectionToken()],
  };
}
