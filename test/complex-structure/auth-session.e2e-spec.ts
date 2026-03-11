import { TestingModule, Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { faker } from '@faker-js/faker';
import { Repository } from 'redis-om';
import { v4 as uuidv4 } from 'uuid';

import { getRepositoryToken } from '../../src/redis-om/common/redis-om.utils';
import { isRedisStackAvailable, flushRedisWithConfig } from '../test-utils';
import { AuthSessionEntity } from './entities/auth-session.entity';
import { RedisOmModule, BaseEntity } from '../../src';
import { getRedisTestConfig } from '../e2e-config';

describe('AuthSessionEntity (Complex E2E)', () => {
  let app: INestApplication;
  let sessionRepo: Repository<AuthSessionEntity>;
  let redisStackAvailable = true;

  beforeAll(async () => {
    const config = getRedisTestConfig();

    redisStackAvailable = await isRedisStackAvailable(config);
    if (!redisStackAvailable) return;

    await flushRedisWithConfig(config);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        RedisOmModule.forRoot(config),
        RedisOmModule.forFeature([AuthSessionEntity]),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    sessionRepo = moduleFixture.get<Repository<AuthSessionEntity>>(
      getRepositoryToken(AuthSessionEntity),
    );
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('should save and retrieve session with UUID v4 key', async () => {
    if (!redisStackAvailable) return;
    const sessionId = uuidv4();
    const session = new AuthSessionEntity();
    session.injectorName = 'TestInjector';
    session.sessionId = sessionId;
    session.context = 'TenantA';
    session.platformContext = 'MobileApp';
    session.refreshToken = faker.string.alphanumeric(20);
    session.accessToken = faker.string.alphanumeric(50);
    session.idToken = faker.string.alphanumeric(50);
    session.externalId = 'ext|' + faker.string.uuid();
    session.createdAt = Date.now();
    session.lastUsedDate = new Date();

    const saved = await sessionRepo.save(sessionId, session);
    expect(BaseEntity.getId(saved)).toBe(sessionId);

    const fetched = await sessionRepo.fetch(sessionId);
    expect(BaseEntity.getId(fetched)).toBe(sessionId);
    expect(fetched.externalId).toBe(session.externalId);
  });

  it('should expire session after TTL', async () => {
    if (!redisStackAvailable) return;
    const sessionId = uuidv4();
    const session = new AuthSessionEntity();
    session.injectorName = 'TestInjector-TTL';
    session.context = 'TenantB';
    session.platformContext = 'Web';
    session.refreshToken = 'rt';
    session.accessToken = 'at';
    session.idToken = 'id';
    session.externalId = 'ext|ttl-test';

    await sessionRepo.save(sessionId, session);

    await sessionRepo.expire(sessionId, 2);

    await new Promise((r) => setTimeout(r, 3000));

    const check = await sessionRepo.fetch(sessionId);
    const keys = Object.keys(check || {});
    if (check && keys.length > 0) {
      expect(check.injectorName).toBeUndefined();
    }
  }, 10000);

  it('should perform complex searches on indexed fields', async () => {
    if (!redisStackAvailable) return;
    const targetExternalId = 'ext|target-user-' + Date.now();
    const prefix = `sess_test_${Date.now()}_`;

    const sessionsData = [
      { extId: targetExternalId, platform: 'MobileApp', ctx: 'TenantA' },
      { extId: targetExternalId, platform: 'Web', ctx: 'TenantA' },
      { extId: targetExternalId, platform: 'MobileApp', ctx: 'TenantB' },
      { extId: 'ext|other-user', platform: 'MobileApp', ctx: 'TenantA' },
    ];

    await Promise.all(
      sessionsData.map(async (d) => {
        const s = new AuthSessionEntity();
        s.injectorName = prefix + 'Injector';
        s.context = d.ctx;
        s.platformContext = d.platform;
        s.externalId = d.extId;
        s.refreshToken = 'rt';
        s.accessToken = 'at';
        s.idToken = 'id';
        s.createdAt = Date.now();
        await sessionRepo.save(uuidv4(), s);
      }),
    );

    try {
      await new Promise((r) => setTimeout(r, 4000));

      const result1 = await sessionRepo
        .search()
        .where('externalId')
        .eq(targetExternalId)
        .return.all();

      expect(result1.length).toBe(3);

      const result2 = await sessionRepo
        .search()
        .where('externalId')
        .eq(targetExternalId)
        .and('context')
        .eq('TenantA')
        .return.all();
      expect(result2.length).toBe(2);

      const result3 = await sessionRepo
        .search()
        .where('externalId')
        .eq(targetExternalId)
        .and('context')
        .eq('TenantA')
        .and('platformContext')
        .eq('MobileApp')
        .return.all();
      expect(result3.length).toBe(1);
    } catch (e: any) {
      if (e.message?.includes('unknown command')) {
        console.warn('Skipping search verification, RediSearch not available');
      } else {
        throw e;
      }
    }
  });

  it('should simulate updating lastUsedDate', async () => {
    if (!redisStackAvailable) return;
    const sessionId = uuidv4();
    const session = new AuthSessionEntity();
    session.injectorName = 'UpdateTest';

    session.context = 'TenantC';
    session.platformContext = 'Web';
    session.refreshToken = 'r';
    session.accessToken = 'a';
    session.idToken = 'i';
    session.lastUsedDate = new Date('2023-01-01');

    await sessionRepo.save(sessionId, session);

    const fetched = await sessionRepo.fetch(sessionId);
    const newDate = new Date();
    fetched.lastUsedDate = newDate;

    await sessionRepo.save(fetched);

    const refetched = await sessionRepo.fetch(sessionId);
    const diff = Math.abs(
      (refetched.lastUsedDate?.getTime() || 0) - newDate.getTime(),
    );
    expect(diff).toBeLessThan(1000);
  });

  it('should search by nested device info', async () => {
    if (!redisStackAvailable) return;
    const sessionId = uuidv4();
    const session = new AuthSessionEntity();
    session.injectorName = 'NestedTest';
    session.context = 'TenantA';
    session.platformContext = 'MobileApp';
    session.externalId = 'ext|nested';
    session.refreshToken = 'r';
    session.accessToken = 'a';
    session.idToken = 'i';

    session.deviceInfo = {
      model: 'iPhone 15',
      os: 'iOS',
    };

    await sessionRepo.save(sessionId, session);
    try {
      await new Promise((r) => setTimeout(r, 4000));

      const iosSessions = await sessionRepo
        .search()
        .where('deviceOs')
        .eq('iOS')
        .return.all();
      expect(iosSessions.length).toBeGreaterThanOrEqual(1);
      expect(
        iosSessions.find((s) => BaseEntity.getId(s) === sessionId),
      ).toBeDefined();

      const iphone12Sessions = await sessionRepo
        .search()
        .where('deviceModel')
        .eq('iPhone 15')
        .return.all();
      expect(
        iphone12Sessions.find((s) => BaseEntity.getId(s) === sessionId),
      ).toBeDefined();
    } catch (e: any) {
      if (e.message?.includes('unknown command')) {
        console.warn(
          'Skipping nested search verification, RediSearch not available',
        );
      } else {
        throw e;
      }
    }
  });
});
