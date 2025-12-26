import { Inject } from '@nestjs/common';
import { Type } from '@nestjs/common';

import { getRepositoryToken } from '../common/redis-om.utils';

export const InjectRepository = (entity: Type<any>) => {
  return Inject(getRepositoryToken(entity));
};
