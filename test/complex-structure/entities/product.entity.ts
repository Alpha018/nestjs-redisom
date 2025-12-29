import { BaseEntity, Schema, Prop } from '../../../src';

@Schema({ dataStructure: 'JSON' })
export class ProductEntity extends BaseEntity {
  [key: string]: any;

  @Prop({ type: 'number', sortable: true })
  price: number;

  @Prop({ sortable: true, type: 'date' })
  createdAt: Date;

  @Prop({ type: 'boolean' })
  available: boolean;

  @Prop({ type: 'string[]' })
  tags: string[];

  @Prop({ type: 'text' })
  title: string;
}
