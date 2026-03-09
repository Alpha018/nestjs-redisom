import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

import { RedisOmModuleOptions } from '../src';

dotenv.config({ path: '.env.test', quiet: true } as any);

export function getRedisTestConfig(): RedisOmModuleOptions {
  const useCluster = process.env.REDIS_USE_CLUSTER === 'true';
  const globalPassword = process.env.REDIS_PASSWORD;
  const clusterPassword = process.env.REDIS_CLUSTER_PASSWORD || globalPassword;
  const standalonePassword =
    process.env.REDIS_STANDALONE_PASSWORD || globalPassword;

  if (useCluster) {
    const rootNodesString = process.env.REDIS_CLUSTER_ROOT_NODES;
    if (!rootNodesString) {
      throw new Error(
        'REDIS_USE_CLUSTER is true but REDIS_CLUSTER_ROOT_NODES is not defined',
      );
    }

    const rootNodes = rootNodesString.split(',').map((nodeStr) => {
      const hostPort = nodeStr.startsWith('redis://')
        ? nodeStr.substring(8)
        : nodeStr;
      const auth = clusterPassword ? `:${clusterPassword} @` : '';
      return { url: `redis://${auth}${hostPort}` };
    });

    const isCI = process.env.CI === 'true';
    const nodeAddressMap = !isCI ? buildLocalNodeAddressMap() : undefined;

    return {
      defaults: {
        socket: {
          connectTimeout: 30000,
        },
        password: clusterPassword,
      },
      password: clusterPassword,
      nodeAddressMap,
      rootNodes,
    } as any;
  }

  const url = process.env.REDIS_URL || 'redis://localhost:6379';

  const useTls = url.startsWith('rediss://');

  const config: any = { url };

  if (standalonePassword) {
    config.password = standalonePassword;
  }

  let socketOptions: any = {};

  if (useTls) {
    try {
      const caPath = path.join(process.cwd(), 'redis-tls/certs/ca.crt');
      if (fs.existsSync(caPath)) {
        const caCert = fs.readFileSync(caPath);
        socketOptions = {
          rejectUnauthorized: false,
          connectTimeout: 30000,
          ca: caCert,
          tls: true,
        };
      } else {
        socketOptions = {
          rejectUnauthorized: false,
          tls: true,
        };
      }
    } catch (e) {
      console.warn('Could not read CA cert, using default TLS config', e);
      socketOptions = {
        rejectUnauthorized: false,
        tls: true,
      };
    }
  }

  if (Object.keys(socketOptions).length > 0) {
    config.socket = socketOptions;
  }

  return config;
}

function buildLocalNodeAddressMap(): Record<
  string,
  { host: string; port: number }
> {
  // Map cluster slots (7000-7005) to local host ports (8000-8005) to avoid conflicts.
  const nodeAddressMap: Record<string, { host: string; port: number }> = {};
  for (let port = 7000; port <= 7005; port++) {
    nodeAddressMap[`127.0.0.1:${port}`] = {
      host: '127.0.0.1',
      port: port + 1000, // 7000 -> 8000
    };
  }
  return nodeAddressMap;
}
