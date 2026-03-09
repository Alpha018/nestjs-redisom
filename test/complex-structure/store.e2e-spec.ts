import { TestingModule, Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Repository } from 'redis-om';

import { getRepositoryToken } from '../../src/redis-om/common/redis-om.utils';
import { isRedisStackAvailable, flushRedisWithConfig } from '../test-utils';
import { StoreEntity } from './entities/store.entity';
import { getRedisTestConfig } from '../e2e-config';
import { RedisOmModule } from '../../src';

describe('StoreEntity (e2e)', () => {
  let app: INestApplication;
  let storeRepo: Repository<StoreEntity>;
  let redisStackAvailable = true;

  beforeAll(async () => {
    const config = getRedisTestConfig();

    redisStackAvailable = await isRedisStackAvailable(config);
    if (!redisStackAvailable) return;

    await flushRedisWithConfig(config);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        RedisOmModule.forRoot(config),
        RedisOmModule.forFeature([StoreEntity]),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    storeRepo = moduleFixture.get<Repository<StoreEntity>>(
      getRepositoryToken(StoreEntity),
    );
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('should create and search stores by location', async () => {
    if (!redisStackAvailable) return;
    const store = new StoreEntity();
    store.name = 'Main Store';
    store.location = { longitude: 40.7128, latitude: -74.006 };

    const saved = await storeRepo.save(store);
    expect(saved).toBeDefined();

    await new Promise((r) => setTimeout(r, 1500));

    const result = await storeRepo
      .search()
      .where('location')
      .inRadius(
        (circle) => circle.longitude(41).latitude(-74).radius(100).miles,
      )
      .return.all();

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].name).toBe('Main Store');
  });
});
