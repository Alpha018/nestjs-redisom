import { ModuleMetadata, Type } from '@nestjs/common';
import { RedisClientOptions } from 'redis';

/**
 * Options for configuring Redis OM Module asynchronously.
 */
export interface RedisOmModuleAsyncOptions extends Pick<
  ModuleMetadata,
  'imports'
> {
  /**
   * Factory function that returns Redis options or a promise resolving to them.
   */
  useFactory?: (
    ...args: any[]
  ) => Promise<RedisOmModuleOptions> | RedisOmModuleOptions;
  /**
   * Class to be used for creating Redis options.
   */
  useExisting?: Type<RedisOmOptionsFactory>;
  /**
   * Class that generates Redis options.
   */
  useClass?: Type<RedisOmOptionsFactory>;
  /**
   * List of provider tokens to inject into the factory function.
   */
  inject?: any[];
}

/**
 * Interface definition for a Redis OM Model.
 */
export interface RedisOmModelDefinition {
  /** Optional name for the model (inferred from entity name if omitted). */
  name?: string; // Optional, can be inferred from entity
  /** The schema definition associated with the model. */
  schema: any; // We'll refine this type later
}

/**
 * Interface for a factory class that creates Redis OM configuration options.
 */
export interface RedisOmOptionsFactory {
  createRedisOmOptions(): Promise<RedisOmModuleOptions> | RedisOmModuleOptions;
}

/**
 * Configuration options for the Redis OM Module, alias for RedisClientOptions.
 */
export type RedisOmModuleOptions = RedisClientOptions;
