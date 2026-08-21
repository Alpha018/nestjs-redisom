# Advanced Searching

`nestjs-redisom` leverages RediSearch to perform complex queries efficiently.

## 1. Complex Chained Queries

You can chain multiple conditions using `.and()` and `.or()`.

**Example: Find active users in 'US' region created after a specific date.**

```typescript
const dateThreshold = new Date('2023-01-01').getTime();

const users = await userRepo.search()
  .where('isActive').is.true()
  .and('region').eq('US')
  .and('createdAt').gt(dateThreshold)
  .return.all();
```

## 2. Searching Nested Fields

As documented in **[[Defining Structures|Defining-Structures]]**, nested fields are flattened in the schema using underscores by default (or whatever `nestedSeparator` the entity's `@Schema()` configures).

**Example: Find users living in 'New York'.**

```typescript
// Structure: User -> address -> city
// Schema Field: address_city

const newYorkers = await userRepo.search()
  .where('address_city' as any) // Cast to any if strictly typed
  .eq('New York')
  .return.all();
```

Prefer `fieldPath()` over hardcoding the flattened string; see [Section 6](#6-fieldpath-type-safe-nested-field-names) below.

## 3. Numeric Ranges and Dates

Dates are typically stored as timestamps (numbers) or ISO strings. If stored as numbers (recommended for range queries):

```typescript
// Find products between $100 and $500
const products = await productRepo.search()
  .where('price').between(100, 500)
  .return.all();
```

## 4. Array Containment

If you have an array property (e.g., `tags: string[]`), you can find documents containing a specific tag.

```typescript
// Find posts tagged with 'nestjs' AND 'redis'
const posts = await postRepo.search()
  .where('tags').contain('nestjs')
  .and('tags').contain('redis')
  .return.all();
```

## 5. Full Text Search

If a field is indexed as text/string, you can perform full-text matching.

```typescript
@Schema()
export class Example extends BaseEntity {
  @Prop({ textSearch: true })
  description: string;
}
```

```typescript
// Find descriptions containing "fast"
const results = await repo.search()
  .where('description').matches('fast')
  .return.all();
```

## 6. `fieldPath`: Type-Safe Nested Field Names

`fieldPath(Entity, pathOrSelector)` resolves the flattened field key for a `.where()` call by walking the entity's `@Prop` metadata, so you don't have to know or hardcode its `nestedSeparator` (`_` by default, or whatever [[Defining Structures|Defining-Structures]] configures).

It accepts either a typed property selector or a dot-separated string; both resolve to the same key:

```typescript
import { fieldPath } from 'nestjs-redisom';

// Typed selector: autocompletes, and fails to compile if the property doesn't exist
await customerRepo.search()
  .where(fieldPath(Customer, (c) => c.address.city))
  .eq('New York')
  .return.all();

// Equivalent string form, handy when the path is built dynamically
await customerRepo.search()
  .where(fieldPath(Customer, 'address.city'))
  .eq('New York')
  .return.all();
```

Both forms work for root fields too: `fieldPath(Customer, (c) => c.name)` resolves to `'name'`.

### Validation

`fieldPath` throws immediately, before the query ever reaches Redis, when the path doesn't correspond to an actual decorated structure:

```typescript
fieldPath(Customer, 'address.country');
// Error: Invalid field path 'address.country': 'country' is not a @Prop() of Address.

fieldPath(Customer, 'name.first');
// Error: Invalid field path 'name.first': 'name' is not a nested object, so 'first' cannot be accessed on it.
```

This catches typos and stale paths (e.g. after renaming a `@Prop`) at the call site, instead of a query silently returning zero results.

### Why not just use the raw string?

`.where('address_city' as any)` still works and always will. `fieldPath` doesn't replace it; it just removes two footguns:

1. You no longer need to know which separator the entity's `@Schema()` uses (`_` vs a custom `nestedSeparator`).
2. A typo or renamed property fails fast instead of quietly matching nothing.
