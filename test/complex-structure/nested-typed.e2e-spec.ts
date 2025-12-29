import { TestingModule, Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Repository } from 'redis-om';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';

import { getRepositoryToken } from '../../src/redis-om/common/redis-om.utils';
import { PersonEntity, Address } from './entities/person.entity';
import { RedisOmModule, BaseEntity } from '../../src';

dotenv.config({ path: '.env.test' });

describe('Typed Nested Objects (E2E)', () => {
  let app: INestApplication;
  let repo: Repository<PersonEntity>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        RedisOmModule.forRoot({
          url: process.env.REDIS_URL,
        }),
        RedisOmModule.forFeature([PersonEntity]),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    repo = moduleFixture.get<Repository<PersonEntity>>(
      getRepositoryToken(PersonEntity),
    );

    try {
      await repo.dropIndex();
    } catch {
      // ignore
    }
    await repo.createIndex();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('should save and search nested typed object', async () => {
    const id = uuidv4();
    const person = new PersonEntity();
    person.name = 'John Doe';
    person.address = new Address();
    person.address.street = '123 Main St';
    person.address.city = 'New York';
    person.address.zip = '10001';

    await repo.save(id, person);

    // Fetch to verify structure
    const fetched = await repo.fetch(id);
    expect(fetched.name).toBe('John Doe');
    expect(fetched.address).toBeDefined();
    // Redis OM fetches plain objects usually
    expect(fetched.address.city).toBe('New York');

    // Wait for index
    await new Promise((r) => setTimeout(r, 2000));

    // Search by Nested Field
    // The factory should have generated field 'address_city' mapped to $.address.city
    // Casting to any because 'address_city' is dynamic and not in PersonEntity types
    const results = await repo
      .search()
      .where('address_city' as any)
      .eq('New York')
      .return.all();

    expect(results.length).toBeGreaterThan(0);
    const match = results.find((r) => BaseEntity.getId(r) === id);
    expect(match).toBeDefined();
    if (match) {
      expect(match.address.city).toBe('New York');
    }
  });
});
