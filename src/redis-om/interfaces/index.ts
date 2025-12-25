import { ModuleMetadata, Type } from '@nestjs/common';
import { RedisClientOptions } from 'redis';

export type RedisOmModuleOptions = RedisClientOptions;

export interface RedisOmModuleAsyncOptions extends Pick<
  ModuleMetadata,
  'imports'
> {
  useExisting?: Type<RedisOmOptionsFactory>;
  useClass?: Type<RedisOmOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<RedisOmModuleOptions> | RedisOmModuleOptions;
  inject?: any[];
}

export interface RedisOmOptionsFactory {
  createRedisOmOptions(): Promise<RedisOmModuleOptions> | RedisOmModuleOptions;
}

export interface RedisOmModelDefinition {
  name?: string; // Optional, can be inferred from entity
  schema: any; // We'll refine this type later
}
