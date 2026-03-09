import { TestingModule, Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Repository } from 'redis-om';

import { getRepositoryToken } from '../../src/redis-om/common/redis-om.utils';
import { isRedisStackAvailable, flushRedisWithConfig } from '../test-utils';
import { SessionEntity } from './entities/session.entity';
import { RedisOmModule, BaseEntity } from '../../src';
import { getRedisTestConfig } from '../e2e-config';

describe('SessionEntity (Multiple Indexes & TTL)', () => {
  let app: INestApplication;
  let sessionRepo: Repository<SessionEntity>;
  let redisStackAvailable = true;

  beforeAll(async () => {
    const config = getRedisTestConfig();

    redisStackAvailable = await isRedisStackAvailable(config);
    if (!redisStackAvailable) return;

    await flushRedisWithConfig(config);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        RedisOmModule.forRoot(config),
        RedisOmModule.forFeature([SessionEntity]),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    sessionRepo = moduleFixture.get<Repository<SessionEntity>>(
      getRepositoryToken(SessionEntity),
    );
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('should demonstrate search with multiple fields', async () => {
    if (!redisStackAvailable) return;
    const uniqueUserId = 'user_123_' + Date.now();
    const session = new SessionEntity();
    session.userId = uniqueUserId;
    session.deviceId = 'device_ABC';
    session.ipAddress = '192.168.1.1';
    session.isActive = true;
    session.lastActive = new Date();

    await sessionRepo.save(session);
    await new Promise((r) => setTimeout(r, 1500));

    const result = await sessionRepo
      .search()
      .where('userId')
      .eq(uniqueUserId)
      .and('isActive')
      .is.true()
      .and('deviceId')
      .eq('device_ABC')
      .return.all();

    expect(result.length).toBe(1);
    expect(result[0].userId).toBe(uniqueUserId);
  });

  it('should expire entity after TTL', async () => {
    if (!redisStackAvailable) return;
    const session = new SessionEntity();
    session.userId = 'temp_user';
    session.isActive = true;

    const saved = await sessionRepo.save(session);
    const id = BaseEntity.getId(saved);
    expect(id).toBeDefined();

    const beforeExp = await sessionRepo.fetch(id!);
    expect(beforeExp.userId).toBe('temp_user');

    await sessionRepo.expire(id!, 2);

    await new Promise((resolve) => setTimeout(resolve, 3000));

    const afterExp = await sessionRepo.fetch(id!);

    const keys = Object.keys(afterExp || {});
    if (afterExp && keys.length > 0) {
      expect(afterExp.userId).toBeUndefined();
    }
  }, 10000);
});
