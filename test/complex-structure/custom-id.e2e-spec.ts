import { TestingModule, Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Repository } from 'redis-om';
import { v4 as uuidv4 } from 'uuid';

import { getRepositoryToken } from '../../src/redis-om/common/redis-om.utils';
import { isRedisStackAvailable, flushRedisWithConfig } from '../test-utils';
import { ProductEntity } from './entities/product.entity';
import { RedisOmModule, BaseEntity } from '../../src';
import { getRedisTestConfig } from '../e2e-config';

describe('Custom ID (UUID v4) (e2e)', () => {
  let app: INestApplication;
  let productRepo: Repository<ProductEntity>;
  let redisStackAvailable = true;

  beforeAll(async () => {
    const config = getRedisTestConfig();

    redisStackAvailable = await isRedisStackAvailable(config);
    if (!redisStackAvailable) return;

    await flushRedisWithConfig(config);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        RedisOmModule.forRoot(config),
        RedisOmModule.forFeature([ProductEntity]),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    productRepo = moduleFixture.get<Repository<ProductEntity>>(
      getRepositoryToken(ProductEntity),
    );
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('should save entity with custom UUID v4 key', async () => {
    if (!redisStackAvailable) return;
    const customId = uuidv4();
    const product = new ProductEntity();
    product.title = 'Custom ID Product';
    product.price = 100;
    product.available = true;
    product.tags = ['custom', 'uuid'];
    product.createdAt = new Date();

    // Save with custom ID
    const saved = await productRepo.save(customId, product);

    // Check if the returned entity has the ID
    expect(BaseEntity.getId(saved)).toBe(customId);

    // Fetch to verify
    const fetched = await productRepo.fetch(customId);
    expect(fetched).toBeDefined();
    expect(fetched.title).toBe('Custom ID Product');
    expect(BaseEntity.getId(fetched)).toBe(customId);
  });
});
