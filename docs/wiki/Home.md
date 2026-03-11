# Welcome to the NestJS RedisOM Wiki

This wiki documents advanced usage patterns, configuration strategies, and real-world examples for the `nestjs-redisom` library.

---

## Why NestJS RedisOM?

This library bridges the gap between **NestJS**'s structured, dependency-injection-heavy architecture and **Redis**'s high-performance, flexible data structures.

### 🎯 Best Use Cases

* **High-Speed Objects**: Storing User Sessions, Profiles, or Shopping Carts that need <5ms read/write access.
* **Searchable Caching**: When you need to cache data but also query it (e.g., *"Find all cached products where category=electronics AND price<500"*).
* **Real-Time Data**: Leaderboards, Active User tracking, and ephemeral state management.

### ✅ Advantages

1. **NestJS Native**: Built with Modules, Decorators, and Services. If you know TypeORM/Mongoose, you know this.
2. **Type Safe**: leverages TypeScript classes and decorators to define schemas, ensuring your data contract is respected.
3. **Powerful Search**: Unlocks **RediSearch** capabilities—Full-Text Search, Geo-Spatial queries, and complex filtering without the complexity of raw Redis commands.
4. **Repository Pattern**: Testable, mockable data access layers.

### ⚠️ Trade-offs & Limitations

1. **Memory Bound**: Redis stores data in RAM. It is expensive for archiving TBs of cold data.
2. **Eventual Consistency**: RediSearch indexes are updated asynchronously. A document written *now* might not appear in a search query *1ms later*.
3. **No Relations**: This is a Document Query Engine, not a Relational Database. There are no JOINs.

## 📦 Installation

To start using `nestjs-redisom` in your project:

```bash
npm install @alpha018/nestjs-redisom redis-om redis
```

---

## 📚 Wiki Index

### Usage Guide

*Core concepts for building applications.*

* [[Configuration|Configuration]]
* [[Defining Structures|Defining-Structures]]
* [[Advanced Searching|Searching]]
* [[Multi-Tenancy|Multi-Tenancy]]
* [[Error Handling|Error-Handling]]

### Design Patterns

*Recommended architectural patterns for robust applications.*

* [[Environment Validation|Environment-Validation]]
* [[Configuration Service|Configuration-Service]]

### Development

*For contributors and maintainers.*

* [[Development Guide|Development-Guide]]

---

## Quick Links

* [GitHub Repository](https://github.com/Alpha018/nestjs-redisom)
* [NPM Package](https://www.npmjs.com/package/@alpha018/nestjs-redisom)
