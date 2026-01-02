# Defining Structures in Typescript

`nestjs-redisom` is built specifically for **NestJS** and **TypeScript**, leveraging classes and decorators to define your RedisJSON schemas and indexes automatically.

This guide progresses from basic primitive types to complex nested structures and how to query them.

---

## 1. Basic Primitive Types

At the core, you define entities as classes. Supported primitives include `string`, `number`, `boolean`, and `Date`.

### The `@Prop` Decorator

Use `@Prop()` to mark properties for persistence.

- **`indexed`**: (Optional) If `true`, creates a RediSearch index for this field.
- **`textSearch`**: (Optional) If `true`, indexes as `TEXT` (full-text search) instead of `TAG` (exact match).

### Example: Simple User Profile

```typescript
import { Schema, Prop, BaseEntity } from 'nestjs-redisom';

@Schema()
export class UserProfile extends BaseEntity {
  @Prop({ indexed: true })
  username: string; // Exact match search

  @Prop({ textSearch: true })
  bio: string; // Full-text search (e.g., "developer from NY")

  @Prop({ indexed: true })
  age: number; // Numeric range search

  @Prop()
  isActive: boolean; // Boolean flag

  @Prop()
  createdAt: Date; // Stored as timestamp
}
```

---

## 2. Arrays

RedisJSON and RediSearch support arrays of primitives natively. You can index them to find documents where the array **contains** a value.

### Example: Product with Tags

```typescript
@Schema()
export class Product extends BaseEntity {
  @Prop()
  name: string;

  @Prop()
  tags: string[]; // e.g., ['electronics', 'summer-sale', 'new']

  @Prop()
  ratings: number[]; // e.g., [5, 4, 5]
}
```

**How it works**:
If you search for `tags: 'electronics'`, RediSearch returns all products where `'electronics'` is in the `tags` array.

---

## 3. Nested Objects

For complex data, you can nest other classes.
**Important**: You must use the `type: () => ClassName` syntax in `@Prop` so the library knows how to construct the object.

### Step A: Define the Nested Class

This class doesn't need `@Schema()`, but properties need `@Prop()` to be indexed.

```typescript
export class Address {
  @Prop({ indexed: true })
  city: string;

  @Prop()
  zipCode: string; // Not indexed
}
```

### Step B: Use in Parent

```typescript
@Schema()
export class Customer extends BaseEntity {
  @Prop()
  name: string;

  @Prop({ type: () => Address })
  address: Address;
}
```

### Flattening Behavior

RediSearch (by default) is flat. We flatten your schema path using underscores:

- `address.city` becomes `address_city` in the search index.
- The data remains nested JSON in Redis.

---

## 4. Deeply Nested Structures

You can go as deep as needed.

```typescript
export class Geo {
  @Prop() lat: number;
  @Prop() lng: number;
}
export class DeviceMetadata {
  @Prop() os: string;
  @Prop({ type: () => Geo }) location: Geo;
}

@Schema()
export class Session extends BaseEntity {
  @Prop({ type: () => DeviceMetadata })
  meta: DeviceMetadata;
}
```

**Index Field**: `meta_location_lat`.

---

---

## 5. Time-To-Live (TTL)

Redis allows you to automatically expire documents after a set time (common for Sessions / Caches).

### Managing TTL in Services

Since expiration happens on the Redis Key, you manage specific document lifetimes via the Repository (**not** strictly in the `@Schema` definition).

```typescript
@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(Session) private readonly repo: Repository<Session>
  ) {}

  /**
   * Create a session that self-destructs after 1 hour (3600s)
   */
  async createSession(data: Session) {
    const entity = await this.repo.save(data);
    
    // Set TTL on the newly created entity ID
    await this.repo.expire(entity[this.repo.schema.idField], 3600);
    
    return entity;
  }

  /**
   * Refresh the TTL (e.g., keep alive on activity)
   */
  async heartbeat(sessionId: string) {
    // Reset expiration to another 1 hour
    await this.repo.expire(sessionId, 3600);
  }
}
```

---

## 6. Extensive Search Examples

Once your structures are defined, here is how you perform complex queries on them.

### A. Searching Primitives & Text

```typescript
// Find users with "developer" in bio AND age > 21
const users = await userRepo.search()
  .where('bio').matches('developer')
  .and('age').gt(21)
  .return.all();
```

### B. Searching Arrays (Contains)

```typescript
// Find products tagged 'electronics' AND 'sale'
const products = await productRepo.search()
  .where('tags').contain('electronics')
  .and('tags').contain('sale')
  .return.all();
```

### C. Searching Nested Fields

Use the flattened name (property names joined by `_`).

```typescript
// Find customers in 'New York'
const customers = await customerRepo.search()
  .where('address_city' as any) // Cast to satisfy TS if property doesn't exist on top level
  .eq('New York')
  .return.all();
```

### D. Deep Nested Logic

```typescript
// Find sessions where OS is iOS AND caused by location > 40 lat
const sessions = await sessionRepo.search()
  .where('meta_os' as any).eq('iOS')
  .and('meta_location_lat' as any).gt(40)
  .return.all();
```

### E. Complex Composite Query

Combining all types:

```typescript
const results = await repo.search()
  .where('isActive').is.true()                // Boolean
  .and('tags').contain('premium')             // Array
  .and('address_city').eq('London')           // Nested
  .and('age').between(25, 40)                 // Numeric Range
  .return.page(0, 10);                        // Pagination
```
