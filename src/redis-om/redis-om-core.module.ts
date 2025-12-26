import {
  OnApplicationShutdown,
  DynamicModule,
  Provider,
  Global,
  Module,
} from '@nestjs/common';
import { createClient } from 'redis';
import { Client } from 'redis-om';

import { RedisOmModuleAsyncOptions, RedisOmModuleOptions } from './interfaces';
import { getConnectionToken } from './common/redis-om.utils';

@Module({})
@Global()
export class RedisOmCoreModule implements OnApplicationShutdown {
  static forRootAsync(options: RedisOmModuleAsyncOptions): DynamicModule {
    const asyncProviders = this.createAsyncProviders(options);

    return {
      providers: [
        ...asyncProviders,
        {
          useFactory: async (opt: RedisOmModuleOptions) => {
            const client = new Client();
            const redisInfo = opt.url ? { url: opt.url } : opt;
            const redisClient = createClient(redisInfo);
            await redisClient.connect();

            return await client.use(redisClient as any);
          },
          inject: ['REDIS_OM_MODULE_OPTIONS'], // Injected from createAsyncProviders
          provide: getConnectionToken(),
        },
      ],
      exports: [getConnectionToken()],
      module: RedisOmCoreModule,
      imports: options.imports,
    };
  }

  static forRoot(options: RedisOmModuleOptions): DynamicModule {
    const redisOmConnectionProvider: Provider = {
      useFactory: async () => {
        const client = new Client();
        const redisInfo = options.url ? { url: options.url } : options;
        const redisClient = createClient(redisInfo);
        await redisClient.connect();

        return await client.use(redisClient as any);
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
          provide: 'REDIS_OM_MODULE_OPTIONS',
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
      ];
    }
    return [];
  }

  async onApplicationShutdown() {}
}
