import { DynamicModule, Provider, Module, Type } from '@nestjs/common';
import { RedisClusterType, RedisClientType } from 'redis';

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

import { RedisConnection, Repository } from 'redis-om';

import {
  RedisOmIndexCreationFailedException,
  RedisOmIndexAlreadyExistsException,
  RedisOmUnsupportedCommandException,
  RedisOmException,
} from './errors';

/**
 * Exception classes that represent known, ignorable conditions during index creation.
 * Add new entries here to extend coverage without changing the classification logic.
 */
const IGNORABLE_INDEX_ERRORS = [
  RedisOmIndexAlreadyExistsException,
  RedisOmUnsupportedCommandException,
] as const;

function createRedisOmProvider(model: Type<any>): Provider {
  return {
    useFactory: async (client: RedisClusterType | RedisClientType) => {
      const schema = SchemaFactory.createForClass(model);
      const repository = new Repository(
        schema,
        client as unknown as RedisConnection,
      );

      try {
        await repository.createIndex();
      } catch (error: unknown) {
        const known = classifyIndexError(error);
        if (known === null) {
          // Unknown error — wrap and rethrow with the original as cause
          throw new RedisOmIndexCreationFailedException(error);
        }
        // Known ignorable conditions (IndexAlreadyExists / UnsupportedCommand)
        // We swallow these quietly. If the RediSearch module is missing,
        // basic KV operations will still work; if the index exists, we're good to go.
      }

      return repository;
    },
    provide: getRepositoryToken(model),
    inject: [getConnectionToken()],
  };
}

/**
 * Identifies whether the raw error thrown by `repository.createIndex()` is a
 * known ignorable condition. Returns an instance of the matched exception type
 * (with the original as `cause`), or `null` if the error must be re-thrown.
 */
function classifyIndexError(error: unknown): RedisOmException | null {
  const msg = error instanceof Error ? error.message : String(error);
  const Match = IGNORABLE_INDEX_ERRORS.find((E) => E.matches(msg));
  return Match ? new Match(error) : null;
}
