import { DynamicModule, Module, Provider } from '@nestjs/common';
import { RedisOmCoreModule } from './redis-om-core.module';
import { RedisOmModuleAsyncOptions, RedisOmModuleOptions } from './interfaces';
import { Type } from '@nestjs/common';
import { SchemaFactory } from './factories/schema.factory';
import { Client } from 'redis-om';
import {
  getConnectionToken,
  getRepositoryToken,
} from './common/redis-om.utils';

@Module({})
export class RedisOmModule {
  static forRoot(options: RedisOmModuleOptions): DynamicModule {
    return {
      module: RedisOmModule,
      imports: [RedisOmCoreModule.forRoot(options)],
    };
  }

  static forRootAsync(options: RedisOmModuleAsyncOptions): DynamicModule {
    return {
      module: RedisOmModule,
      imports: [RedisOmCoreModule.forRootAsync(options)],
    };
  }

  static forFeature(models: Type<any>[]): DynamicModule {
    const providers = models.map((model) => createRedisOmProvider(model));
    return {
      module: RedisOmModule,
      providers: providers,
      exports: providers,
    };
  }
}

function createRedisOmProvider(model: Type<any>): Provider {
  return {
    provide: getRepositoryToken(model),
    useFactory: async (client: Client) => {
      const schema = SchemaFactory.createForClass(model);
      const repository = client.fetchRepository(schema);
      await repository.createIndex(); // Ensure index exists
      return repository;
    },
    inject: [getConnectionToken()],
  };
}
