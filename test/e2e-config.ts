import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

import { RedisOmModuleOptions } from '../src/redis-om/interfaces';

dotenv.config({ path: '.env.test' });

export function getRedisTestConfig(): RedisOmModuleOptions {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  const useTls = url.startsWith('rediss://');

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
        // Fallback if file doesn't exist but url implies TLS (e.g. external provider)
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

  return {
    socket: Object.keys(socketOptions).length > 0 ? socketOptions : undefined,
    url,
  };
}
