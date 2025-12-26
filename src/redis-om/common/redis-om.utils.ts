import { Type } from '@nestjs/common';

export function getRepositoryToken(entity: Type<any> | string): string {
  if (entity === null || entity === undefined) {
    throw new Error('Entity cannot be null or undefined');
  }
  const name = typeof entity === 'string' ? entity : entity.name;
  return `${name}Repository`;
}

export function getConnectionToken(name?: string): string {
  return name && name !== 'default'
    ? `REDIS_OM_CONNECTION_${name}`
    : 'REDIS_OM_CONNECTION';
}
