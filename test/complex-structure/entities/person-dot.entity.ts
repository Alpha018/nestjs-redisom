import { BaseEntity, Schema, Prop } from '../../../src';

export class DotAddress {
  @Prop({ indexed: true })
  street: string;

  @Prop({ indexed: true })
  city: string;

  @Prop()
  zip: string;
}

@Schema({ dataStructure: 'JSON', nestedSeparator: '.', name: 'PersonDot' })
export class PersonDotEntity extends BaseEntity {
  [key: string]: any;

  @Prop({ type: () => DotAddress })
  homeAddress: DotAddress;

  @Prop({ indexed: true })
  name: string;
}
