import { EntityId } from 'redis-om';

/**
 * Interface representing an entity that may possess a Redis OM internal ID.
 */
export interface EntityWithId {
  [EntityId]?: string;
}

/**
 * Base class for entities providing utility methods.
 */
export class BaseEntity {
  /**
   * Retrieves the internal Redis OM ID of an entity.
   * @param entity The entity instance or object to check.
   * @returns The internal ID string if available, otherwise undefined.
   */
  static getId(entity: EntityWithId | object): undefined | string {
    if (!entity) return undefined;
    return (entity as EntityWithId)[EntityId];
  }
}
