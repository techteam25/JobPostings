# Temporary Scripts

This directory contains temporary utility scripts created for database testing and maintenance.

## Scripts

### `clear-database.ts`
Clears all tables in the database and resets auto-increment counters.

**Usage:**
```bash
bun temp-scripts/clear-database.ts
```

### `test-insert.ts`
Tests database insert functionality by creating a temporary test user, verifying it was inserted, and then cleaning it up.

**Usage:**
```bash
bun temp-scripts/test-insert.ts
```

### `query-test-user.ts`
Queries the database for any test users and displays their information. Also shows all users if no test users are found.

**Usage:**
```bash
bun temp-scripts/query-test-user.ts
```

### `seed-profiles.ts`
Seeds user profiles for existing users in the database. Only creates profiles for users that don't already have one.

**Usage:**
```bash
bun temp-scripts/seed-profiles.ts
```

## Note

These are temporary scripts created for testing and maintenance purposes. They can be safely deleted when no longer needed.

