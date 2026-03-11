# Redis Configuration

## Basic Connection

The simplest way to connect is using a single Redis URL.

```typescript
RedisOmModule.forRoot({
  url: 'redis://localhost:6379'
})
```

## TLS Connection (Production)

For secure connections (e.g. AWS ElastiCache, Redis Cloud), use the `rediss://` protocol and configure the `socket` options.

### Static Configuration

```typescript
RedisOmModule.forRoot({
  url: 'rediss://your-redis-instance:6380',
  socket: {
    tls: true,
    rejectUnauthorized: false, // Set to true if you are verifying the CA
    // ca: [fs.readFileSync('path/to/ca.pem')] // If using a custom CA
  }
})
```

### Async Configuration (Recommended)

Using `ConfigService` ensures your secrets aren't hardcoded.

```typescript
// app.module.ts
RedisOmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    url: config.get('REDIS_URL'),
    socket: {
      tls: config.get('REDIS_TLS') === 'true',
      rejectUnauthorized: config.get('REDIS_REJECT_UNAUTHORIZED') !== 'false',
    }
  })
})
```

> **Tip**: For advanced environment validation (e.g. using `class-validator` to ensure all these variables exist), see **[[Environment Validation|Environment-Validation]]**.
> **Tip**: To abstract these string keys into a type-safe service, see **[[Configuration Service|Configuration-Service]]**.

## Redis Cluster

`nestjs-redisom` supports full Cluster Mode Enabled deployments via the underlying `node-redis` library's `createCluster` method.

To connect to a Redis Cluster, provide an array of `rootNodes` instead of a single `url`:

```typescript
RedisOmModule.forRoot({
  rootNodes: [
    { url: 'redis://redis-cluster-node-1:7000' },
    { url: 'redis://redis-cluster-node-2:7000' },
    { url: 'redis://redis-cluster-node-3:7000' }
  ],
  defaults: {
    password: 'your-cluster-password',
    socket: {
      connectTimeout: 10000
    }
  }
})
```

### Auto-Discovery (Slot Topology)

You do not need to list every single node in the cluster in your `rootNodes` array. The client uses these initial nodes simply as entry points to connect to the cluster. Upon successful connection, it will automatically execute the `CLUSTER SLOTS` command to discover the full topology.

This auto-discovery mechanism means:

1. It automatically discovers all primary (master) and replica nodes.
2. It understands exactly which hash slots (0-16383) are served by which nodes.
3. It seamlessly routes your module commands to the correct nodes based on the key's hash slot.
4. If the cluster topology changes (e.g., a failover occurs or a scaling event happens), the client natively handles cluster redirects (`MOVED`, `ASK`) and refreshes its internal slot map automatically.

Usually, providing 2 or 3 geographically distributed nodes from the cluster in your `rootNodes` is sufficient to guarantee an initial connection.

### Async Configuration with Cluster

When using `ConfigService` to dynamically load cluster nodes from an environment variable (e.g., `REDIS_CLUSTER_NODES=redis://node1:7000,redis://node2:7000`):

```typescript
// app.module.ts
RedisOmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const nodesString = config.get<string>('REDIS_CLUSTER_NODES') || '';
    const rootNodes = nodesString.split(',').map(url => ({ url }));

    return {
      rootNodes,
      defaults: {
        password: config.get('REDIS_CLUSTER_PASSWORD')
      }
    };
  }
})
```
