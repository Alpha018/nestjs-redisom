import { Schema } from '../src/redis-om/decorators/schema.decorator';
import { Prop } from '../src/redis-om/decorators/prop.decorator';
import { BaseEntity } from '../src/redis-om/common/base.entity';

@Schema({ dataStructure: 'JSON' })
export class CatEntity extends BaseEntity {
  [key: string]: any;

  @Prop()
  name: string;

  @Prop()
  age: number;
}
