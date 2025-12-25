import { Inject } from '@nestjs/common';
import { getRepositoryToken } from '../common/redis-om.utils';
import { Type } from '@nestjs/common';

export const InjectRepository = (entity: Type<any>) => {
  return Inject(getRepositoryToken(entity));
};
