# Database Setup

This project uses **Drizzle ORM** with **MySQL** as the database system.

## Prerequisites

1. **MySQL Server** (version 8.0 or higher recommended)
2. **Environment Variables** configured (see `.env.example`)

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure your database settings:

```bash
cp .env.example .env
```

Required environment variables:
- `DB_HOST`: MySQL server host (default: localhost)
- `DB_PORT`: MySQL server port (default: 3306)
- `DB_NAME`: Database name
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password

### Database Schema

The database schema is defined in the `schema/` directory:
- `users.ts`: User accounts and authentication
- `jobs.ts`: Job postings and applications

## Database Commands

### Generate Migrations
```bash
bun run db:generate
```

### Push Schema to Database
```bash
bun run db:push
```

### Run Migrations
```bash
bun run db:migrate
```

### Open Drizzle Studio
```bash
bun run db:studio
```

### Drop Database Schema
```bash
bun run db:drop
```

## Initial Setup

1. **Create Database**:
   ```sql
   CREATE DATABASE jobpostings;
   CREATE DATABASE jobpostings_test; -- For testing
   ```

2. **Push Schema**:
   ```bash
   bun run db:push
   ```

3. **Verify Connection**:
   ```bash
   bun run dev
   ```
   Check the health endpoint: `GET /health`

## Database Structure

### Users Table
- User authentication and profile information
- Roles: user, employer, admin
- Email verification and account status

### Jobs Table
- Job postings with detailed information
- Salary ranges and job types
- Location and remote work options
- Required skills (JSON format)

### Job Applications Table
- Application tracking
- Status management
- Cover letters and resume links
- Review notes and timestamps

## Testing

The project includes test database utilities:

- **Test Database**: Uses `{DB_NAME}_test` suffix
- **Test Utilities**: Located in `tests/utils/testDatabase.ts`
- **Data Helpers**: Functions to create test users, jobs, and applications

### Running Tests with Database
```bash
# Make sure test database exists
CREATE DATABASE jobpostings_test;

# Run tests
bun run test
```

## Production Considerations

1. **Connection Pooling**: Configured with reasonable defaults
2. **SSL Support**: Enable with `DB_SSL=true`
3. **Connection Limits**: Adjust `DB_CONNECTION_LIMIT` based on your needs
4. **Indexes**: Optimized for common queries (location, job type, etc.)
5. **Foreign Keys**: Proper relationships between tables

## Troubleshooting

### Connection Issues
- Verify MySQL server is running
- Check firewall settings
- Ensure user has proper permissions

### Migration Issues
- Run `bun run db:drop` and recreate if needed
- Check for conflicting schema changes

### Test Database Issues
- Ensure test database exists
- Verify test user has permissions on test database
