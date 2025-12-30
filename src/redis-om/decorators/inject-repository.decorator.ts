import { Inject } from '@nestjs/common';
import { Type } from '@nestjs/common';

import { getRepositoryToken } from '../common/redis-om.utils';

/**
 * Injects the Redis OM repository for a specific entity into the class.
 * @param entity The entity class or name for which to get the repository.
 * @returns A parameter decorator used for dependency injection.
 */
export const InjectRepository = (entity: Type<any>) => {
  return Inject(getRepositoryToken(entity));
};
