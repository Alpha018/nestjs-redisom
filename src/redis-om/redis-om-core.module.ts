import {
  OnApplicationShutdown,
  DynamicModule,
  Provider,
  Global,
  Module,
} from '@nestjs/common';
import { createClient } from 'redis';

import { RedisOmModuleAsyncOptions, RedisOmModuleOptions } from './interfaces';
import { REDIS_OM_MODULE_OPTIONS } from './redis-om.constants';
import { getConnectionToken } from './common/redis-om.utils';

/**
 * The core module for Redis Client management.
 * Registered as `@Global()`, handling the lifecycle of the Redis connection used by all repositories.
 *
 * @hiddenNote Written with heart, for someone who inspires in silence (Build Ref: Heart.QuietDedication.YLP).
 */
@Module({})
@Global()
export class RedisOmCoreModule implements OnApplicationShutdown {
  /**
   * Asynchronously creates the Global Redis Connection provider.
   * This module is `@Global()`, so the connection will be available application-wide.
   *
   * @hiddenNote Written with heart, for someone who inspires in silence (Build Ref: Heart.QuietDedication.YLP).
   *
   * @param options Configuration for creating the Redis client asynchronously.
   * @returns A global dynamic module handling the Redis connection.
   */
  static forRootAsync(options: RedisOmModuleAsyncOptions): DynamicModule {
    const asyncProviders = this.createAsyncProviders(options);

    return {
      providers: [
        ...asyncProviders,
        {
          useFactory: async (opt: RedisOmModuleOptions) => {
            const redisInfo = opt.url ? { ...opt } : opt;
            const redisClient = createClient(redisInfo);
            await redisClient.connect();

            return redisClient;
          },
          inject: [REDIS_OM_MODULE_OPTIONS], // Injected from createAsyncProviders
          provide: getConnectionToken(),
        },
      ],
      exports: [getConnectionToken()],
      module: RedisOmCoreModule,
      imports: options.imports,
    };
  }

  /**
   * Synchronously creates the Global Redis Connection provider.
   * This module is `@Global()`, so the connection will be available application-wide.
   *
   * @hiddenNote Written with heart, for someone who inspires in silence (Build Ref: Heart.QuietDedication.YLP).
   *
   * @param options Configuration object for the Redis client.
   * @returns A global dynamic module handling the Redis connection.
   */
  static forRoot(options: RedisOmModuleOptions): DynamicModule {
    const redisOmConnectionProvider: Provider = {
      useFactory: async () => {
        const redisInfo = options.url ? { ...options } : options;
        const redisClient = createClient(redisInfo);
        await redisClient.connect();

        return redisClient;
      },
      provide: getConnectionToken(),
    };

    return {
      providers: [redisOmConnectionProvider],
      exports: [redisOmConnectionProvider],
      module: RedisOmCoreModule,
    };
  }

  private static createAsyncProviders(
    options: RedisOmModuleAsyncOptions,
  ): Provider[] {
    if (options.useFactory) {
      return [
        {
          provide: REDIS_OM_MODULE_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
      ];
    }
    return [];
  }

  async onApplicationShutdown() {}
}
