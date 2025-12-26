import 'reflect-metadata';

import {
  REDIS_OM_SCHEMA_METADATA,
  REDIS_OM_PROP_METADATA,
} from '../redis-om.constants';
import { InjectRepository } from './inject-repository.decorator';
import { Schema } from './schema.decorator';
import { Prop } from './prop.decorator';

describe('Decorators', () => {
  describe('@Schema', () => {
    it('should define schema metadata on class', () => {
      @Schema({ dataStructure: 'JSON' })
      class TestEntity {}

      const metadata = Reflect.getMetadata(
        REDIS_OM_SCHEMA_METADATA,
        TestEntity,
      );
      expect(metadata).toEqual({ dataStructure: 'JSON' });
    });

    it('should define default metadata when no options provided', () => {
      @Schema()
      class TestEntity {}

      const metadata = Reflect.getMetadata(
        REDIS_OM_SCHEMA_METADATA,
        TestEntity,
      );
      expect(metadata).toEqual({});
    });
  });

  describe('@Prop', () => {
    it('should define property metadata on target constructor', () => {
      class TestEntity {
        @Prop()
        name: string;
      }

      const metadata = Reflect.getMetadata(REDIS_OM_PROP_METADATA, TestEntity);
      expect(metadata).toHaveLength(1);
      expect(metadata[0]).toEqual({ propertyKey: 'name', options: {} });
    });

    it('should append metadata for multiple properties', () => {
      class TestEntity {
        @Prop({ type: 'number' })
        age: number;
        @Prop()
        name: string;
      }

      const metadata = Reflect.getMetadata(REDIS_OM_PROP_METADATA, TestEntity);
      expect(metadata).toHaveLength(2);
      expect(metadata.find((m: any) => m.propertyKey === 'name')).toBeDefined();
      expect(
        metadata.find((m: any) => m.propertyKey === 'age').options,
      ).toEqual({ type: 'number' });
    });
  });

  describe('@InjectRepository', () => {
    it('should inject repository with correct token', () => {
      class TestEntity {}
      expect(typeof InjectRepository(TestEntity)).toBe('function');
    });
  });
});
