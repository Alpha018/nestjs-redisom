import { DynamicModule, Provider, Module } from '@nestjs/common';
import { Type } from '@nestjs/common';
import { Client } from 'redis-om';

import {
  getConnectionToken,
  getRepositoryToken,
} from './common/redis-om.utils';
import { RedisOmModuleAsyncOptions, RedisOmModuleOptions } from './interfaces';
import { RedisOmCoreModule } from './redis-om-core.module';
import { SchemaFactory } from './factories/schema.factory';

@Module({})
export class RedisOmModule {
  static forFeature(models: Type<any>[]): DynamicModule {
    const providers = models.map((model) => createRedisOmProvider(model));
    return {
      module: RedisOmModule,
      providers: providers,
      exports: providers,
    };
  }

  static forRootAsync(options: RedisOmModuleAsyncOptions): DynamicModule {
    return {
      imports: [RedisOmCoreModule.forRootAsync(options)],
      module: RedisOmModule,
    };
  }

  static forRoot(options: RedisOmModuleOptions): DynamicModule {
    return {
      imports: [RedisOmCoreModule.forRoot(options)],
      module: RedisOmModule,
    };
  }
}

function createRedisOmProvider(model: Type<any>): Provider {
  return {
    useFactory: async (client: Client) => {
      const schema = SchemaFactory.createForClass(model);
      const repository = client.fetchRepository(schema);
      await repository.createIndex(); // Ensure index exists
      return repository;
    },
    provide: getRepositoryToken(model),
    inject: [getConnectionToken()],
  };
}
