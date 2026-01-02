# Multi-Tenancy & Advanced Architecture

This section describes robust patterns for handling multi-tenant applications and ensuring type-safe configuration.

## 1. Environment Validation

For robust environment validation strategies (e.g. using `class-validator`), please refer to the **[Patterns: Environment Validation](../patterns/Environment-Validation.md)** section.

---

## 2. Abstracting Configuration Service

For improved type safety and cleaner code, we recommend abstracting your `ConfigService` usage. See **[Patterns: Configuration Service](../patterns/Configuration-Service.md)**.

---

## 3. Multi-Tenancy Strategy

In advanced scenarios, you might need to isolate entire dependency trees per tenant, potentially connecting to different Redis instances or databases. NestJS allows this via `ContextIdStrategy`.

### 1. Abstracting Configuration for Tenants

First, structure your `AppConfigService` to return a map of configurations keyed by Tenant ID.

```typescript
// src/config/app-config.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface TenantRedisConfig {
  url: string;
  keyPrefix: string;
}

@Injectable()
export class AppConfigService {
  constructor(private config: ConfigService) {}

  get tenantsRedisConfig(): Record<string, TenantRedisConfig> {
    return {
      'tenant-a': {
        url: this.config.get<string>('REDIS_TENANT_A_URL'),
        keyPrefix: 'tenant:a:',
      },
      'tenant-b': {
        url: this.config.get<string>('REDIS_TENANT_B_URL'),
        keyPrefix: 'tenant:b:',
      },
    };
  }
}
```

### 2. Implementing the Context Strategy

This strategy intercepts requests to determine the current Tenant (e.g., from a header) and resolves a durable `ContextId` for that tenant.

```typescript
// src/core/strategy/tenant-context.strategy.ts
import { ContextId, ContextIdFactory, ContextIdStrategy, HostComponentInfo } from '@nestjs/core';
import { Request } from 'express'; 

export class TenantContextStrategy implements ContextIdStrategy {
  private tenantContexts = new Map<string, ContextId>();

  attach(contextId: ContextId, request: Request) {
    // 1. Resolve Tenant ID (Header, Query, etc.)
    const tenantId = (request.headers['x-tenant-id'] as string)?.toLowerCase() || 'default';

    // 2. Validate Tenant (Optional)
    // if (!isValidTenant(tenantId)) throw an error...

    // 3. Compute/Retrieve the Durable Context for this tenant
    let tenantSubTreeId = this.tenantContexts.get(tenantId);
    if (!tenantSubTreeId) {
      tenantSubTreeId = ContextIdFactory.create();
      this.tenantContexts.set(tenantId, tenantSubTreeId);
    }

    // 4. Return tenant context for Durable providers, regular context otherwise
    return {
      resolve: (info: HostComponentInfo) =>
        info.isTreeDurable ? tenantSubTreeId : contextId,
      payload: { tenantId },
    };
  }
}
```

### 3. Registering the Strategy

Apply the strategy in your `AppModule`.

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ContextIdFactory } from '@nestjs/core';
import { TenantContextStrategy } from './core/strategy/tenant-context.strategy';

// Apply structure globally
ContextIdFactory.apply(new TenantContextStrategy());

@Module({
  imports: [/* ... */],
  controllers: [/* ... */],
  providers: [/* ... */],
})
export class AppModule {}
```

### 4. Tenant-Aware Service (Usage Example)

Instead of managing connections manually, you can inject standard repositories and modify their behavior (e.g., search filters) based on the current tenant context.

#### Step 1: Define an Abstract Base Service

Centralize the common logic (filtering by tenant) in a base class.

```typescript
// src/core/base/tenant-resource.service.ts
import { Repository } from 'redis-om';
import { ProductEntity } from '../../modules/products/product.entity';
import { TenantRedisConfig } from '../../config/app-config.service';

export abstract class TenantResourceService {
  protected constructor(
    protected readonly productRepo: Repository<ProductEntity>,
    protected readonly config: TenantRedisConfig,
  ) {}

  async findAll() {
    // Automatically filter by the current tenant ID (or keyPrefix)
    return this.productRepo.search()
      .where('tenantId').equals(this.config.keyPrefix)
      .return.all();
  }

  async create(data: ProductEntity) {
    return this.productRepo.save(data);
  }
}
```

#### Step 2: Implement Request-Scoped Durable Service

Create the concrete service. It injects the specific Repository and Context, resolving the configuration before passing it to the base class.

```typescript
// src/modules/products/product-tenant.service.ts
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@alpha018/nestjs-redisom';
import { Repository } from 'redis-om';
import { ProductEntity } from './product.entity';
import { TenantResourceService } from '../../core/base/tenant-resource.service';
import { AppConfigService } from '../../config/app-config.service';

@Injectable({ scope: Scope.REQUEST, durable: true })
export class ProductTenantService extends TenantResourceService {
  constructor(
    @Inject(REQUEST) contextPayload: { tenantId: string },
    @InjectRepository(ProductEntity) productRepo: Repository<ProductEntity>,
    private readonly configService: AppConfigService,
  ) {
    const config = configService.tenantsRedisConfig[contextPayload.tenantId];

    // Pass specific Repo + Tenant Config to base
    super(productRepo, config);
  }
}
```

#### Step 3: Registering the Service

Ensure the service is exported and the entity is registered via `RedisOmModule`.

```typescript
// src/modules/products/product.module.ts
import { Module } from '@nestjs/common';
import { RedisOmModule } from '@alpha018/nestjs-redisom';
import { ProductEntity } from './product.entity';
import { ProductTenantService } from './product-tenant.service';

@Module({
  imports: [
    RedisOmModule.forFeature([ProductEntity]),
  ],
  providers: [ProductTenantService],
  exports: [ProductTenantService],
})
export class ProductModule {}
```

This pattern allows `TenantRedisStore` to hold a persistent connection for "Tenant A" separate from "Tenant B", efficiently reusing it across requests.
