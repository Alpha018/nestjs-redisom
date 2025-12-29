import { TestingModule, Test } from '@nestjs/testing';
import { Module } from '@nestjs/common';
import * as dotenv from 'dotenv';

import { getConnectionToken } from './common/redis-om.utils';
import { RedisOmCoreModule } from './redis-om-core.module';
import { RedisOmModuleOptions } from './interfaces';
import { RedisOmModule } from './redis-om.module';
dotenv.config({ path: '.env.test' });

// Mock Redis client
jest.mock('redis', () => ({
  createClient: jest.fn().mockReturnValue({
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn(),
    quit: jest.fn(),
    on: jest.fn(),
  }),
}));

describe('RedisOmModule', () => {
  describe('forRoot', () => {
    it('should provide the connection client', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [RedisOmModule.forRoot({ url: process.env.REDIS_URL })],
      }).compile();

      const connection = module.get(getConnectionToken());
      expect(connection).toBeDefined();
    });
  });

  describe('forRootAsync', () => {
    it('should provide the connection client asynchronously', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          RedisOmModule.forRootAsync({
            useFactory: () => ({ url: process.env.REDIS_URL }),
          }),
        ],
      }).compile();

      const connection = module.get(getConnectionToken());
      expect(connection).toBeDefined();
    });

    it('should provide the connection client with injected config', async () => {
      @Module({
        providers: [
          {
            useValue: { url: process.env.REDIS_URL },
            provide: 'CONFIG',
          },
        ],
        exports: ['CONFIG'],
      })
      class ConfigModule {}

      const module: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule,
          RedisOmModule.forRootAsync({
            useFactory: (opts: RedisOmModuleOptions) => opts,
            imports: [ConfigModule],
            inject: ['CONFIG'],
          }),
        ],
      }).compile();

      const connection = module.get(getConnectionToken());
      expect(connection).toBeDefined();
    });
  });
});

describe('RedisOmCoreModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        RedisOmCoreModule.forRoot({
          url: process.env.REDIS_URL || 'redis://test-url',
        }),
      ],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should export connection token', () => {
    const connection = module.get(getConnectionToken());
    expect(connection).toBeDefined();
  });
});
