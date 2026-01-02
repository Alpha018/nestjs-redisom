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

---

## 📚 Wiki Index

### Usage Guide

*Core concepts for building applications.*

* **[Configuration](usage/Configuration.md)**: connection setup, TLS, and Cluster options.
* **[Defining Structures](usage/Defining-Structures.md)**: Modeling data with Nested objects, Arrays, Schemas, and **TTL**.
* **[Advanced Searching](usage/Searching.md)**: Chained queries, Numeric Ranges, and Full-Text search.
* **[Multi-Tenancy](usage/Multi-Tenancy.md)**: Building SaaS platforms with isolated tenant data.

### Design Patterns

*Recommended architectural patterns for robust applications.*

* **[Environment Validation](patterns/Environment-Validation.md)**: Enforcing fail-safe configuration at startup.
* **[Configuration Service](patterns/Configuration-Service.md)**: Abstracting type-safe configuration access.

### Development

*For contributors and maintainers.*

* **[Development Guide](development/Development-Guide.md)**: Docker Compose setup, Testing strategies, and Contribution workflow.

---

## Quick Links

* [GitHub Repository](https://github.com/Alpha018/nestjs-redisom)
* [NPM Package](https://www.npmjs.com/package/@alpha018/nestjs-redisom)
