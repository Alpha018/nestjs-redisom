import { EntityId } from 'redis-om';

export interface EntityWithId {
  [EntityId]?: string;
}

export class BaseEntity {
  static getId(entity: EntityWithId | object): undefined | string {
    if (!entity) return undefined;
    return (entity as EntityWithId)[EntityId];
  }
}
