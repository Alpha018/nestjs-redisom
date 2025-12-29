import { BaseEntity, Schema, Prop } from '../../../src';

@Schema({ dataStructure: 'JSON' })
export class CustomerEntity extends BaseEntity {
  [key: string]: any;

  @Prop({ type: 'number', sortable: true, indexed: true })
  score: number;

  @Prop({ type: 'string[]', indexed: true })
  interests: string[];

  @Prop({ caseSensitive: true, indexed: true })
  email: string;

  @Prop({ type: 'boolean', indexed: true })
  isActive: boolean;

  @Prop({ indexed: true })
  region: string;
}
