import {
  OnApplicationShutdown,
  DynamicModule,
  Provider,
  Global,
  Module,
  Inject,
} from '@nestjs/common';
import {
  RedisClusterType,
  RedisClientType,
  createCluster,
  createClient,
} from 'redis';

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
  constructor(
    @Inject(getConnectionToken())
    private readonly redisClient: RedisClusterType | RedisClientType,
  ) {}

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
            const redisClient = (opt as any).rootNodes
              ? createCluster(opt as any)
              : createClient(opt as any);
            await redisClient.connect();
            return redisClient;
          },
          inject: [REDIS_OM_MODULE_OPTIONS],
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
        const redisClient = (options as any).rootNodes
          ? createCluster(options as any)
          : createClient(options as any);
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

  async onApplicationShutdown() {
    try {
      const isOpen = this.redisClient?.isOpen;
      const isReady =
        'isReady' in this.redisClient
          ? (this.redisClient as any).isReady
          : false;
      if (isOpen || isReady) {
        await this.redisClient.quit();
      }
    } catch {
      // Ignore errors during shutdown
    }
  }
}
