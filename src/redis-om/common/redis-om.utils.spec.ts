import { getRepositoryToken, getConnectionToken } from './redis-om.utils';

class TestEntity {}

describe('RedisOmUtils', () => {
  describe('getRepositoryToken', () => {
    it('should generate correct token for class', () => {
      expect(getRepositoryToken(TestEntity)).toBe('TestEntityRepository');
    });

    it('should generate correct token for string', () => {
      expect(getRepositoryToken('CustomModel')).toBe('CustomModelRepository');
    });
  });

  describe('getConnectionToken', () => {
    it('should return fixed connection token', () => {
      expect(getConnectionToken()).toBe('REDIS_OM_CONNECTION');
    });

    it('should return custom connection token when name is provided', () => {
      expect(getConnectionToken('custom')).toBe('REDIS_OM_CONNECTION_custom');
    });
  });
});
