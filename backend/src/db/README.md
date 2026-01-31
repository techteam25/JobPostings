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
- `jobsDetails.ts`: Job postings and applications

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
- **Data Helpers**: Functions to create test users, jobsDetails, and applications

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

## Creating Database Schemas

This section provides comprehensive examples for creating database schemas with Drizzle ORM.

### Basic Table Schema

Create a simple table with basic columns:

```typescript
// src/db/schema/categories.ts
import {
  mysqlTable,
  varchar,
  timestamp,
  int,
  text,
  boolean,
} from "drizzle-orm/mysql-core";

/**
 * Categories table schema for organizing content
 */
export const categories = mysqlTable("categories", {
  // Primary key with auto-increment
  id: int("id").primaryKey().autoincrement(),
  
  // Required varchar field
  name: varchar("name", { length: 100 }).notNull(),
  
  // Optional text field
  description: text("description"),
  
  // Boolean with default value
  isActive: boolean("is_active").default(true).notNull(),
  
  // Timestamps with automatic defaults
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
```

### Table with Enums and Constraints

Use MySQL enums and add constraints:

```typescript
// src/db/schema/jobs.ts
import {
  mysqlTable,
  varchar,
  timestamp,
  mysqlEnum,
  text,
  boolean,
  int,
  check,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const jobsDetails = mysqlTable(
  "job_details",
  {
    id: int("id").primaryKey().autoincrement(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    
    // Enum field with specific allowed values
    jobType: mysqlEnum("job_type", [
      "full-time",
      "part-time",
      "contract",
      "volunteer",
      "internship",
    ]).notNull(),
    
    compensationType: mysqlEnum("compensation_type", [
      "paid",
      "missionary",
      "volunteer",
      "stipend",
    ]).notNull(),
    
    isRemote: boolean("is_remote").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    applicationDeadline: timestamp("application_deadline"),
    employerId: int("employer_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  // Table constraints defined in callback
  (table) => [
    // Check constraint example
    check(
      "active_jobs_must_have_deadline",
      sql`(${table.isActive} = false OR ${table.applicationDeadline} IS NOT NULL)`
    ),
  ]
);
```

### Table with JSON Fields

Store structured data in JSON columns:

```typescript
// src/db/schema/users.ts
import {
  mysqlTable,
  varchar,
  int,
  json,
  timestamp,
} from "drizzle-orm/mysql-core";

// Define TypeScript type for JSON data
type FileMetadata = {
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
};

export const userProfile = mysqlTable("user_profile", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull().unique(),
  
  // JSON field with type safety
  fileMetadata: json("file_metadata").$type<FileMetadata[]>(),
  
  // JSON for flexible data
  preferences: json("preferences").$type<Record<string, unknown>>(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
```

## Creating Indexes

Indexes improve query performance. Add them to frequently queried columns.

### Single Column Indexes

```typescript
// src/db/schema/jobs.ts
import { mysqlTable, varchar, int, index } from "drizzle-orm/mysql-core";

export const jobsDetails = mysqlTable(
  "job_details",
  {
    id: int("id").primaryKey().autoincrement(),
    title: varchar("title", { length: 255 }).notNull(),
    city: varchar("city", { length: 255 }).notNull(),
    state: varchar("state", { length: 50 }),
    jobType: varchar("job_type", { length: 50 }).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
  },
  (table) => [
    // Single column indexes
    index("city_idx").on(table.city),
    index("state_idx").on(table.state),
    index("job_type_idx").on(table.jobType),
    index("is_active_idx").on(table.isActive),
  ]
);
```

### Composite Indexes

Index multiple columns together for better query performance:

```typescript
// src/db/schema/job-applications.ts
import { mysqlTable, int, timestamp, index } from "drizzle-orm/mysql-core";

export const jobApplications = mysqlTable(
  "job_applications",
  {
    id: int("id").primaryKey().autoincrement(),
    jobId: int("job_id").notNull(),
    applicantId: int("applicant_id").notNull(),
    status: varchar("status", { length: 50 }).notNull(),
    appliedAt: timestamp("applied_at").defaultNow().notNull(),
  },
  (table) => [
    // Single column indexes
    index("job_idx").on(table.jobId),
    index("applicant_idx").on(table.applicantId),
    
    // Composite indexes for common query patterns
    index("user_applications_idx").on(table.applicantId, table.appliedAt),
    index("job_applications_idx").on(table.jobId, table.appliedAt),
    index("user_job_lookup_idx").on(table.jobId, table.applicantId),
  ]
);
```

### Unique Indexes

Ensure uniqueness across single or multiple columns:

```typescript
// src/db/schema/saved-jobs.ts
import { mysqlTable, int, unique, index } from "drizzle-orm/mysql-core";

export const savedJobs = mysqlTable(
  "saved_jobs",
  {
    id: int("id").primaryKey().autoincrement(),
    userId: int("user_id").notNull(),
    jobId: int("job_id").notNull(),
  },
  (table) => [
    // Regular indexes for queries
    index("user_idx").on(table.userId),
    index("job_idx").on(table.jobId),
    
    // Unique constraint - user can only save a job once
    unique("unique_user_job").on(table.userId, table.jobId),
  ]
);
```

## Creating Foreign Key Relationships

Foreign keys maintain referential integrity between tables.

### Basic Foreign Key with References

```typescript
// src/db/schema/user-profile.ts
import { mysqlTable, int, text, timestamp } from "drizzle-orm/mysql-core";
import { user } from "./users";

export const userProfile = mysqlTable("user_profile", {
  id: int("id").primaryKey().autoincrement(),
  
  // Foreign key using references() - simple syntax
  userId: int("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### Foreign Key with Explicit Configuration

```typescript
// src/db/schema/jobs.ts
import { mysqlTable, int, varchar, foreignKey } from "drizzle-orm/mysql-core";
import { organizations } from "./organizations";

export const jobsDetails = mysqlTable(
  "job_details",
  {
    id: int("id").primaryKey().autoincrement(),
    title: varchar("title", { length: 255 }).notNull(),
    employerId: int("employer_id").notNull(),
  },
  (table) => [
    // Explicit foreign key with custom name and cascade behavior
    foreignKey({
      columns: [table.employerId],
      foreignColumns: [organizations.id],
      name: "fk_job_employer",
    }).onDelete("cascade"),
  ]
);
```

### Multiple Foreign Keys

```typescript
// src/db/schema/application-notes.ts
import { mysqlTable, int, text, foreignKey } from "drizzle-orm/mysql-core";
import { jobApplications } from "./job-applications";
import { user } from "./users";

export const applicationNotes = mysqlTable(
  "application_notes",
  {
    id: int("id").primaryKey().autoincrement(),
    applicationId: int("application_id").notNull(),
    userId: int("user_id").notNull(),
    note: text("note").notNull(),
  },
  (table) => [
    // Multiple foreign keys in one table
    foreignKey({
      columns: [table.applicationId],
      foreignColumns: [jobApplications.id],
      name: "fk_note_application",
    }).onDelete("cascade"),
    
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "fk_note_user",
    }).onDelete("cascade"),
  ]
);
```

### Foreign Key Cascade Options

```typescript
// Different cascade behaviors

// CASCADE - delete child records when parent is deleted
.references(() => parent.id, { onDelete: "cascade" })

// SET NULL - set foreign key to NULL when parent is deleted
.references(() => parent.id, { onDelete: "set null" })

// RESTRICT - prevent deletion if child records exist
.references(() => parent.id, { onDelete: "restrict" })

// NO ACTION - similar to RESTRICT (default)
.references(() => parent.id, { onDelete: "no action" })
```

## Creating Relations

Relations define how tables are connected and enable easy querying across tables.

### One-to-One Relationship (1:1)

A user has one profile:

```typescript
// src/db/schema/users.ts
import { mysqlTable, int, varchar, timestamp } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { userProfile } from "./user-profile";

// User table
export const user = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Define one-to-one relation
export const userRelations = relations(user, ({ one }) => ({
  // User has one profile
  profile: one(userProfile, {
    fields: [user.id],
    references: [userProfile.userId],
  }),
}));
```

```typescript
// src/db/schema/user-profile.ts
import { mysqlTable, int, text } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { user } from "./users";

// User profile table
export const userProfile = mysqlTable("user_profile", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id")
    .notNull()
    .unique() // Ensures 1:1 relationship
    .references(() => user.id, { onDelete: "cascade" }),
  bio: text("bio"),
});

// Define inverse relation
export const userProfileRelations = relations(userProfile, ({ one }) => ({
  // Profile belongs to one user
  user: one(user, {
    fields: [userProfile.userId],
    references: [user.id],
  }),
}));
```

### One-to-Many Relationship (1:m)

An organization has many jobs:

```typescript
// src/db/schema/organizations.ts
import { mysqlTable, int, varchar } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { jobsDetails } from "./jobs";

// Parent table (one)
export const organizations = mysqlTable("organizations", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull(),
});

// Define one-to-many relation
export const organizationRelations = relations(organizations, ({ many }) => ({
  // Organization has many jobs
  jobs: many(jobsDetails),
}));
```

```typescript
// src/db/schema/jobs.ts
import { mysqlTable, int, varchar } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { organizations } from "./organizations";

// Child table (many)
export const jobsDetails = mysqlTable("job_details", {
  id: int("id").primaryKey().autoincrement(),
  title: varchar("title", { length: 255 }).notNull(),
  employerId: int("employer_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
});

// Define inverse relation
export const jobsRelations = relations(jobsDetails, ({ one }) => ({
  // Job belongs to one organization
  employer: one(organizations, {
    fields: [jobsDetails.employerId],
    references: [organizations.id],
  }),
}));
```

### Many-to-Many Relationship (m:m)

Jobs have many skills, skills belong to many jobs (using junction table):

```typescript
// src/db/schema/skills.ts
import { mysqlTable, int, varchar } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { jobSkills } from "./job-skills";

// First entity table
export const skills = mysqlTable("skills", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull().unique(),
});

// Define relation through junction table
export const skillsRelations = relations(skills, ({ many }) => ({
  // Skills can be linked to many jobs
  jobSkills: many(jobSkills),
}));
```

```typescript
// src/db/schema/jobs.ts
import { mysqlTable, int, varchar } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { jobSkills } from "./job-skills";

// Second entity table
export const jobsDetails = mysqlTable("job_details", {
  id: int("id").primaryKey().autoincrement(),
  title: varchar("title", { length: 255 }).notNull(),
});

// Define relation through junction table
export const jobsRelations = relations(jobsDetails, ({ many }) => ({
  // Jobs can have many skills
  skills: many(jobSkills),
}));
```

```typescript
// src/db/schema/job-skills.ts
import { mysqlTable, int, boolean } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { jobsDetails } from "./jobs";
import { skills } from "./skills";

// Junction table (linking table)
export const jobSkills = mysqlTable("job_skills", {
  id: int("id").primaryKey().autoincrement(),
  
  // Foreign keys to both tables
  jobId: int("job_id")
    .notNull()
    .references(() => jobsDetails.id, { onDelete: "cascade" }),
  skillId: int("skill_id")
    .notNull()
    .references(() => skills.id, { onDelete: "cascade" }),
  
  // Additional attributes for the relationship
  isRequired: boolean("is_required").default(false).notNull(),
});

// Define relations to both sides
export const jobSkillsRelations = relations(jobSkills, ({ one }) => ({
  job: one(jobsDetails, {
    fields: [jobSkills.jobId],
    references: [jobsDetails.id],
  }),
  skill: one(skills, {
    fields: [jobSkills.skillId],
    references: [skills.id],
  }),
}));
```

### Complex Relations Example

A job has applications, each application has notes:

```typescript
// src/db/schema/jobs.ts
import { mysqlTable, int, varchar } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { jobApplications } from "./job-applications";

export const jobsDetails = mysqlTable("job_details", {
  id: int("id").primaryKey().autoincrement(),
  title: varchar("title", { length: 255 }).notNull(),
});

export const jobsRelations = relations(jobsDetails, ({ many }) => ({
  applications: many(jobApplications),
}));
```

```typescript
// src/db/schema/job-applications.ts
import { mysqlTable, int, varchar } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { jobsDetails } from "./jobs";
import { user } from "./users";
import { applicationNotes } from "./application-notes";

export const jobApplications = mysqlTable("job_applications", {
  id: int("id").primaryKey().autoincrement(),
  jobId: int("job_id").notNull(),
  applicantId: int("applicant_id").notNull(),
  status: varchar("status", { length: 50 }).notNull(),
});

export const jobApplicationsRelations = relations(
  jobApplications,
  ({ one, many }) => ({
    // Many-to-one: application belongs to a job
    job: one(jobsDetails, {
      fields: [jobApplications.jobId],
      references: [jobsDetails.id],
    }),
    // Many-to-one: application belongs to a user
    applicant: one(user, {
      fields: [jobApplications.applicantId],
      references: [user.id],
    }),
    // One-to-many: application has many notes
    notes: many(applicationNotes),
  })
);
```

```typescript
// src/db/schema/application-notes.ts
import { mysqlTable, int, text } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { jobApplications } from "./job-applications";

export const applicationNotes = mysqlTable("application_notes", {
  id: int("id").primaryKey().autoincrement(),
  applicationId: int("application_id").notNull(),
  note: text("note").notNull(),
});

export const applicationNotesRelations = relations(
  applicationNotes,
  ({ one }) => ({
    application: one(jobApplications, {
      fields: [applicationNotes.applicationId],
      references: [jobApplications.id],
    }),
  })
);
```

## Using Relations in Queries

Once relations are defined, use them to fetch related data:

```typescript
// src/repositories/job.repository.ts
import { db } from "@/db/connection";
import { jobsDetails } from "@/db/schema/jobs";

export class JobRepository {
  // Fetch job with employer and applications
  async getJobWithRelations(jobId: number) {
    return await db.query.jobsDetails.findFirst({
      where: (jobs, { eq }) => eq(jobs.id, jobId),
      with: {
        employer: true, // Include employer (1:1)
        applications: {  // Include applications (1:m)
          with: {
            applicant: true, // Include applicant for each application
            notes: true,     // Include notes for each application
          },
        },
        skills: {         // Include skills through junction table (m:m)
          with: {
            skill: true,  // Include actual skill data
          },
        },
      },
    });
  }
}
```

## Best Practices

1. **Always use indexes** on foreign key columns for better performance
2. **Use cascade deletes** carefully - understand data dependencies
3. **Define relations** for easier querying and type safety
4. **Use enums** for fields with fixed values
5. **Add constraints** to maintain data integrity
6. **Use unique constraints** to prevent duplicates
7. **Timestamp fields** should use `defaultNow()` and `onUpdateNow()`
8. **JSON fields** should have TypeScript types for safety
9. **Document your schemas** with comments
10. **Test migrations** in development before production

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
