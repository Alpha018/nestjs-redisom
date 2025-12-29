import { BaseEntity, Schema, Prop } from '../../../src';

@Schema({ dataStructure: 'JSON', name: 'AuthSession' })
export class AuthSessionEntity extends BaseEntity {
  [key: string]: any;

  @Prop({ path: '$.deviceInfo.model', indexed: true })
  deviceModel?: string;

  // Mapped nested fields
  @Prop({ path: '$.deviceInfo.os', indexed: true })
  deviceOs?: string;

  @Prop({ separator: ',', indexed: true })
  externalId?: string;

  // Use Date for range queries
  @Prop({ sortable: true, type: 'date' })
  lastUsedDate?: Date;

  @Prop({ indexed: true })
  platformContext: string;

  @Prop({ type: 'number' })
  expiresIn?: number;

  @Prop({ type: 'number' })
  createdAt?: number;

  @Prop({ indexed: true })
  context: string;

  @Prop()
  injectorName: string;

  @Prop()
  refreshToken: string;

  @Prop()
  accessToken: string;

  @Prop()
  sessionId?: string;

  @Prop()
  tokenType?: string;

  @Prop()
  idToken: string;

  @Prop()
  scope?: string;

  // Raw JSON object; specific fields are mapped above for indexing
}
