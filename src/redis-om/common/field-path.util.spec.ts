import 'reflect-metadata';

import { Schema } from '../decorators/schema.decorator';
import { Prop } from '../decorators/prop.decorator';
import { fieldPath } from './field-path.util';

class Address {
  @Prop({ indexed: true })
  city: string;

  @Prop()
  street: string;
}

@Schema({ nestedSeparator: '.' })
class PersonDotEntity {
  @Prop({ type: () => Address })
  homeAddress: Address;

  @Prop({ indexed: true })
  name: string;
}

@Schema()
class PersonEntity {
  @Prop({ type: () => Address })
  homeAddress: Address;

  @Prop({ indexed: true })
  name: string;
}

describe('fieldPath', () => {
  describe('root fields', () => {
    it('resolves a root field from a string path', () => {
      expect(fieldPath(PersonEntity, 'name')).toBe('name');
    });

    it('resolves a root field from a selector', () => {
      expect(fieldPath(PersonEntity, (p) => p.name)).toBe('name');
    });
  });

  describe('nested fields with the default separator', () => {
    it('resolves a nested field from a string path', () => {
      expect(fieldPath(PersonEntity, 'homeAddress.city')).toBe(
        'homeAddress_city',
      );
    });

    it('resolves a nested field from a selector', () => {
      expect(fieldPath(PersonEntity, (p) => p.homeAddress.city)).toBe(
        'homeAddress_city',
      );
    });
  });

  describe('nested fields with a custom nestedSeparator', () => {
    it('resolves a nested field from a string path', () => {
      expect(fieldPath(PersonDotEntity, 'homeAddress.city')).toBe(
        'homeAddress.city',
      );
    });

    it('resolves a nested field from a selector', () => {
      expect(fieldPath(PersonDotEntity, (p) => p.homeAddress.city)).toBe(
        'homeAddress.city',
      );
    });
  });

  describe('validation', () => {
    it('throws when a segment is not a decorated @Prop', () => {
      expect(() => fieldPath(PersonEntity, 'homeAddress.zip')).toThrow(
        /'zip' is not a @Prop/,
      );
    });

    it('throws when the root property does not exist', () => {
      expect(() => fieldPath(PersonEntity, 'unknownField')).toThrow(
        /'unknownField' is not a @Prop/,
      );
    });

    it('throws when trying to traverse into a non-nested field', () => {
      expect(() => fieldPath(PersonEntity, 'name.first')).toThrow(
        /'name' is not a nested object/,
      );
    });

    it('throws on an empty path', () => {
      expect(() => fieldPath(PersonEntity, '')).toThrow(/cannot be empty/);
    });
  });
});
