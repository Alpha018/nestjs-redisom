import { BaseEntity, Schema, Prop } from '../../../src';

@Schema({ dataStructure: 'JSON' })
export class StoreEntity extends BaseEntity {
  [key: string]: any;

  @Prop({ type: 'point' })
  location: { longitude: number; latitude: number };

  @Prop({ textSearch: true })
  name: string;
}
