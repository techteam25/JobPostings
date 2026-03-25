# User Story: Qualifications Page

## User Stories

1. **[SP: 3]** As a developer, I want the database schema updated with `jobTitle` and `description` fields on `work_experiences` and a new `user_skills` junction table, and the `updateProfile` repository method refactored into composable single-entity methods, so that the backend can support enhanced work experience entries, user-to-skill associations, and individual qualification CRUD.

2. **[SP: 3]** As a job seeker, I want to view my qualifications on a tabbed page with Education, Work Experience, Certifications, and Skills sections showing entry counts per tab, so that I can see what I've added and what still needs attention.

3. **[SP: 5]** As a job seeker, I want to add, edit, and delete my education history (school, program, major, dates, graduation status) through modal forms, so that employers can see my academic background.

4. **[SP: 5]** As a job seeker, I want to add, edit, and delete my work experience entries (company, job title, description, dates, current status) through modal forms, so that employers can evaluate my professional history.

5. **[SP: 3]** As a job seeker, I want to add and remove certifications by selecting from a shared list or creating new ones, so that my professional credentials are visible on my profile.

6. **[SP: 5]** As a job seeker, I want to add and remove skills using an autocomplete that searches existing skills or lets me create new ones, so that my skillset is accurately represented and can be matched with job requirements.

---

## Context and Problem Statement

The job board application allows job seekers to create profiles, but the Qualifications section — which covers education, work experience, certifications, and skills — is currently a placeholder ("under construction"). Without this page, users cannot showcase their qualifications, making their profiles incomplete and less competitive when applying for jobs.

The backend database already has tables for `educations`, `work_experiences`, and `certifications` (with a many-to-many junction via `userCertifications`). A shared `skills` master table exists for job listings but is not yet linked to user profiles. The existing `PUT /users/me/profile` endpoint handles batch upserts for qualifications via a monolithic `updateProfile` repository method that inlines all upsert logic for educations, work experiences, and certifications in a single transaction. This method lacks individual CRUD (add one, edit one, delete one), has no skills support, and its inline approach makes the logic hard to reuse from individual endpoints.

Profile completion already factors in education, work experience, and certifications (via `GET /users/me/status`), but without a UI to manage them, users have no way to improve their completion status.

---

## Goals and Objectives

**Goal:** Enable job seekers to fully manage their qualifications (education, work experience, certifications, skills) through an intuitive tabbed interface.

**Objectives:**
- Users can perform full CRUD on education and work experience entries individually
- Users can add/remove certifications and skills from shared master lists
- Each section shows a count indicator on its tab, encouraging profile completion
- Work experience entries include job title and description (schema migration)
- Users can link to the shared `skills` table, enabling future job-to-skill matching
- All changes reflect in the profile completion status check

---

## Scope and Requirements

### Functional Requirements
- Tabbed page with four sections: Education, Work Experience, Certifications, Skills
- Each tab label shows entry count (e.g., "Education (2)")
- Add/Edit forms open in shadcn Dialog modals
- Delete actions require a confirmation dialog
- Education form fields: school name, program (enum dropdown), major, start date, end date, graduated checkbox
- Work experience form fields: company name, job title, description (optional, using existing `DynamicRichTextEditor` Tiptap component), start date, end date (hidden when "current" is checked), current checkbox
- Certifications: displayed as tags/badges, add via autocomplete from master list (can create new), remove with confirmation
- Skills: displayed as tags, add via autocomplete from shared `skills` table (can create new), remove with confirmation. Maximum 30 skills per user.
- Education and Work Experience forms use TanStack Form with array fields (`pushValue`, `removeValue`, `swapValues`, `moveValue`) for managing multiple entries
- Breadcrumb navigation at the top of all profile sub-pages: "Back to Profile" | \<current page name\> (e.g., "Qualifications")
- Empty states shown when a section has no entries
- Toast notifications for success/error on all mutations
- Existing `GET /users/me` response already includes education, work experience, and certifications — leverage this for initial data load

### Non-Functional Requirements
- **Performance:** Qualification data is loaded with the user profile (already cached 600s). Mutations invalidate the `users/me` cache.
- **Accessibility:** All form inputs must have proper labels. Dialogs must trap focus and be keyboard-navigable. Tab navigation must work with arrow keys.
- **Responsive:** Page must work on mobile (tabs may stack or become a dropdown on small screens).
- **Validation:** Client-side Zod schemas must mirror backend validation constraints. Server-side validation is the source of truth.
- **Security:** All endpoints require authentication. Users can only manage their own qualifications (existing auth middleware).

### Out of Scope
- Employer-facing public profile view (separate story)
- Profile completion percentage/progress bar (current boolean is kept)
- Bulk import/export of qualifications
- Resume parsing to auto-fill qualifications
- Profile edit page (`/me/profile/edit`) — remains under construction
- Preferences page (`/me/profile/preferences`) — remains under construction

---

## Resolved Questions

| Question | Decision |
|----------|----------|
| Should the skills autocomplete have a limit on how many skills a user can add? | Yes. Maximum 30 skills per user. |
| Should work experience `description` use rich text (Tiptap) or plain textarea? | Use Tiptap via the existing `DynamicRichTextEditor` component. |
| Should newly created skills/certifications require admin approval before appearing in the master list? | No. New entries are immediately available in the master list. |

## Open Questions

_None at this time._

---

## Acceptance Criteria

### Story 1 — Schema Migration + `updateProfile` Refactor
- Given the `work_experiences` table, when the migration runs, then a `job_title` (varchar 100, not null) and `description` (text, nullable) column exist.
- Given the database, when the migration runs, then a `user_skills` junction table exists with `user_profile_id` (FK → `user_profile.id`, cascade delete) and `skill_id` (FK → `skills.id`, cascade delete) columns and a composite unique constraint.
- Given existing `work_experiences` rows, when the migration runs, then `job_title` has a sensible default (e.g., empty string or migration sets a placeholder) so existing rows are not broken.
- Given the Drizzle schema, when the migration is generated, then `skillsRelations` includes a `userSkills` relation and `userProfileRelations` includes a `skills` relation.
- Given the refactored `updateProfile` method, when called with the same payload as before, then it produces the same result (existing integration tests pass without modification).
- Given the new individual repository methods (`addEducation`, `updateEducation`, `deleteEducation`, etc.), when called directly, then they correctly add, update, or delete a single qualification entry.
- Given the `ProfileRepositoryPort` interface, when the refactor is complete, then the new individual methods are declared on the port so they can be used by the service layer and mocked in tests.

### Story 2 — Qualifications Page Shell
- Given an authenticated job seeker, when they navigate to `/me/profile/qualifications`, then they see a breadcrumb showing "Back to Profile" | "Qualifications" at the top of the page.
- Given any profile sub-page (qualifications, job preferences, ready to work), when the user clicks "Back to Profile" in the breadcrumb, then they are navigated back to `/me/profile`.
- Given an authenticated job seeker, when they navigate to `/me/profile/qualifications`, then they see a tabbed interface with Education, Work Experience, Certifications, and Skills tabs.
- Given a user with 2 education entries and 0 skills, when the page loads, then the Education tab label shows "(2)" and the Skills tab label shows "(0)".
- Given a user with no entries in any section, when they select a tab, then an appropriate empty state message is displayed with a call-to-action to add entries.
- Given the page is loaded on a mobile device, when the user interacts with tabs, then the tab navigation is usable and does not overflow.

### Story 3 — Education Management
- Given the Education tab, when the user clicks "Add Education", then a dialog opens with fields: school name, program (dropdown), major, start date, end date, graduated checkbox.
- Given the add education dialog, when the user fills all required fields and submits, then the education entry appears in the list and a success toast is shown.
- Given an education entry with `graduated` checked, when submitting, then `endDate` is required (validation error if missing).
- Given an education entry in the list, when the user clicks edit, then a dialog opens pre-filled with that entry's data.
- Given an education entry, when the user clicks delete and confirms, then the entry is removed and a success toast is shown.
- Given invalid input (e.g., empty school name), when the user submits, then validation errors are shown inline.

### Story 4 — Work Experience Management
- Given the Work Experience tab, when the user clicks "Add Work Experience", then a dialog opens with fields: company name, job title, description, start date, end date, current checkbox.
- Given `current` is checked, when the form renders, then the end date field is hidden/disabled.
- Given valid work experience data, when submitted, then the entry appears in the list with company name, job title, and date range displayed.
- Given a work experience entry, when the user clicks edit, then the dialog opens pre-filled with that entry's data.
- Given a work experience entry, when the user clicks delete and confirms, then the entry is removed.
- Given `current` is unchecked and no end date is provided, when submitting, then a validation error is shown.

### Story 5 — Certifications Management
- Given the Certifications tab, when the user clicks "Add Certification", then a dialog opens with an autocomplete input that searches the master certifications table.
- Given the user types a partial name, when results appear, then matching certifications from the master table are shown.
- Given the user selects a certification, when they confirm, then it is linked to their profile and displayed as a badge/tag.
- Given a certification not in the master table, when the user types a new name, then they can create it (which adds to master table and links to their profile).
- Given a certification badge, when the user clicks remove and confirms, then the link is removed (master table entry remains).

### Story 6 — Skills Management
- Given the Skills tab, when the user clicks "Add Skills", then a dialog opens with an autocomplete input that searches the shared `skills` table.
- Given the user types a partial skill name, when results appear, then matching skills are shown.
- Given the user selects a skill, when they confirm, then it is linked to their profile via the `user_skills` junction table.
- Given a skill not in the master table, when the user types a new name, then they can create it (which adds to master table and links to their profile).
- Given a skill tag, when the user clicks remove and confirms, then the `user_skills` link is removed (master table entry remains).
- Given the user adds a skill already on their profile, when they attempt to add it again, then the duplicate is prevented with feedback.
- Given a user with 30 skills already linked, when they attempt to add another skill, then the action is prevented with a message indicating the maximum has been reached.

---

## Module Design

### 1. Database Schema Migration + `updateProfile` Refactor
**Responsibility:** Extend `work_experiences` with `job_title` and `description`; create `user_skills` junction table; update Drizzle relations; refactor the monolithic `updateProfile` repository method into composable single-entity methods.
- Interface: Drizzle migration files, schema type exports, new repository methods (`addEducation`, `updateEducation`, `deleteEducation`, `addWorkExperience`, `updateWorkExperience`, `deleteWorkExperience`, `linkCertification`, `unlinkCertification`, `linkSkill`, `unlinkSkill`)
- Key collaborators: `work_experiences` table, `skills` table, `user_profile` table, `ProfileRepository`, `ProfileRepositoryPort`
- Test surface: Migration runs without error; columns/tables exist; constraints enforced; `updateProfile` still passes existing tests after refactor; new individual methods work correctly
- **Refactor approach:** Extract the inline education upsert, work experience upsert, and certification upsert logic from `updateProfile` into individual repository methods. `updateProfile` then delegates to these methods, preserving its external behavior. Add new `delete` methods (not currently possible via batch upsert). Add `linkSkill`/`unlinkSkill` methods for the new `user_skills` junction table.

### 2. User Profile Module — Qualification Routes (extends existing module)
**Responsibility:** Individual CRUD API routes for education, work experience, certifications, and skills. Extends the existing `profile.service.ts`, `profile.controller.ts`, and `profile.routes.ts`. The repository methods are created in Module 1 above.
- Interface:
  - `POST /users/me/educations` — Add single education
  - `PUT /users/me/educations/:id` — Update single education
  - `DELETE /users/me/educations/:id` — Delete single education
  - `POST /users/me/work-experiences` — Add single work experience
  - `PUT /users/me/work-experiences/:id` — Update single work experience
  - `DELETE /users/me/work-experiences/:id` — Delete single work experience
  - `POST /users/me/certifications` — Link certification to profile
  - `DELETE /users/me/certifications/:id` — Unlink certification from profile
  - `POST /users/me/skills` — Link skill to profile
  - `DELETE /users/me/skills/:id` — Unlink skill from profile
  - `GET /skills?q=...` — Autocomplete search for skills (public/authenticated)
  - `GET /certifications?q=...` — Autocomplete search for certifications (authenticated)
- Key collaborators: ProfileRepository (individual methods from Module 1), ProfileService, ProfileController, validation schemas
- Test surface: All CRUD operations return correct responses; ownership enforcement; validation errors; cache invalidation

### 3. Frontend — Qualifications Page Shell
**Responsibility:** Tabbed page layout with breadcrumb navigation, section indicators, empty states, and data fetching.
- Interface: `/me/profile/qualifications` page component; renders tab content components; reusable `ProfileBreadcrumb` component for all profile sub-pages
- Key collaborators: Server action for profile data, shadcn Tabs, section count computation, Next.js Link for breadcrumb navigation
- Test surface: Breadcrumb renders with correct label and links to `/me/profile`; tabs render; counts reflect data; empty states shown; responsive layout

### 4. Frontend — Education Section
**Responsibility:** List education entries, add/edit/delete via dialogs.
- Interface: `EducationSection` component (list + add button), `EducationFormDialog` (add/edit), delete confirmation
- Key collaborators: TanStack Form (array fields for multi-entry management), React Query mutations, Zod validation schema, shadcn Dialog components
- Test surface: Form submission creates entry; edit pre-fills; delete removes; validation errors shown; array field operations (push, remove, swap, move) work correctly

### 5. Frontend — Work Experience Section
**Responsibility:** List work experience entries, add/edit/delete via dialogs.
- Interface: `WorkExperienceSection` component, `WorkExperienceFormDialog` (uses `DynamicRichTextEditor` for description), delete confirmation
- Key collaborators: TanStack Form (array fields for multi-entry management), React Query mutations, Zod validation schema, conditional endDate logic, `DynamicRichTextEditor`
- Test surface: Current checkbox hides endDate; form submission works; edit pre-fills; delete removes; rich text description renders correctly

### 6. Frontend — Certifications Section
**Responsibility:** Display certifications as badges, add from master list via autocomplete dialog, remove with confirmation.
- Interface: `CertificationsSection` component, `AddCertificationDialog` (with autocomplete)
- Key collaborators: React Query for autocomplete search + mutations, certifications master table
- Test surface: Autocomplete filters results; add links to profile; remove unlinks; create new works

### 7. Frontend — Skills Section
**Responsibility:** Display skills as tags, add from master list via autocomplete dialog, remove with confirmation.
- Interface: `SkillsSection` component, `AddSkillsDialog` (with autocomplete)
- Key collaborators: React Query for autocomplete search + mutations, skills master table
- Test surface: Autocomplete filters results; add links to profile; remove unlinks; duplicate prevention; create new works

---

## Testing Decisions

| Module | Why it's worth testing | Test layer | Data setup notes |
|--------|----------------------|------------|-----------------|
| Schema migration | Ensures data integrity, constraints work | Integration | Run migration on test DB, verify columns/tables/constraints |
| Education CRUD endpoints | Core data flow, validation enforcement | Integration | Seed user + profile via seedBuilders |
| Work Experience CRUD endpoints | New fields (jobTitle, description), conditional validation | Integration | Seed user + profile via seedBuilders |
| Certifications endpoints | Many-to-many junction logic, dedup | Integration | Seed user + profile + master certifications |
| Skills endpoints | New junction table, autocomplete search, dedup | Integration | Seed user + profile + master skills |
| Qualifications Page Shell | Tab rendering, counts, empty states | E2E (component) | Mock API responses |
| Education Form Dialog | Form validation, conditional fields, submit flow | Unit (component) | Mock mutation handlers |
| Work Experience Form Dialog | Current checkbox hides endDate, validation | Unit (component) | Mock mutation handlers |
| Certifications Autocomplete | Search + select + create new flow | Unit (component) | Mock search results |
| Skills Autocomplete | Search + select + create new + duplicate prevention | Unit (component) | Mock search results |
| Full qualification management flow | End-to-end user journey across all tabs | E2E | Full test DB with seeded data |

**Static analysis:**
- TypeScript strict mode (already enforced project-wide)
- ESLint with no-restricted-imports for module boundaries (already configured)

**Unit tests:**
- Frontend form validation schemas (Zod)
- Frontend component rendering and interaction (React Testing Library)

**Integration tests:**
- All backend CRUD endpoints via supertest against Express app with test DB
- Follow existing pattern: `tests/integration/` with `seedBuilders` and `cleanAll()` before each test

**E2E tests:**
- Critical user journey: Navigate to qualifications page → add education → add work experience → add certification → add skill → verify counts update → delete an entry → verify removed

---

## Task Breakdown

### Story 1: Schema Migration + `updateProfile` Refactor [SP: 3]
| # | Task | Estimate |
|---|------|----------|
| 1.1 | Add `job_title` (varchar 100, not null, default '') and `description` (text, nullable) columns to `work_experiences` Drizzle schema and generate migration | 2h |
| 1.2 | Create `user_skills` junction table schema (`user_profile_id`, `skill_id`, composite unique, cascade deletes) with Drizzle relations and generate migration | 2h |
| 1.3 | Update existing validation schemas (`workExperiences.validation.ts`) to include `jobTitle` and `description` | 1h |
| 1.4 | Extract individual repository methods from `updateProfile`: `addEducation`, `updateEducation`, `deleteEducation`, `addWorkExperience`, `updateWorkExperience`, `deleteWorkExperience`, `linkCertification`, `unlinkCertification`, `linkSkill`, `unlinkSkill`. Each method handles a single entity operation. | 4h |
| 1.5 | Refactor `updateProfile` to delegate to the extracted methods. Include `jobTitle` and `description` in work experience upsert. Verify all existing `updateProfile` tests still pass. | 2h |
| 1.6 | Update `ProfileRepositoryPort` interface with the new individual method signatures | 1h |
| 1.7 | Update frontend types (`lib/types.ts`) to include new work experience fields and user skills | 1h |
| 1.8 | Write integration tests: verify migration, constraints, relation queries, and individual repository methods | 3h |

### Story 2: Qualifications Page Shell [SP: 3]
| # | Task | Estimate |
|---|------|----------|
| 2.1 | Create reusable `ProfileBreadcrumb` component ("Back to Profile" | \<current page\>) and add it to the qualifications page layout. Design it for reuse across other profile sub-pages (preferences, ready to work). | 2h |
| 2.2 | Replace placeholder with shadcn Tabs component (4 tabs) with proper routing/state | 3h |
| 2.3 | Implement section count indicators on tab labels from user profile data | 2h |
| 2.4 | Create empty state components for each section with add CTA | 2h |
| 2.5 | Add server action to fetch user profile with qualifications for page load | 1h |
| 2.6 | Ensure responsive tab layout for mobile devices | 1h |
| 2.7 | Write component tests for breadcrumb, tab rendering, counts, and empty states | 2h |

### Story 3: Education Management [SP: 5]
| # | Task | Estimate |
|---|------|----------|
| 3.1 | Add backend service methods with Result type pattern for education CRUD (uses repository methods from Story 1) | 2h |
| 3.2 | Add backend controller handlers and routes for `POST/PUT/DELETE /users/me/educations` with validation middleware | 2h |
| 3.3 | Write backend integration tests for education CRUD endpoints | 3h |
| 3.4 | Create `EducationCard` component displaying entry details | 2h |
| 3.5 | Create `EducationFormDialog` with TanStack Form + Zod (add/edit modes, graduated → endDate required logic) | 3h |
| 3.6 | Create delete confirmation dialog and wire up React Query mutations with cache invalidation | 2h |
| 3.7 | Assemble `EducationSection` component (list + add button + dialogs) | 1h |
| 3.8 | Write frontend component tests for education form, list, and delete flow | 3h |

### Story 4: Work Experience Management [SP: 5]
| # | Task | Estimate |
|---|------|----------|
| 4.1 | Add backend service methods with Result type pattern for work experience CRUD (uses repository methods from Story 1) | 2h |
| 4.2 | Add backend controller handlers and routes for `POST/PUT/DELETE /users/me/work-experiences` with validation middleware | 2h |
| 4.3 | Write backend integration tests for work experience CRUD endpoints | 3h |
| 4.4 | Create `WorkExperienceCard` component with job title, company, description, date range | 2h |
| 4.5 | Create `WorkExperienceFormDialog` with conditional endDate visibility (hidden when "current" checked) | 3h |
| 4.6 | Create delete confirmation dialog and wire up React Query mutations | 2h |
| 4.7 | Assemble `WorkExperienceSection` component | 1h |
| 4.8 | Write frontend component tests for work experience form, list, and conditional logic | 3h |

### Story 5: Certifications Management [SP: 3]
| # | Task | Estimate |
|---|------|----------|
| 5.1 | Add `searchCertifications` repository method (link/unlink already extracted in Story 1) | 1h |
| 5.2 | Add backend service methods for certification link/unlink/search (uses repository methods from Story 1) | 1h |
| 5.3 | Add backend controller handlers and routes (`POST/DELETE /users/me/certifications`, `GET /certifications?q=`) | 2h |
| 5.4 | Write backend integration tests for certification endpoints | 2h |
| 5.5 | Create `CertificationsSection` with badge/tag display and add/remove actions | 2h |
| 5.6 | Create `AddCertificationDialog` with autocomplete search and "create new" option | 3h |
| 5.7 | Write frontend component tests for certifications section and autocomplete | 2h |

### Story 6: Skills Management [SP: 5]
| # | Task | Estimate |
|---|------|----------|
| 6.1 | Add `searchSkills` repository method (link/unlink already extracted in Story 1) | 1h |
| 6.2 | Add backend service methods for skill link/unlink/search with duplicate prevention (uses repository methods from Story 1) | 1h |
| 6.3 | Add backend controller handlers and routes (`POST/DELETE /users/me/skills`, `GET /skills?q=`) | 2h |
| 6.4 | Write backend integration tests for skills endpoints | 2h |
| 6.5 | Create `SkillsSection` with tag display and add/remove actions | 2h |
| 6.6 | Create `AddSkillsDialog` with autocomplete search, "create new" option, and duplicate prevention feedback | 3h |
| 6.7 | Write frontend component tests for skills section and autocomplete | 2h |
| 6.8 | Write E2E test: full qualification management flow across all tabs | 4h |
