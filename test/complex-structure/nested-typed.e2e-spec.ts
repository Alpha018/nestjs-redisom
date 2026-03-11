import { TestingModule, Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Repository } from 'redis-om';

import {
  isRedisStackAvailable,
  flushRedisWithConfig,
  setupTestIndex,
} from '../test-utils';
import { getRepositoryToken } from '../../src/redis-om/common/redis-om.utils';
import { PersonEntity, Address } from './entities/person.entity';
import { RedisOmModule, BaseEntity } from '../../src';
import { getRedisTestConfig } from '../e2e-config';

describe('Typed Nested Objects (E2E)', () => {
  let app: INestApplication;
  let repo: Repository<PersonEntity>;
  let redisStackAvailable = true;

  beforeAll(async () => {
    // macOS TCP cooldown for local nodeAddressMap sequences
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const config = getRedisTestConfig();

    redisStackAvailable = await isRedisStackAvailable(config);

    // Cleanup Redis before app init to avoid deleting indices created during init
    await flushRedisWithConfig(config);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        RedisOmModule.forRoot(config),
        RedisOmModule.forFeature([PersonEntity]),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    repo = moduleFixture.get<Repository<PersonEntity>>(
      getRepositoryToken(PersonEntity),
    );

    await setupTestIndex(repo);
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('should save and search nested typed object', async () => {
    if (!redisStackAvailable) return;
    const person = new PersonEntity();
    person.name = 'Alice';
    person.age = 30;

    const addr = new Address();
    addr.street = '123 Main St';
    addr.city = 'Wonderland';
    person.homeAddress = addr;

    const saved = await repo.save(person);
    const id = BaseEntity.getId(saved);
    expect(id).toBeDefined();

    await new Promise((r) => setTimeout(r, 1500));

    // Search by nested field
    const results = await repo
      .search()
      .where('homeAddress_city')
      .eq('Wonderland')
      .return.all();

    expect(results.length).toBeGreaterThan(0);
    const found = results.find((p) => BaseEntity.getId(p) === id);
    expect(found).toBeDefined();
    expect(found?.homeAddress?.city).toBe('Wonderland');
  });
});
