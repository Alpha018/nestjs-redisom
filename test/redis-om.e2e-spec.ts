import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { RedisOmModule } from '../src/redis-om/redis-om.module';
import { Schema } from '../src/redis-om/decorators/schema.decorator';
import { Prop } from '../src/redis-om/decorators/prop.decorator';
import { InjectRepository } from '../src/redis-om/decorators/inject-repository.decorator';
import { Repository } from 'redis-om';
import { BaseEntity } from '../src/redis-om/common/base.entity';

@Schema({ dataStructure: 'JSON' })
class CatEntity extends BaseEntity {
  @Prop()
  name: string;

  @Prop()
  age: number;

  [key: string]: any;
}

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
