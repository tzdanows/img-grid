# Testing Readme

keep tests **simple** and **fast**

## Quick Start

```bash
deno task test:quick    # Run all tests quickly
deno task test:watch    # Watch mode during development
deno task ci           # Full check before committing
```

## Running Tests

### During Development

```bash
# Quick feedback
deno task test:quick

# Watch specific file
deno test --watch tests/cache_test.ts

# Run single test
deno test --filter "Cache - evicts"
```

### Before Committing

```bash
# Full CI pipeline
deno task ci

# With coverage
deno task test:coverage
```

### CI/CD

Tests run automatically on:
- Every push to `main`
- All pull requests
- Pre-commit hooks (if configured)

## Debugging Tests

```bash
# Verbose output
deno test --allow-all

# Stop on first failure
deno test --fail-fast

# Inspect specific test
deno test --filter "test name" --inspect
``` 

## Test Organization

```
tests/
├── testing.md           # This file
├── cloudinary_test.ts   # External service tests
├── content_test.ts      # Data validation
├── cache_test.ts        # Performance features
└── server_test.ts       # Server behavior
```