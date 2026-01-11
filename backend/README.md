# Job Board Application - Backend

A comprehensive Job Board backend API built with Express.js, TypeScript, and modern backend technologies.

## Tech Stack

### Core Technologies
- **Runtime**: Bun v1.2.21
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MySQL 9.4.0
- **ORM**: Drizzle ORM
- **Queue System**: BullMQ
- **Search Engine**: TypeSense
- **Validation**: Zod
- **Authentication**: Better-Auth
- **API Documentation**: @asteasolutions/zod-to-openapi

### Infrastructure
- **Cache**: Redis (separate instance)
- **Queue Backend**: Redis (separate instance)
- **Rate Limiting**: Redis (separate instance)
- **File Storage**: Firebase Storage
- **Email Service**: Nodemailer
- **File Upload**: Multer

### Testing
- **Test Framework**: Vitest
- **Coverage**: @vitest/coverage-v8

## Prerequisites

Before setting up the project, ensure you have the following installed:

- [Bun](https://bun.sh) (v1.2.21 or higher)
- [Docker](https://www.docker.com/) and Docker Compose
- [Git](https://git-scm.com/)
- A Firebase project (for file storage)
- SMTP credentials (for email service)
- OAuth credentials (Google, LinkedIn - optional)

## Project Setup

Follow these steps in order to set up the project:

### 1. Clone the Repository

```bash
# Clone the repository
git clone <repository-url>

# Navigate to the backend directory
cd jobPostings/backend
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Configure Environment Variables

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Update the `.env` file with your configuration:

```typescript
# Server Configuration
PORT=5500
HOST=localhost
NODE_ENV=development
SERVER_URL=http://localhost:5500
FRONTEND_URL=http://localhost:3000

# Database Configuration (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=jobpostings
DB_USER=your_db_user
DB_PASSWORD=your_secure_password
MYSQL_ROOT_PASSWORD=your_root_password

# JWT Secrets (min 32 characters)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-minimum-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-token-change-this-in-production-min-32

# Redis Configuration
REDIS_CACHE_PWD=your-redis-cache-password
REDIS_QUEUE_PWD=your-redis-queue-password
REDIS_RATE_LIMITER_PWD=your-redis-rate-limiter-password

REDIS_CACHE_URL=redis://:your-redis-cache-password@localhost:6369
REDIS_QUEUE_URL=redis://:your-redis-queue-password@localhost:6359
REDIS_RATE_LIMITER_URL=redis://:your-redis-rate-limiter-password@localhost:6389

# Logging
LOG_LEVEL=info

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
EMAIL_FROM=noreply@yourdomain.com

# Better Auth
BETTER_AUTH_SECRET=your-better-auth-secret-min-32-characters

# OAuth Credentials (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_API_KEY=your-firebase-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id
FIREBASE_MEASUREMENT_ID=your-measurement-id

# TypeSense Configuration
TYPESENSE_API_KEY=your-typesense-api-key
TYPESENSE_HOST=localhost
TYPESENSE_PORT=8108
TYPESENSE_PROTOCOL=http
```

**Important Notes:**
- JWT secrets must be at least 32 characters
- Redis URLs must include the password in the format: `redis://:password@host:port`
- For production, use strong, randomly generated passwords
- Never commit your `.env` file to version control

### 4. Understanding Environment Variable Validation

The application uses **Zod** for environment variable validation in `src/config/env.ts`. This ensures all required variables are properly configured before the application starts.

#### How env.ts Works

The `env.ts` file defines a schema that validates all environment variables:

```typescript
// src/config/env.ts
import { z } from "zod";
import "dotenv/config";

// Define the schema for environment variables
const envSchema = z.object({
  // Server configuration
  SERVER_URL: z.url(),
  FRONTEND_URL: z.url(),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z
    .string()
    .default("5500")
    .transform((val) => parseInt(val, 10)),
  HOST: z.string().default("localhost"),

  // Database configuration
  DB_HOST: z.string().min(1, "Database host is required"),
  DB_PORT: z
    .string()
    .default("3306")
    .transform((val) => parseInt(val, 10)),
  DB_NAME: z.string().min(1, "Database name is required"),
  DB_USER: z.string().min(1, "Database user is required"),
  DB_PASSWORD: z.string().min(1, "Database password is required"),

  // JWT Secrets - minimum 32 characters required
  JWT_SECRET: z.string().min(32, "JWT secret must be at least 32 characters"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT REFRESH secret must be at least 32 characters"),

  // Redis configuration
  REDIS_CACHE_URL: z.url({ error: "REDIS_CACHE_URL must be a valid URL" }),
  REDIS_QUEUE_URL: z.url({ error: "REDIS_QUEUE_URL must be a valid URL" }),
  REDIS_RATE_LIMITER_URL: z.url({ error: "REDIS_RATE_LIMITER_URL must be a valid URL" }),

  // Email service configuration
  SMTP_HOST: z.string().min(1, "SMTP host is required"),
  SMTP_PORT: z.coerce.number("SMTP port must be a number"),
  SMTP_SECURE: z.coerce.boolean().default(true),
  SMTP_USER: z.string().min(1, "SMTP user is required"),
  SMTP_PASS: z.string().min(1, "SMTP password is required"),
  EMAIL_FROM: z.email("EMAIL_FROM must be a valid email address"),

  // OAuth and authentication
  BETTER_AUTH_SECRET: z.string(),
  GOOGLE_CLIENT_ID: z.string().min(1, "Google Client ID is required"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "Google Client Secret is required"),
  LINKEDIN_CLIENT_ID: z.string().min(1, "LinkedIn Client ID is required"),
  LINKEDIN_CLIENT_SECRET: z.string().min(1, "LinkedIn Client Secret is required"),

  // Firebase Configuration
  FIREBASE_PROJECT_ID: z.string().min(1, "Firebase Project Id is required"),
  FIREBASE_API_KEY: z.string().min(1, "Firebase API Key is required"),
  FIREBASE_AUTH_DOMAIN: z.string().min(1, "Firebase Auth domain is required"),
  FIREBASE_STORAGE_BUCKET: z.string().min(1, "Firebase storage bucket is required"),
  FIREBASE_MESSAGING_SENDER_ID: z.string().min(1, "Firebase Messaging Sender Id is required"),
  FIREBASE_APP_ID: z.string().min(1, "Firebase App Id is required"),
  FIREBASE_MEASUREMENT_ID: z.string().min(1, "Firebase Measurement Id is required"),

  // TypeSense Configuration
  TYPESENSE_API_KEY: z.string().min(1, "Typesense API Key is required"),
  TYPESENSE_HOST: z.string().min(1, "Typesense Host is required"),
  TYPESENSE_PORT: z.coerce.number("Typesense Port must be a number"),
  TYPESENSE_PROTOCOL: z.enum(["http", "https"]).default("http"),

  // Logger Configuration
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
});

// Type inference from the schema
export type Env = z.infer<typeof envSchema>;

// Validate and parse environment variables
function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Environment validation failed:");
      error.issues.forEach((err) => {
        console.error(`  - ${err.path.join(".")}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
}

// Export the validated environment variables
export const env = validateEnv();
```

#### What Happens During Validation

1. **Automatic Loading**: `dotenv/config` automatically loads your `.env` file
2. **Schema Validation**: Zod validates each variable against the schema
3. **Type Transformation**: Strings are converted to appropriate types (numbers, booleans, URLs)
4. **Error Reporting**: If validation fails, you'll see clear error messages showing which variables are missing or invalid
5. **Type Safety**: The exported `env` object has full TypeScript type safety

#### Adding New Environment Variables

When you need to add new environment variables:

1. **Add to `.env` file**:
```bash
# .env
NEW_SERVICE_API_KEY=your-api-key-here
NEW_SERVICE_URL=https://api.newservice.com
```

2. **Add to `.env.example`**:
```bash
# .env.example
NEW_SERVICE_API_KEY=your-new-service-api-key
NEW_SERVICE_URL=https://api.newservice.com
```

3. **Add to Zod schema in `src/config/env.ts`**:
```typescript
const envSchema = z.object({
  // ... existing variables ...
  
  // New Service Configuration
  NEW_SERVICE_API_KEY: z.string().min(1, "New Service API Key is required"),
  NEW_SERVICE_URL: z.url("New Service URL must be a valid URL"),
});
```

4. **Use in your code** (with full type safety):
```typescript
import { env } from "@/config/env";

// TypeScript knows the type automatically
const apiKey = env.NEW_SERVICE_API_KEY; // string
const serviceUrl = env.NEW_SERVICE_URL;  // string
```

#### Common Validation Patterns

```typescript
// Required string
FIELD_NAME: z.string().min(1, "Field is required"),

// Optional string with default
FIELD_NAME: z.string().default("default-value"),

// URL validation
API_URL: z.url("Must be a valid URL"),

// Email validation
EMAIL: z.email("Must be a valid email"),

// Number with transformation
PORT: z.coerce.number("Must be a number"),

// Enum (specific values only)
ENVIRONMENT: z.enum(["development", "production", "test"]),

// Boolean with coercion
IS_ENABLED: z.coerce.boolean().default(false),

// Minimum length requirement
SECRET: z.string().min(32, "Must be at least 32 characters"),
```

#### Validation Error Example

If you start the app with missing or invalid variables, you'll see:

```bash
❌ Environment validation failed:
  - JWT_SECRET: JWT secret must be at least 32 characters
  - REDIS_CACHE_URL: REDIS_CACHE_URL must be a valid URL
  - SMTP_HOST: SMTP host is required
```

The application will exit immediately, preventing runtime errors.

#### Benefits of This Approach

✅ **Type Safety**: Full TypeScript support throughout your application
✅ **Early Detection**: Catch configuration errors at startup, not runtime
✅ **Clear Errors**: Know exactly what's missing or misconfigured
✅ **Self-Documenting**: Schema serves as documentation for required variables
✅ **Validation**: Ensures URLs are valid, numbers are numbers, etc.
✅ **Defaults**: Can specify default values for optional variables
✅ **Refactoring Safety**: TypeScript will catch if you reference non-existent variables

### 5. Start Docker Services

Start all required services (MySQL, Redis instances, TypeSense):

```bash
bun run services:up
```

This command starts:
- MySQL database (port 3306)
- Redis cache (port 6369)
- Redis queue (port 6359)
- Redis rate limiter (port 6389)
- TypeSense search engine (port 8108)

**Verify services are running:**

```bash
docker ps
```

You should see 5 containers running.

### 6. Run Database Migrations

Apply database schema migrations:

```bash
bun run db:migrate
```

This creates all necessary tables and relationships in your MySQL database.

### 7. Seed the Database (Optional)

Populate the database with initial data:

```bash
bun run db:seed
```

This creates sample users, organizations, and job postings for development.

### 8. Run the Application

Start the development server:

```bash
bun run dev
```

The server will start on `http://localhost:5500` (or your configured PORT).

### 9. Verify Setup

Check if the application is running:

```bash
curl http://localhost:5500/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "Server is running",
  "timestamp": "2024-01-11T18:00:00.000Z",
  "environment": "development",
  "database": {
    "connected": true,
    "host": "localhost",
    "port": 3306,
    "name": "jobpostings"
  },
  "version": "1.0.0"
}
```

Visit API documentation: `http://localhost:5500/docs`

## Available Scripts

### Development
```bash
bun run dev          # Start development server with hot reload
bun run start        # Start production server
bun run build        # Build for production
bun run build:tsc    # TypeScript build
```

### Database
```bash
bun run db:generate  # Generate migrations from schema changes
bun run db:migrate   # Run pending migrations
bun run db:push      # Push schema directly to database (dev only)
bun run db:studio    # Open Drizzle Studio (database GUI)
bun run db:drop      # Drop database schema
bun run db:seed      # Seed database with sample data
```

### Testing
```bash
bun run test              # Run all tests
bun run test:watch        # Run tests in watch mode
bun run test:ui           # Run tests with UI
bun run test:coverage     # Run tests with coverage report
bun run test:integration  # Run integration tests only
bun run test:unit         # Run unit tests only
```

### Docker Services
```bash
bun run services:up     # Start all Docker services
bun run services:down   # Stop all Docker services
bun run services:purge  # Stop and remove all services, volumes, and images
```

### Code Quality
```bash
bun run type-check  # Check TypeScript types
bun run clean       # Remove build artifacts
```

## Git Workflow

Follow this workflow for contributing to the project:

### 1. Starting Work on a New Feature

```bash
# Ensure you're on the main branch
git switch main

# Get the latest changes
git pull origin main

# Create a new feature branch
# Format: <your-name>/<story-number>-descriptive-label
git switch -c john-doe/STORY-123-add-user-authentication
```

### 2. Working on Your Feature

```typescript
// Make your changes
// Write tests
// Ensure tests pass
bun run test

// Check types
bun run type-check
```

### 3. Committing Changes

```bash
# Stage your changes
git add .

# Commit with a descriptive message
git commit -m "feat(auth): implement user authentication with JWT"

# Follow conventional commits:
# feat: new feature
# fix: bug fix
# docs: documentation changes
# style: formatting changes
# refactor: code refactoring
# test: adding tests
# chore: maintenance tasks
```

### 4. Pushing Changes

```bash
# Push your branch to remote
git push origin john-doe/STORY-123-add-user-authentication
```

### 5. Creating a Pull Request

1. Go to the repository on GitHub
2. Click "New Pull Request"
3. Select your branch
4. Fill in the PR template:
   - Description of changes
   - Related story/issue number
   - Testing steps
   - Screenshots (if applicable)
5. Request reviews from team members
6. Address review feedback
7. Merge once approved

### 6. After Merge

```bash
# Switch back to main
git switch main

# Pull the latest changes
git pull origin main

# Delete your local feature branch
git branch -d john-doe/STORY-123-add-user-authentication
```

## Project Structure

```
backend/
├── src/
│   ├── app.ts                    # Express app configuration
│   ├── server.ts                 # Server entry point
│   ├── config/                   # Configuration files
│   │   ├── env.ts               # Environment validation
│   │   ├── firebase.ts          # Firebase config
│   │   └── typesense-client.ts  # TypeSense config
│   ├── controllers/             # Route controllers
│   ├── db/                      # Database layer
│   │   ├── schema/              # Drizzle schemas
│   │   ├── migrations/          # Database migrations
│   │   └── connection.ts        # DB connection
│   ├── infrastructure/          # External services
│   │   ├── cache.service.ts
│   │   ├── email.service.ts
│   │   ├── queue.service.ts
│   │   └── typesense.service.ts
│   ├── middleware/              # Express middleware
│   ├── repositories/            # Data access layer
│   ├── routes/                  # API routes
│   ├── services/                # Business logic
│   ├── validations/             # Zod schemas
│   ├── workers/                 # Background workers
│   ├── utils/                   # Utility functions
│   └── types/                   # TypeScript types
├── tests/                       # Test files
│   ├── integration/
│   ├── unit/
│   └── utils/
├── compose.yml                  # Docker services
├── drizzle.config.ts           # Drizzle ORM config
└── package.json
```

## API Documentation

Once the server is running, access the interactive API documentation:

**Swagger UI**: http://localhost:5500/docs

The API documentation is auto-generated from Zod schemas and includes:
- All available endpoints
- Request/response schemas
- Authentication requirements
- Example requests

## Architecture Overview

### Layered Architecture

```
Controllers → Services → Repositories → Database
     ↓
Validators (Zod)
     ↓
Error Handlers
```

### Background Jobs

The application uses BullMQ for background job processing:

- **Email Queue**: Handles email notifications
- **TypeSense Queue**: Indexes job postings for search
- **File Upload Queue**: Processes file uploads to Firebase
- **Job Alert Queue**: Processes job alert matching
- **Cleanup Queue**: Removes temporary files

See [workers/README.md](./src/workers/README.md) for details on creating workers.

### Caching Strategy

- **Redis Cache**: API responses, frequently accessed data
- **TypeSense**: Job search results with fuzzy matching
- **In-Memory**: Rate limiting counters

### Database Design

See [db/README.md](./src/db/README.md) for detailed database documentation including:
- Schema definitions
- Relationships
- Indexes
- Migrations

## Troubleshooting

### Docker Services Not Starting

```bash
# Check service logs
docker logs jobpostings-mysql
docker logs redis-cache
docker logs typesense

# Restart services
bun run services:down
bun run services:up
```

### Database Connection Issues

```bash
# Verify MySQL is running
docker ps | grep mysql

# Check database exists
docker exec -it jobpostings-mysql mysql -u root -p
> SHOW DATABASES;
> USE jobpostings;
```

### Port Already in Use

```bash
# Find process using port
lsof -i :5500

# Kill process
kill -9 <PID>
```

### TypeSense Connection Issues

```bash
# Check TypeSense is running
curl http://localhost:8108/health

# Restart TypeSense
docker restart typesense
```

## Production Deployment

### Environment Considerations

1. **Environment Variables**
   - Use secure, randomly generated secrets
   - Enable SSL for database connections
   - Use production Redis instances

2. **Database**
   - Enable connection pooling
   - Set up automated backups
   - Configure proper indexes

3. **Security**
   - Enable rate limiting
   - Configure CORS properly
   - Use HTTPS
   - Set secure headers with Helmet

4. **Monitoring**
   - Set up application logging
   - Monitor queue health
   - Track API response times
   - Set up error tracking (e.g., Sentry)

### Build and Deploy

```bash
# Build for production
bun run build

# Start production server
NODE_ENV=production bun run start
```

## Contributing

1. Follow the Git workflow described above
2. Write tests for new features
3. Update documentation
4. Follow TypeScript best practices
5. Use conventional commits
6. Request code reviews

## Support

For questions or issues:
1. Check existing documentation
2. Search closed issues
3. Open a new issue with detailed information

## License

[MIT License](./LICENSE)
