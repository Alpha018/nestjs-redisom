import { TestingModule, Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Repository } from 'redis-om';

import {
  isRedisStackAvailable,
  flushRedisWithConfig,
  setupTestIndex,
} from '../test-utils';
import { getRepositoryToken } from '../../src/redis-om/common/redis-om.utils';
import { SchemaFactory } from '../../src/redis-om/factories/schema.factory';
import { PersonDotEntity, DotAddress } from './entities/person-dot.entity';
import { RedisOmModule, BaseEntity } from '../../src';
import { getRedisTestConfig } from '../e2e-config';

describe('Custom Nested Separator (E2E)', () => {
  let app: INestApplication;
  let repo: Repository<PersonDotEntity>;
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
        RedisOmModule.forFeature([PersonDotEntity]),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    repo = moduleFixture.get<Repository<PersonDotEntity>>(
      getRepositoryToken(PersonDotEntity),
    );

    await setupTestIndex(repo);
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('should flatten nested field names using the configured separator', () => {
    const schema = SchemaFactory.createForClass(PersonDotEntity);

    expect(schema.fieldByName('homeAddress.city')).not.toBeNull();
    expect(schema.fieldByName('homeAddress_city')).toBeNull();
  });

  it('should save and search a nested field using a dot-separated key', async () => {
    if (!redisStackAvailable) return;
    const person = new PersonDotEntity();
    person.name = 'Bob';

    const addr = new DotAddress();
    addr.street = '456 Side St';
    addr.city = 'Neverland';
    person.homeAddress = addr;

    const saved = await repo.save(person);
    const id = BaseEntity.getId(saved);
    expect(id).toBeDefined();

    await new Promise((r) => setTimeout(r, 1500));

    const results = await repo
      .search()
      .where('homeAddress.city')
      .eq('Neverland')
      .return.all();

    expect(results.length).toBeGreaterThan(0);
    const found = results.find((p) => BaseEntity.getId(p) === id);
    expect(found).toBeDefined();
    expect(found?.homeAddress?.city).toBe('Neverland');
  });
});
