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

As documented in [Defining Structures](Defining-Structures.md), nested fields are flattened in the schema using underscores.

**Example: Find users living in 'New York'.**

```typescript
// Structure: User -> address -> city
// Schema Field: address_city

const newYorkers = await userRepo.search()
  .where('address_city' as any) // Cast to any if strictly typed
  .eq('New York')
  .return.all();
```

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
