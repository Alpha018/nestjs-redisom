import { TestingModule, Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Repository } from 'redis-om';

import {
  isRedisStackAvailable,
  flushRedisWithConfig,
  setupTestIndex,
} from '../test-utils';
import { getRepositoryToken } from '../../src/redis-om/common/redis-om.utils';
import { PersonDotEntity, DotAddress } from './entities/person-dot.entity';
import { PersonEntity, Address } from './entities/person.entity';
import { RedisOmModule, BaseEntity, fieldPath } from '../../src';
import { getRedisTestConfig } from '../e2e-config';

describe('fieldPath in a real search().where() (E2E)', () => {
  let app: INestApplication;
  let personRepo: Repository<PersonEntity>;
  let personDotRepo: Repository<PersonDotEntity>;
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
        RedisOmModule.forFeature([PersonEntity, PersonDotEntity]),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    personRepo = moduleFixture.get<Repository<PersonEntity>>(
      getRepositoryToken(PersonEntity),
    );
    personDotRepo = moduleFixture.get<Repository<PersonDotEntity>>(
      getRepositoryToken(PersonDotEntity),
    );

    await setupTestIndex(personRepo);
    await setupTestIndex(personDotRepo);
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('finds a nested field via a string path against the default (underscore) separator', async () => {
    if (!redisStackAvailable) return;
    const person = new PersonEntity();
    person.name = 'Carol';

    const addr = new Address();
    addr.street = '1 Fictional Ave';
    addr.city = 'Metropolis';
    person.homeAddress = addr;

    const saved = await personRepo.save(person);
    const id = BaseEntity.getId(saved);

    await new Promise((r) => setTimeout(r, 1500));

    const results = await personRepo
      .search()
      .where(fieldPath(PersonEntity, 'homeAddress.city'))
      .eq('Metropolis')
      .return.all();

    expect(results.length).toBeGreaterThan(0);
    expect(results.some((p) => BaseEntity.getId(p) === id)).toBe(true);
  });

  it('finds a nested field via a typed selector against the default (underscore) separator', async () => {
    if (!redisStackAvailable) return;
    const results = await personRepo
      .search()
      .where(fieldPath(PersonEntity, (p) => p.homeAddress.city))
      .eq('Metropolis')
      .return.all();

    expect(results.length).toBeGreaterThan(0);
  });

  it('finds a nested field via a typed selector against a custom (dot) separator', async () => {
    if (!redisStackAvailable) return;
    const person = new PersonDotEntity();
    person.name = 'Dave';

    const addr = new DotAddress();
    addr.street = '2 Fictional Ave';
    addr.city = 'Gotham';
    person.homeAddress = addr;

    const saved = await personDotRepo.save(person);
    const id = BaseEntity.getId(saved);

    await new Promise((r) => setTimeout(r, 1500));

    const results = await personDotRepo
      .search()
      .where(fieldPath(PersonDotEntity, (p) => p.homeAddress.city))
      .eq('Gotham')
      .return.all();

    expect(results.length).toBeGreaterThan(0);
    expect(results.some((p) => BaseEntity.getId(p) === id)).toBe(true);
  });

  it('throws before hitting Redis when the path does not match a decorated @Prop', () => {
    expect(() =>
      fieldPath(PersonEntity, 'homeAddress.country' as any),
    ).toThrow(/is not a @Prop/);
  });
});
