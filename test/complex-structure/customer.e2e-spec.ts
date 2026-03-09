import { TestingModule, Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Repository } from 'redis-om';

import { getRepositoryToken } from '../../src/redis-om/common/redis-om.utils';
import { isRedisStackAvailable, flushRedisWithConfig } from '../test-utils';
import { CustomerEntity } from './entities/customer.entity';
import { getRedisTestConfig } from '../e2e-config';
import { RedisOmModule } from '../../src';

describe('CustomerEntity (Explicit Indexed & Multi-Search)', () => {
  let app: INestApplication;
  let customerRepo: Repository<CustomerEntity>;
  let redisStackAvailable = true;

  beforeAll(async () => {
    const config = getRedisTestConfig();

    redisStackAvailable = await isRedisStackAvailable(config);
    if (!redisStackAvailable) return;

    await flushRedisWithConfig(config);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        RedisOmModule.forRoot(config),
        RedisOmModule.forFeature([CustomerEntity]),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    customerRepo = moduleFixture.get<Repository<CustomerEntity>>(
      getRepositoryToken(CustomerEntity),
    );
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('should handle case sensitive search on email', async () => {
    if (!redisStackAvailable) return;
    const customer = new CustomerEntity();
    customer.email = 'John.Doe@Example.com';
    customer.region = 'US';
    customer.score = 100;
    customer.isActive = true;
    customer.interests = ['tech', 'news'];

    await customerRepo.save(customer);
    await new Promise((r) => setTimeout(r, 1500));

    const resultExact = await customerRepo
      .search()
      .where('email')
      .eq('John.Doe@Example.com')
      .return.all();
    expect(resultExact.length).toBeGreaterThan(0);

    const resultLower = await customerRepo
      .search()
      .where('email')
      .eq('john.doe@example.com')
      .return.all();
    expect(resultLower.length).toBe(0);
  });

  it('should perform multiple composite searches', async () => {
    if (!redisStackAvailable) return;
    const prefix = `test_${Date.now()}_`;
    const c1 = new CustomerEntity();
    c1.email = prefix + 'user1@test.com';
    c1.region = 'EU';
    c1.score = 50;
    c1.interests = ['music'];
    c1.isActive = true;

    const c2 = new CustomerEntity();
    c2.email = prefix + 'user2@test.com';
    c2.region = 'EU';
    c2.score = 80;
    c2.interests = ['music', 'sports'];
    c2.isActive = true;

    const c3 = new CustomerEntity();
    c3.email = prefix + 'user3@test.com';
    c3.region = 'US';
    c3.score = 90;
    c3.interests = ['music'];
    c3.isActive = false;

    await Promise.all([
      customerRepo.save(c1),
      customerRepo.save(c2),
      customerRepo.save(c3),
    ]);

    await new Promise((r) => setTimeout(r, 1500));

    const result1 = await customerRepo
      .search()
      .where('region')
      .eq('EU')
      .and('isActive')
      .is.true()
      .return.all();
    const euActive = result1.filter((c) => c.email.startsWith(prefix));

    expect(euActive.length).toBe(2);
    const emails = euActive.map((c) => c.email);
    expect(emails).toContain(prefix + 'user1@test.com');
    expect(emails).toContain(prefix + 'user2@test.com');

    const result2 = await customerRepo
      .search()
      .where('region')
      .eq('EU')
      .and('score')
      .gt(60)
      .return.all();
    const euHighScore = result2.filter((c) => c.email.startsWith(prefix));

    expect(euHighScore.length).toBe(1);
    expect(euHighScore[0].email).toBe(prefix + 'user2@test.com');

    const result3 = await customerRepo
      .search()
      .where('interests')
      .contain('music')
      .and('region')
      .eq('US')
      .return.all();
    const usMusic = result3.filter((c) => c.email.startsWith(prefix));

    expect(usMusic.length).toBe(1);
    expect(usMusic[0].email).toBe(prefix + 'user3@test.com');
  });
});
