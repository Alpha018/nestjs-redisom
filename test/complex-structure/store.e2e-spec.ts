import { TestingModule, Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Repository } from 'redis-om';
import * as dotenv from 'dotenv';

import { getRepositoryToken } from '../../src/redis-om/common/redis-om.utils';
import { StoreEntity } from './entities/store.entity';
import { RedisOmModule } from '../../src';

dotenv.config({ path: '.env.test' });

describe('StoreEntity (e2e)', () => {
  let app: INestApplication;
  let storeRepo: Repository<StoreEntity>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        RedisOmModule.forRoot({
          url: process.env.REDIS_URL,
        }),
        RedisOmModule.forFeature([StoreEntity]),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    storeRepo = moduleFixture.get<Repository<StoreEntity>>(
      getRepositoryToken(StoreEntity),
    );

    try {
      await storeRepo.dropIndex();
    } catch {
      // ignore
    }

    await storeRepo.createIndex();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('should create and search stores by location', async () => {
    const store = new StoreEntity();
    store.name = 'Downtown Store';
    store.location = { longitude: -122.4194, latitude: 37.7749 }; // San Francisco

    await storeRepo.save(store);

    await new Promise((r) => setTimeout(r, 1500));

    // Search near
    const nearby = await storeRepo
      .search()
      .where('location')
      .inRadius(
        (circle) =>
          circle.origin({ longitude: -122.4194, latitude: 37.7749 }).radius(10)
            .miles,
      )
      .return.all();

    expect(nearby.length).toBeGreaterThan(0);
    expect(nearby[0].name).toBe('Downtown Store');
  });
});
