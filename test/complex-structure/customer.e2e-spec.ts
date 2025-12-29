import { TestingModule, Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Repository } from 'redis-om';
import * as dotenv from 'dotenv';

import { getRepositoryToken } from '../../src/redis-om/common/redis-om.utils';
import { CustomerEntity } from './entities/customer.entity';
import { RedisOmModule } from '../../src';

dotenv.config({ path: '.env.test' });

describe('CustomerEntity (Explicit Indexed & Multi-Search)', () => {
  let app: INestApplication;
  let customerRepo: Repository<CustomerEntity>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        RedisOmModule.forRoot({
          url: process.env.REDIS_URL,
        }),
        RedisOmModule.forFeature([CustomerEntity]),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    customerRepo = moduleFixture.get<Repository<CustomerEntity>>(
      getRepositoryToken(CustomerEntity),
    );

    try {
      await customerRepo.dropIndex();
    } catch {
      // ignore
    }

    await customerRepo.createIndex();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('should handle case sensitive search on email', async () => {
    const customer = new CustomerEntity();
    customer.email = 'John.Doe@Example.com';
    customer.region = 'US';
    customer.score = 100;
    customer.isActive = true;
    customer.interests = ['tech', 'news'];

    await customerRepo.save(customer);
    await new Promise((r) => setTimeout(r, 1500));

    // Exact match should work
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
    // Case sensitive check: should be 0 because caseSensitive is true
    expect(resultLower.length).toBe(0);
  });

  it('should perform multiple composite searches', async () => {
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

    // Query 1: Region EU AND isActive true
    const allEuActive = await customerRepo
      .search()
      .where('region')
      .eq('EU')
      .and('isActive')
      .is.true()
      .return.all();
    const euActive = allEuActive.filter((c) => c.email.startsWith(prefix));

    expect(euActive.length).toBe(2);
    const emails = euActive.map((c) => c.email);
    expect(emails).toContain(prefix + 'user1@test.com');
    expect(emails).toContain(prefix + 'user2@test.com');

    // Query 2: Region EU AND Score > 60
    const allEuHighScore = await customerRepo
      .search()
      .where('region')
      .eq('EU')
      .and('score')
      .gt(60)
      .return.all();
    const euHighScore = allEuHighScore.filter((c) =>
      c.email.startsWith(prefix),
    );

    expect(euHighScore.length).toBe(1);
    expect(euHighScore[0].email).toBe(prefix + 'user2@test.com');

    // Query 3: Interests contain 'music' AND region 'US'
    const allUsMusic = await customerRepo
      .search()
      .where('interests')
      .contain('music')
      .and('region')
      .eq('US')
      .return.all();
    const usMusic = allUsMusic.filter((c) => c.email.startsWith(prefix));

    expect(usMusic.length).toBe(1);
    expect(usMusic[0].email).toBe(prefix + 'user3@test.com');
  });
});
