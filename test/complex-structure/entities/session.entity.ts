import { BaseEntity, Schema, Prop } from '../../../src';

@Schema({ dataStructure: 'JSON' })
export class SessionEntity extends BaseEntity {
  [key: string]: any;

  @Prop({ sortable: true, type: 'date' })
  lastActive: Date;

  @Prop({ type: 'boolean' })
  isActive: boolean;

  @Prop()
  ipAddress: string;

  @Prop()
  deviceId: string;

  @Prop()
  userId: string;
}
