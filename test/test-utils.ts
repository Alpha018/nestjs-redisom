import { createCluster, createClient } from 'redis';
import { Repository } from 'redis-om';

/** Minimal structural type for any Redis client (standalone or cluster) used in test helpers. */
interface RedisTestClient {
  disconnect(): Promise<unknown>;
  flushAll(): Promise<unknown>;
  connect(): Promise<unknown>;
}

/**
 * Checks whether the connected Redis instance supports Redis Stack commands
 * (RediSearch + RedisJSON). Returns false when running against a plain Redis
 * cluster that does not have those modules loaded.
 */
export async function isRedisStackAvailable(config: any): Promise<boolean> {
  const isCluster = !!config.rootNodes;

  const tempConfig = isCluster
    ? {
      ...config,
      defaults: { ...config.defaults, socket: { connectTimeout: 15000 } },
    }
    : { ...config, socket: { ...config.socket, connectTimeout: 15000 } };

  // Cast to any to avoid fighting Redis's complex generic signatures between cluster and standalone clients
  const tempClient: any = isCluster
    ? createCluster(tempConfig as any)
    : createClient(tempConfig);

  try {
    await tempClient.connect();

    if (isCluster) {
      try {
        await tempClient.sendCommand(['FT._LIST'], { asap: false } as any);
      } catch {
        return false;
      }
    } else {
      await tempClient.sendCommand(['FT._LIST']);
    }
    return true;
  } catch (e: any) {
    const msg = (e.message ?? '').toLowerCase();
    if (
      msg.includes('unknown command') ||
      msg.includes('ft._list') ||
      msg.includes('err auth')
    ) {
      return false;
    }
    throw e;
  } finally {
    try {
      if (tempClient.isOpen) {
        await tempClient.quit();
      } else {
        await tempClient.disconnect();
      }
      if (isCluster) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch {
      // ignore
    }
  }
}

/**
 * Utility to flush Redis data and indices using a configuration object.
 * Creates a temporary client, connects, flushes, and disconnects.
 */
export async function flushRedisWithConfig(config: any): Promise<void> {
  // Cast to any to avoid fighting Redis's complex generic signatures between cluster and standalone clients
  const tempClient: any = config.rootNodes
    ? createCluster(config)
    : createClient(config);

  try {
    await tempClient.connect();
    await flushRedis(tempClient);
  } finally {
    try {
      if (tempClient.isOpen) {
        await tempClient.quit();
      } else {
        await tempClient.disconnect();
      }

      if (config.rootNodes) {
        // macOS Docker proxy TCP cleanup delay to prevent `nodeAddressMap` connection starvation in sequential suites
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch {
      // ignore
    }
  }
}

/**
 * Robustly sets up the index for a repository.
 * Handles environments where RediSearch/RedisStack might not be available (e.g. standard Redis TLS container).
 */
export async function setupTestIndex(repo: Repository<any>) {
  // 1. Try to drop existing index
  try {
    await repo.dropIndex();
  } catch {
    // Ignore errors here (e.g. index doesn't exist, or command unknown)
  }

  // 2. Try to create new index
  try {
    await repo.createIndex();
  } catch (error: any) {
    if (!error.message?.includes('unknown command')) {
      console.warn('Silent setupTestIndex createIndex fail:', error.message);
    }
  }
}

/**
 * Utility to flush Redis data and indices.
 * Useful for ensuring test isolation in E2E environments.
 */
export async function flushRedis(client: RedisTestClient): Promise<void> {
  try {
    // FLUSHALL removes all keys from all databases.
    await client.flushAll();
  } catch (error: any) {
    if (!error.message?.includes('unknown command')) {
      console.warn('Failed to flush Redis during cleanup:', error.message);
    }
  }
}
