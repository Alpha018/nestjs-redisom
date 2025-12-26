import 'reflect-metadata';

import { Schema } from '../decorators/schema.decorator';
import { Prop } from '../decorators/prop.decorator';
import { SchemaFactory } from './schema.factory';

describe('SchemaFactory', () => {
  describe('createForClass', () => {
    it('should create a schema with defined properties', () => {
      @Schema()
      class TestEntity {
        @Prop({ type: 'number' })
        age: number;

        @Prop()
        name: string;
      }

      const schema = SchemaFactory.createForClass(TestEntity);

      expect(schema).toBeDefined();
      const fields = (schema as any).fields;
      expect(fields).toBeDefined();
      // Verify fields existence by checking names in the fields array
      expect(fields.find((f: any) => f.name === 'name')).toBeDefined();
      expect(fields.find((f: any) => f.name === 'age')).toBeDefined();
    });

    it('should throw error if class is not decorated with @Schema', () => {
      class Undecorated {}
      expect(() => SchemaFactory.createForClass(Undecorated)).toThrow();
    });

    it('should respect custom data structure options', () => {
      @Schema({ dataStructure: 'JSON' })
      class JsonEntity {
        @Prop()
        field: string;
      }

      const schema = SchemaFactory.createForClass(JsonEntity);
      expect(schema.dataStructure).toBe('JSON');
    });
  });
});
