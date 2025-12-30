import { Type } from '@nestjs/common';

/**
 * Generates an injection token for a custom repository.
 * @param entity The entity class or name associated with the repository.
 * @returns The unique injection token string (e.g., 'MyEntityRepository').
 * @throws When entity is null or undefined.
 */
export function getRepositoryToken(entity: Type<any> | string): string {
  if (entity === null || entity === undefined) {
    throw new Error('Entity cannot be null or undefined');
  }
  const name = typeof entity === 'string' ? entity : entity.name;
  return `${name}Repository`;
}

/**
 * Generates an injection token for the Redis connection options/client.
 * @param name Optional connection name to distinguish multiple connections.
 * @returns The injection token for the connection.
 */
export function getConnectionToken(name?: string): string {
  return name && name !== 'default'
    ? `REDIS_OM_CONNECTION_${name}`
    : 'REDIS_OM_CONNECTION';
}
