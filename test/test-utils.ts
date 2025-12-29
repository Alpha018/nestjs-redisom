import { Repository } from 'redis-om';

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
  } catch {
    // Ignore errors here (e.g. index doesn't exist, or command unknown)
  }
}
