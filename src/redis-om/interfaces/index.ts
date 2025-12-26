import { ModuleMetadata, Type } from '@nestjs/common';
import { RedisClientOptions } from 'redis';

export interface RedisOmModuleAsyncOptions extends Pick<
  ModuleMetadata,
  'imports'
> {
  useFactory?: (
    ...args: any[]
  ) => Promise<RedisOmModuleOptions> | RedisOmModuleOptions;
  useExisting?: Type<RedisOmOptionsFactory>;
  useClass?: Type<RedisOmOptionsFactory>;
  inject?: any[];
}

export interface RedisOmModelDefinition {
  name?: string; // Optional, can be inferred from entity
  schema: any; // We'll refine this type later
}

export interface RedisOmOptionsFactory {
  createRedisOmOptions(): Promise<RedisOmModuleOptions> | RedisOmModuleOptions;
}

export type RedisOmModuleOptions = RedisClientOptions;
