import { BaseEntity, Schema, Prop } from '../../../src';

export class Address {
  @Prop({ indexed: true })
  street: string;

  @Prop({ indexed: true })
  city: string;

  @Prop()
  zip: string;
}

@Schema({ dataStructure: 'JSON', name: 'Person' })
export class PersonEntity extends BaseEntity {
  [key: string]: any;

  @Prop({ type: () => Address })
  address: Address;

  @Prop({ indexed: true })
  name: string;
}
