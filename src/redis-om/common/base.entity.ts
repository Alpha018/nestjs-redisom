import { EntityId } from 'redis-om';

export interface EntityWithId {
  [EntityId]?: string;
}

export class BaseEntity {
  static getId(entity: EntityWithId | object): string | undefined {
    return entity && (entity as EntityWithId)[EntityId];
  }
}
