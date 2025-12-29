import { TestingModule, Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Repository } from 'redis-om';
import * as dotenv from 'dotenv';

import { getRepositoryToken } from '../../src/redis-om/common/redis-om.utils';
import { ProductEntity } from './entities/product.entity';
import { RedisOmModule, BaseEntity } from '../../src';

dotenv.config({ path: '.env.test' });

describe('ProductEntity (e2e)', () => {
  let app: INestApplication;
  let productRepo: Repository<ProductEntity>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        RedisOmModule.forRoot({
          url: process.env.REDIS_URL,
        }),
        RedisOmModule.forFeature([ProductEntity]),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    productRepo = moduleFixture.get<Repository<ProductEntity>>(
      getRepositoryToken(ProductEntity),
    );

    try {
      await productRepo.dropIndex();
    } catch {
      // ignore
    }

    await productRepo.createIndex();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('should create and search products with complex types', async () => {
    const product = new ProductEntity();
    product.title = 'Gaming Laptop High Performance';
    product.price = 1999.99;
    product.tags = ['gaming', 'laptop', 'performance'];
    product.createdAt = new Date('2023-01-01T10:00:00Z');
    product.available = true;

    const saved = await productRepo.save(product);
    expect(saved).toBeDefined();
    expect(BaseEntity.getId(saved)).toBeDefined();

    await new Promise((r) => setTimeout(r, 1500)); // Allow some time for info to propagate

    // 2. Tag Search
    const tagResult = await productRepo
      .search()
      .where('tags')
      .contain('gaming')
      .return.all();
    expect(tagResult.length).toBeGreaterThan(0);
    expect(tagResult[0].tags).toContain('gaming');

    // 3. Number Range
    const rangeResult = await productRepo
      .search()
      .where('price')
      .gt(1000)
      .return.all();
    expect(rangeResult.length).toBeGreaterThan(0);
    expect(rangeResult[0].price).toBeGreaterThan(1000);

    // 4. Date
    const dateResult = await productRepo
      .search()
      .where('createdAt')
      .onOrAfter(new Date('2022-12-31'))
      .return.all();
    expect(dateResult.length).toBeGreaterThan(0);

    // 5. Boolean
    const boolResult = await productRepo
      .search()
      .where('available')
      .is.true()
      .return.all();
    expect(boolResult.length).toBeGreaterThan(0);
    expect(boolResult[0].available).toBe(true);
  });
});
