import { BaseEntity, Schema, Prop } from '../src';

@Schema({ dataStructure: 'JSON' })
export class CatEntity extends BaseEntity {
  [key: string]: any;

  @Prop()
  name: string;

  @Prop()
  age: number;
}
