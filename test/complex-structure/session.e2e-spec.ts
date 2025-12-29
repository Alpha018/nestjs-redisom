import { TestingModule, Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Repository } from 'redis-om';
import * as dotenv from 'dotenv';

import { getRepositoryToken } from '../../src/redis-om/common/redis-om.utils';
import { SessionEntity } from './entities/session.entity';
import { RedisOmModule, BaseEntity } from '../../src';

dotenv.config({ path: '.env.test' });

describe('SessionEntity (Multiple Indexes & TTL)', () => {
  let app: INestApplication;
  let sessionRepo: Repository<SessionEntity>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        RedisOmModule.forRoot({
          url: process.env.REDIS_URL,
        }),
        RedisOmModule.forFeature([SessionEntity]),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    sessionRepo = moduleFixture.get<Repository<SessionEntity>>(
      getRepositoryToken(SessionEntity),
    );

    try {
      await sessionRepo.dropIndex();
    } catch {
      // ignore
    }

    await sessionRepo.createIndex();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('should demonstrate search with multiple fields', async () => {
    // Cleanup or use unique ID
    const uniqueUserId = 'user_123_' + Date.now();
    const session = new SessionEntity();
    session.userId = uniqueUserId;
    session.deviceId = 'device_ABC';
    session.ipAddress = '192.168.1.1';
    session.isActive = true;
    session.lastActive = new Date();

    await sessionRepo.save(session);
    await new Promise((r) => setTimeout(r, 1500));

    // Search using AND condition on multiple fields
    const results = await sessionRepo
      .search()
      .where('userId')
      .eq(uniqueUserId)
      .and('isActive')
      .is.true()
      .and('deviceId')
      .eq('device_ABC')
      .return.all();

    expect(results.length).toBe(1);
    expect(results[0].userId).toBe(uniqueUserId);
  });

  it('should expire entity after TTL', async () => {
    const session = new SessionEntity();
    session.userId = 'temp_user';
    session.isActive = true;

    const saved = await sessionRepo.save(session);
    const id = BaseEntity.getId(saved);
    expect(id).toBeDefined();

    // Verify it exists
    let found = await sessionRepo.fetch(id!);
    expect(found.userId).toBe('temp_user');

    // Set TTL to 2 seconds
    await sessionRepo.expire(id!, 2);

    // Wait for 3 seconds
    await new Promise((r) => setTimeout(r, 3000));

    // Verify it is gone
    found = await sessionRepo.fetch(id!);

    // Check for absence of data (null or empty object)
    const keys = Object.keys(found || {});
    if (found && keys.length > 0) {
      expect(found.userId).toBeUndefined();
    }
  }, 10000);
});
