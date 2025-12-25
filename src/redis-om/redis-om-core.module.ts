/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  DynamicModule,
  Global,
  Module,
  Provider,
  OnApplicationShutdown,
} from '@nestjs/common';
import { Client } from 'redis-om';
import { createClient } from 'redis';
import { RedisOmModuleAsyncOptions, RedisOmModuleOptions } from './interfaces';
import { getConnectionToken } from './common/redis-om.utils';

@Global()
@Module({})
export class RedisOmCoreModule implements OnApplicationShutdown {
  static forRoot(options: RedisOmModuleOptions): DynamicModule {
    const redisOmConnectionProvider: Provider = {
      provide: getConnectionToken(),
      useFactory: async () => {
        const client = new Client();
        const redisInfo = options.url ? { url: options.url } : options;
        const redisClient = createClient(redisInfo);
        await redisClient.connect();

        return await client.use(redisClient as any);
      },
    };

    return {
      module: RedisOmCoreModule,
      providers: [redisOmConnectionProvider],
      exports: [redisOmConnectionProvider],
    };
  }

  static forRootAsync(options: RedisOmModuleAsyncOptions): DynamicModule {
    const asyncProviders = this.createAsyncProviders(options);

    return {
      module: RedisOmCoreModule,
      imports: options.imports,
      providers: [
        ...asyncProviders,
        {
          provide: getConnectionToken(),
          useFactory: async (opt: RedisOmModuleOptions) => {
            const client = new Client();
            const redisInfo = opt.url ? { url: opt.url } : opt;
            const redisClient = createClient(redisInfo);
            await redisClient.connect();

            return await client.use(redisClient as any);
          },
          inject: ['REDIS_OM_MODULE_OPTIONS'], // Injected from createAsyncProviders
        },
      ],
      exports: [getConnectionToken()],
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
