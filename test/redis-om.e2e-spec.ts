import { TestingModule, Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Repository } from 'redis-om';

import { InjectRepository, RedisOmModule, BaseEntity } from '../src';
import { CatEntity } from './cat.entity';

class CatsService {
  constructor(
    @InjectRepository(CatEntity)
    private readonly catRepo: Repository<CatEntity>,
  ) {}

  async create(name: string, age: number) {
    const entity = new CatEntity();
    entity.name = name;
    entity.age = age;

    return await this.catRepo.save(entity);
  }

  async findAll() {
    return this.catRepo.search().return.all();
  }
}

describe('RedisOmModule (e2e)', () => {
  let app: INestApplication;
  let catsService: CatsService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        RedisOmModule.forRoot({
          url: 'redis://localhost:6379',
        }),
        RedisOmModule.forFeature([CatEntity]),
      ],
      providers: [CatsService],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    catsService = moduleFixture.get<CatsService>(CatsService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create and retrieve a cat', async () => {
    const catName = 'Whiskers';
    const catAge = 5;

    // Create
    const createdCat = await catsService.create(catName, catAge);
    expect(createdCat).toBeDefined();
    expect(createdCat.name).toBe(catName);
    expect(createdCat.age).toBe(catAge);
    expect(BaseEntity.getId(createdCat)).toBeDefined();

    // Read
    const cats = await catsService.findAll();
    expect(cats).toBeDefined();
    expect(cats.length).toBeGreaterThan(0);
    const foundCat = cats.find(
      (c) => BaseEntity.getId(c) === BaseEntity.getId(createdCat),
    );
    expect(foundCat).toBeDefined();
    expect(foundCat?.name).toBe(catName);
  }, 30000);
});
