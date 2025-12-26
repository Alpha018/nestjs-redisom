import { EntityId } from 'redis-om';

export interface EntityWithId {
  [EntityId]?: string;
}

export class BaseEntity {
  static getId(entity: EntityWithId | object): undefined | string {
    return entity && (entity as EntityWithId)[EntityId];
  }
}
