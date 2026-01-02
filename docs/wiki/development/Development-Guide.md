# Development Guide

This section is for contributors who want to modify the library, run tests, or debug issues locally.

## Prerequisites

- Node.js (>= 20)
- Docker & Docker Compose (for running Redis stack locally)

## Setting up the Environment

1. **Clone the repository**

    ```bash
    git clone https://github.com/Alpha018/nestjs-redisom.git
    cd nestjs-redisom
    ```

2. **Install Dependencies**

    ```bash
    npm install
    ```

3. **Start Redis Stack**
    We provide a `docker-compose.yml` to spin up a Redis Stack instance (with RediSearch and RedisJSON).

    ```bash
    docker-compose up -d
    ```

    This will start Redis on port `6379`.

## Running Tests

### Unit Tests

Unit tests mock the Redis client and test the library logic in isolation.

```bash
npm run test
```

### End-to-End (E2E) Tests

E2E tests connect to the running Docker Redis instance. **Ensure Docker is running first.**

```bash
npm run test:e2e
```

If you want to run a specific E2E test file:

```bash
npx jest test/complex-structure/auth-session.e2e-spec.ts --config ./test/jest-e2e.json
```

## Workflow for Contributors

When contributing to this project, please follow this workflow to ensure code quality and stability.

1. **Create a Feature Branch**
    Always work on a separate branch for your changes.

    ```bash
    git checkout -b feature/my-awesome-feature
    ```

2. **Make Contributions**
    Implement your features or fixes in the `src/` directory.

3. **Ensure Code Quality (Lint & Format)**
    Before testing, ensure your code adheres to Project standards.

    ```bash
    # Format code with Prettier
    npm run format

    # Check for linting errors
    npm run lint
    ```

4. **Write and Run Tests**
    **Crucial:** All new features must include both **Unit Tests** (for logic isolation) and **E2E Tests** (for verification against a real Redis instance).

    - **Unit Tests**: Run fast tests isolated from the database.

        ```bash
        npm run test
        ```

    - **E2E Tests**: Verify integration with Redis Stack. **Docker must be running.**

        ```bash
        npm run test:e2e
        ```

    - **Coverage**: Ensure you haven't decreased code coverage.

        ```bash
        npm run test:cov
        ```

5. **Commit Changes**
    We use conventional commits. Please follow the convention `type: description`.

    ```bash
    git add .
    git commit -m "feat: add support for new Redis command"
    ```

## Debugging

You can use the `.vscode/launch.json` or WebStorm Run Configurations provided (if any) to attach a debugger to the test runner.
