#!/bin/bash
echo "Waiting for Redis Cluster slots to be assigned..."
CONTAINER_ID=$(docker ps -q -f ancestor=grokzen/redis-cluster:latest | head -n 1)
if [ -z "$CONTAINER_ID" ]; then
  echo "Redis Cluster container not found!"
  exit 1
fi

for i in $(seq 1 30); do
  INFO=$(docker exec $CONTAINER_ID redis-cli -p 7000 cluster info 2>&1 || echo "CLI error")
  echo "Attempt $i info: $INFO"
  if echo "$INFO" | grep -q "cluster_state:ok"; then
    echo "Redis Cluster is ready!"
    echo "Disabling protected mode on all nodes..."
    for port in $(seq 7000 7005); do
      docker exec $CONTAINER_ID redis-cli -p $port CONFIG SET protected-mode no
    done
    exit 0
  fi
  sleep 3
done
echo "Redis Cluster did not become ready in time"
echo "--- DOCKER LOGS ---"
docker logs --tail 200 $CONTAINER_ID || true
exit 1
