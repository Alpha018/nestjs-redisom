import { TestingModule, Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { faker } from '@faker-js/faker';
import { Repository } from 'redis-om';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';

import { getRepositoryToken } from '../../src/redis-om/common/redis-om.utils';
import { AuthSessionEntity } from './entities/auth-session.entity';
import { RedisOmModule, BaseEntity } from '../../src';

dotenv.config({ path: '.env.test' });

describe('AuthSessionEntity (Complex E2E)', () => {
  let app: INestApplication;
  let sessionRepo: Repository<AuthSessionEntity>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        RedisOmModule.forRoot({
          url: process.env.REDIS_URL,
        }),
        RedisOmModule.forFeature([AuthSessionEntity]),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    sessionRepo = moduleFixture.get<Repository<AuthSessionEntity>>(
      getRepositoryToken(AuthSessionEntity),
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

  it('should save and retrieve session with UUID v4 key', async () => {
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

    // 2s TTL
    await sessionRepo.expire(sessionId, 2);

    await new Promise((r) => setTimeout(r, 3000));

    const check = await sessionRepo.fetch(sessionId);
    // Verify expiration
    const keys = Object.keys(check || {});
    if (check && keys.length > 0) {
      expect(check.injectorName).toBeUndefined();
    }
  }, 10000);

  it('should perform complex searches on indexed fields', async () => {
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

    await new Promise((r) => setTimeout(r, 4000)); // Wait for indexing

    // Search by External ID
    let results = await sessionRepo
      .search()
      .where('externalId')
      .eq(targetExternalId)
      .return.all();

    expect(results.length).toBe(3);

    // Search by External ID AND Context TenantA
    results = await sessionRepo
      .search()
      .where('externalId')
      .eq(targetExternalId)
      .and('context')
      .eq('TenantA')
      .return.all();
    expect(results.length).toBe(2);

    // Search by External ID AND Context TenantA AND PlatformContext MobileApp
    results = await sessionRepo
      .search()
      .where('externalId')
      .eq(targetExternalId)
      .and('context')
      .eq('TenantA')
      .and('platformContext')
      .eq('MobileApp')
      .return.all();
    expect(results.length).toBe(1);
  });

  it('should simulate updating lastUsedDate', async () => {
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

    // Update lastUsedDate
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
    const sessionId = uuidv4();
    const session = new AuthSessionEntity();
    session.injectorName = 'NestedTest';
    session.context = 'TenantA';
    session.platformContext = 'MobileApp';
    session.externalId = 'ext|nested';
    session.refreshToken = 'r';
    session.accessToken = 'a';
    session.idToken = 'i';

    // Populate nested fields
    session.deviceInfo = {
      model: 'iPhone 15',
      os: 'iOS',
    };

    await sessionRepo.save(sessionId, session);
    await new Promise((r) => setTimeout(r, 4000)); // Index propagation

    // Search by nested OS
    const resultsOs = await sessionRepo
      .search()
      .where('deviceOs')
      .eq('iOS')
      .return.all();
    expect(resultsOs.length).toBeGreaterThanOrEqual(1);
    expect(
      resultsOs.find((s) => BaseEntity.getId(s) === sessionId),
    ).toBeDefined();

    // Search by nested Model
    const resultsModel = await sessionRepo
      .search()
      .where('deviceModel')
      .eq('iPhone 15')
      .return.all();
    expect(
      resultsModel.find((s) => BaseEntity.getId(s) === sessionId),
    ).toBeDefined();
  });
});
