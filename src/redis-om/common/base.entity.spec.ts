import { EntityId } from 'redis-om';

import { BaseEntity } from './base.entity';

class TestEntity extends BaseEntity {
  [key: string]: any;
}

describe('BaseEntity', () => {
  describe('getId', () => {
    it('should return ID when entity has EntityId symbol', () => {
      const entity = new TestEntity();
      const id = '123';
      (entity as any)[EntityId] = id;
      expect(BaseEntity.getId(entity)).toBe(id);
    });

    it('should return undefined when entity has no ID', () => {
      const entity = new TestEntity();
      expect(BaseEntity.getId(entity)).toBeUndefined();
    });

    it('should handle plain generic object with EntityId symbol', () => {
      const id = '456';
      const entity = { [EntityId]: id };
      expect(BaseEntity.getId(entity)).toBe(id);
    });

    it('should handle null/undefined input gracefully', () => {
      expect(BaseEntity.getId(null as any)).toBeUndefined();
      expect(BaseEntity.getId(undefined as any)).toBeUndefined();
    });
  });
});
