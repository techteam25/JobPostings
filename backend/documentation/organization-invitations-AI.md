# Organization Member Invitations - Implementation Guide

## Table of Contents
1. [Overview](#overview)
2. [Why We Built This Feature](#why-we-built-this-feature)
3. [Architecture & Design Decisions](#architecture--design-decisions)
4. [Implementation Plan - Phase by Phase](#implementation-plan---phase-by-phase)
5. [Understanding Each Component](#understanding-each-component)
6. [How It Works - Step by Step](#how-it-works---step-by-step)
7. [Best Practices & Lessons Learned](#best-practices--lessons-learned)

---

## Overview

We are implementing a system that allows organization owners and administrators to invite new members to their organization with a pre-assigned role. This feature enables controlled access management and maintains a clear audit trail of who invited whom and when.

**What will be built:**
- Database schema for storing invitations
- API endpoints for sending, viewing, accepting, and canceling invitations
- Email notifications for invitations and welcome messages
- Permission checks to ensure only authorized users can send invitations
- Role hierarchy validation to prevent privilege escalation
- Background job to automatically expire old invitations
- Integration tests to ensure the system works end-to-end

---

## Why We Built This Feature

### The Problem
Currently, organization members must be added manually through direct database access or by an administrator. This creates several issues:
- **No self-service capability** - Organization owners can't add members themselves
- **No audit trail** - We can't track who added which members
- **No invitation workflow** - New members can't be invited before they have accounts
- **No role management** - Can't pre-assign roles during invitation
- **Security concerns** - No validation of who can invite whom

### The Solution
We're building an invitation system that:
1. **Enables self-service** - Owners/admins can invite members through the API
2. **Maintains audit trail** - Every invitation is recorded with who sent it and when
3. **Supports pre-registration** - Users can be invited before they create accounts
4. **Enforces role hierarchy** - Prevents users from assigning roles higher than their own
5. **Validates permissions** - Only authorized users can send invitations
6. **Provides email notifications** - Invitees receive clear instructions via email

### Why This Matters
- **Better user experience** - Smooth onboarding process for new members
- **Security** - Controlled access with proper permission checks
- **Compliance** - Audit trail for who has access to what
- **Scalability** - Organizations can manage their own members
- **Professional** - Proper invitation workflow like enterprise tools

---

## Architecture & Design Decisions

### 1. Why Store Invitations in a Separate Table?

**Decision:** Create `organizationInvitations` table instead of adding invitation fields to `organizationMembers`

**Why:**
- **Separation of concerns** - Invitations and memberships are different concepts
- **Status tracking** - Invitations have states (pending, accepted, expired, cancelled) that don't apply to members
- **Audit trail** - We need to keep invitation records even after acceptance
- **Pre-registration support** - Invitations can exist before users have accounts
- **Query performance** - Easier to query pending invitations separately from active members

**Example:**
```typescript
// Invitation record (exists before user accepts)
{
  id: 1,
  organizationId: 5,
  email: "newmember@example.com",
  role: "recruiter",
  status: "pending",
  expiresAt: "2024-01-15",
  token: "uuid-token-here"
}

// Membership record (created when user accepts)
{
  id: 1,
  userId: 42,
  organizationId: 5,
  role: "recruiter",
  isActive: true
}
```

### 2. Why Use UUID Tokens Instead of Sequential IDs?

**Decision:** Generate secure UUID tokens for invitation links

**Why:**
- **Security** - UUIDs are unpredictable and can't be guessed
- **No enumeration** - Can't iterate through invitation IDs to find valid ones
- **Stateless links** - Token contains all necessary information
- **Public access** - Token can be shared in emails without exposing internal IDs
- **Expiration support** - Token can be validated independently of database queries

**Security consideration:** If we used sequential IDs, an attacker could try `/invitations/1`, `/invitations/2`, etc. With UUIDs, they'd need to know the exact token.

### 3. Why Use Soft Delete for Cancelled Invitations?

**Decision:** Update invitation status to 'cancelled' instead of deleting the record

**Why:**
- **Audit trail** - We can see who cancelled which invitations and when
- **Analytics** - Track cancellation rates and patterns
- **Debugging** - If issues arise, we have full history
- **Compliance** - Some regulations require keeping records of access attempts
- **Consistency** - Matches pattern used for expired invitations

**Alternative considered:** Hard delete would save database space but lose valuable audit information.

### 4. Why Separate Invitation and Membership Records?

**Decision:** Keep invitation records even after creating membership records

**Why:**
- **Historical record** - Shows when and how someone joined
- **Inviter tracking** - Know who invited each member
- **Analytics** - Track invitation success rates
- **Support** - Can help users understand their membership history
- **Prevents duplicate invitations** - Can check if email was already invited

**Flow:**
1. Invitation created → `organizationInvitations` record with `status='pending'`
2. User accepts → `organizationMembers` record created + invitation `status='accepted'`
3. Both records exist permanently for audit purposes

### 5. Why Use Email Matching for Acceptance?

**Decision:** Require accepting user's email to match invitation email

**Why:**
- **Security** - Prevents token theft/abuse
- **Intent verification** - Ensures the right person is accepting
- **Account linking** - Links invitation to correct user account
- **Prevents confusion** - User can't accidentally accept wrong invitation

**Example scenario:** If Alice receives an invitation but Bob tries to accept it with his account, the system rejects it because Bob's email doesn't match Alice's invitation.

### 6. Why Implement Role Hierarchy Validation?

**Decision:** Prevent users from assigning roles equal to or higher than their own

**Why:**
- **Security** - Prevents privilege escalation attacks
- **Principle of least privilege** - Users can only grant permissions they have
- **Organizational control** - Maintains proper hierarchy
- **Prevents mistakes** - Can't accidentally give too much access

**Role hierarchy:**
```
owner (level 4) → can assign: admin, recruiter, member
admin (level 3) → can assign: recruiter, member
recruiter (level 2) → can assign: member
member (level 1) → cannot assign
```

**Example:** An admin trying to invite someone as "owner" would be rejected because admin (level 3) < owner (level 4).

### 7. Why Use Background Job for Expiration?

**Decision:** Daily cron job to expire invitations instead of checking on every request

**Why:**
- **Performance** - Don't check expiration on every invitation lookup
- **Efficiency** - Batch process expired invitations once per day
- **Consistency** - All invitations expire at same time (midnight)
- **Resource usage** - Less database load than per-request checks
- **Flexibility** - Can adjust expiration logic in one place

**Alternative considered:** Checking expiration on every token validation would work but adds overhead to every request.

### 8. Why Queue Email Sending?

**Decision:** Use BullMQ queue for sending invitation and welcome emails

**Why:**
- **Non-blocking** - API responds immediately without waiting for email
- **Reliability** - Queue retries failed emails automatically
- **Scalability** - Can process many emails concurrently
- **User experience** - Fast API responses
- **Consistency** - Matches existing email pattern in codebase

**Flow:**
1. API creates invitation → returns success immediately
2. Email job queued → processed by background worker
3. User gets fast response → email sent asynchronously

---

## Implementation Plan - Phase by Phase

### Phase 1: Foundation - Database Schema (Tasks 780-781)

**What we're building:**
- `organizationInvitations` table
- Indexes for performance

**Why this phase is first:**
- **Foundation** - Everything else depends on the database structure
- **Migration** - Need to run migration before other code can work
- **Data integrity** - Proper indexes ensure fast queries
- **Early validation** - Can verify schema before building logic

**Components:**

#### Task 780: Create `organizationInvitations` Table

**Why needed:**
- Stores all invitation data in one place
- Defines data structure for the entire feature
- Enables relationships with organizations and users

**Fields explained:**
- `id` - Primary key for referencing invitations
- `organizationId` - Links invitation to organization (foreign key)
- `email` - Email address of invitee (can invite before user exists)
- `role` - Pre-assigned role (owner, admin, recruiter, member)
- `token` - Secure UUID for invitation link
- `invitedBy` - User ID of person who sent invitation (audit trail)
- `status` - Current state (pending, accepted, expired, cancelled)
- `expiresAt` - When invitation becomes invalid (7 days)
- `acceptedAt` - When invitation was accepted (null until accepted)
- `createdAt` / `updatedAt` - Timestamps for audit

#### Task 781: Add Indexes

**Why needed:**
- **Performance** - Fast lookups by organization, token, email, status
- **Query optimization** - Database can quickly find relevant invitations
- **User experience** - Fast API responses

**Indexes explained:**
- `organization_id` - Find all invitations for an organization
- `token` - Validate invitation token (most common query)
- `email` - Check if email already invited
- `status` - Filter by status (pending, expired, etc.)

**Without indexes:** Database would scan entire table (slow)
**With indexes:** Database uses index to jump directly to relevant rows (fast)

---

### Phase 2: Core Invitation Creation (Tasks 782-787)

**What we're building:**
- Validation schemas
- Repository methods
- Service logic for creating invitations
- Permission checks
- Role hierarchy validation

**Why this phase is second:**
- **Core functionality** - This is the main feature
- **Dependencies** - Other features (accept, cancel) depend on invitations existing
- **Validation** - Need to ensure data integrity before storing

#### Task 782: Create POST Endpoint

**Why needed:**
- **API interface** - Frontend needs endpoint to send invitations
- **RESTful design** - POST is correct HTTP method for creating resources
- **Integration point** - Where frontend connects to backend

**Endpoint:** `POST /api/organizations/:orgId/invitations`

**Request body:**
```json
{
  "email": "newmember@example.com",
  "role": "recruiter"
}
```

**Why these fields:**
- `email` - Required to know who to invite
- `role` - Required to know what permissions to grant

#### Task 783: Permission Check (Owner/Admin Only)

**Why needed:**
- **Security** - Prevents unauthorized users from adding members
- **Access control** - Only privileged users can manage organization
- **Better-auth integration** - Uses existing authentication middleware patterns

**Implementation:**
- Use existing `AuthMiddleware` class patterns
- Check user's role in organization via `organizationRepository`
- Verify role is "owner" or "admin"
- Return user-friendly error messages if unauthorized

**Logic:**
1. Get requester's role in organization
2. Check if role is "owner" or "admin"
3. Reject with user-friendly error if not authorized

**Why not allow recruiters/members:**
- **Security risk** - Could invite malicious users
- **Organizational control** - Only leadership should manage membership
- **Principle of least privilege** - Lower roles don't need this permission

#### Task 784: Validate Email Not Already Member

**Why needed:**
- **Prevent duplicates** - Can't invite someone who's already a member
- **Data integrity** - One user should have one membership per organization
- **User experience** - Clear error message instead of silent failure

**Logic:**
1. Check `organizationMembers` table for email + organizationId
2. If found and `isActive=true`, reject invitation
3. If not found, allow invitation

**Why check `isActive`:**
- Inactive members might be re-invited (e.g., after leaving)
- Only active memberships block invitations

**Resend/Reinvite Behavior:**
- Check for existing invitation with same email + organization:
  - **If pending invitation exists:**
    - Update existing invitation (don't create duplicate)
    - Generate new UUID token (invalidate old invitation link)
    - Extend expiration date (reset to 7 days from now)
    - Resend invitation email with new token
  - **If cancelled invitation exists:**
    - Update existing invitation (reactivate it)
    - Change status from 'cancelled' to 'pending'
    - Generate new UUID token (old cancelled link is invalid)
    - Set new expiration date (reset to 7 days from now)
    - **Preserve `cancelledAt` and `cancelledBy` fields** (don't clear them)
    - Send invitation email with new token
    - Audit trail preserved: Can see when it was cancelled, who cancelled it, and when it was reactivated
  - **If expired invitation exists:**
    - Update existing invitation (reactivate it)
    - Change status from 'expired' to 'pending'
    - Generate new UUID token (old expired link is invalid)
    - Set new expiration date (reset to 7 days from now)
    - **Preserve `expiredAt` field** (don't clear it)
    - Send invitation email with new token
    - Audit trail preserved: Can see when it expired and when it was reactivated
  - **If accepted invitation exists:**
    - Reject invitation (user is already a member)
    - Return error: "This email is already a member of the organization"
- This ensures only one invitation record per email per organization
- Prevents duplicate invitations and keeps database clean
- Old invitation links become invalid when new invitation is sent
- Maintains complete audit trail of invitation history

#### Task 785: Validate Role Assignment Permissions

**Why needed:**
- **Security** - Prevents privilege escalation
- **Role hierarchy** - Maintains organizational structure
- **Prevents mistakes** - Can't accidentally grant too much access

**Logic:**
1. Get inviter's role level (owner=4, admin=3, recruiter=2, member=1)
2. Get requested role level
3. Reject if requested role level >= inviter's level

**Example:**
- Admin (level 3) tries to invite as Owner (level 4) → ❌ Rejected
- Admin (level 3) tries to invite as Recruiter (level 2) → ✅ Allowed
- Owner (level 4) tries to invite as Admin (level 3) → ✅ Allowed

#### Task 786: Generate Secure UUID Token

**Why needed:**
- **Security** - Unpredictable tokens prevent guessing
- **Link generation** - Token used in invitation email link
- **Stateless** - Token contains all info needed to accept

**Implementation:**
```typescript
import { randomUUID } from 'crypto';
const token = randomUUID(); // e.g., "550e8400-e29b-41d4-a716-446655440000"
```

**Why UUID v4:**
- Cryptographically random
- 128 bits of entropy (very secure)
- Standard library function (no dependencies)

**Expiration:** 7 days from creation
```typescript
const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
```

**Why 7 days:**
- Balance between security and usability
- Long enough for user to check email
- Short enough to limit exposure if token leaked

#### Task 787: Create Invitation Record

**Why needed:**
- **Persistence** - Store invitation in database
- **Status tracking** - Record starts as 'pending'
- **Audit trail** - Timestamp when invitation created

**Record created:**
```typescript
{
  organizationId: 5,
  email: "newmember@example.com",
  role: "recruiter",
  token: "uuid-here",
  invitedBy: 123,
  status: "pending",
  expiresAt: "2024-01-15T00:00:00Z",
  createdAt: "2024-01-08T00:00:00Z"
}
```

**Why status='pending':**
- Initial state before user accepts
- Can be updated to 'accepted', 'expired', or 'cancelled'
- Allows filtering pending invitations

---

### Phase 3: Email & Token Generation (Tasks 786, 788)

**What we're building:**
- HTML email template
- Email service method
- Queue integration

**Why this phase:**
- **User notification** - Invitees need to know about invitation
- **Acceptance link** - Email contains token link
- **Professional appearance** - Branded email template

#### Task 788: Send Invitation Email

**Why needed:**
- **User awareness** - Invitee needs to know they're invited
- **Acceptance mechanism** - Email contains link to accept
- **Information delivery** - Communicates organization, role, inviter

**Email contains:**
- Organization name - So invitee knows which org
- Inviter name - Personal touch, know who invited them
- Assigned role - What permissions they'll have
- Acceptance link - Click to accept (contains token)
- Expiration notice - When invitation expires

**Why HTML email:**
- **Professional** - Better appearance than plain text
- **Branding** - Can include logo and styling
- **User experience** - Clear call-to-action button
- **Consistency** - Matches other emails in system

**Email template structure:**
```html
<!-- organizationInvitation.html -->
- Logo (from login page)
- Greeting with invitee name
- Organization name
- Inviter name
- Assigned role
- Acceptance button (links to frontend, which calls API)
- Expiration notice
- Simple footer (branding footer to be added later)
```

**Template guidelines:**
- Follow existing email template patterns in codebase
- Use logo from login page (`GetInvolved_Logo.png`)
- Don't worry about detailed footer for now (will be branded later)
- Match styling of other email templates for consistency

**Why queue email:**
- **Performance** - API responds immediately
- **Reliability** - Queue retries on failure
- **Scalability** - Can send many emails concurrently
- **Rate limiting** - BullMQ handles email rate limiting automatically
- **Invitation rate limiting** - Not needed for creating invitations (handled by BullMQ for emails)

---

### Phase 4: Invitation Details Endpoint (Task 789)

**What we're building:**
- Public GET endpoint to view invitation details
- No authentication required

**Why needed:**
- **Acceptance page** - Frontend needs invitation details to show user
- **User experience** - User sees org name, role before accepting
- **Public access** - User might not be logged in yet

#### Task 789: GET /api/invitations/:token/details

**Why public (no auth):**
- **Pre-login access** - User might not have account yet
- **Token security** - Token itself provides security
- **User experience** - Can view invitation before creating account

**Returns:**
```json
{
  "organizationName": "Acme Corp",
  "role": "recruiter",
  "inviterName": "John Doe",
  "expiresAt": "2024-01-15T00:00:00Z"
}
```

**Why these fields:**
- `organizationName` - User needs to know which org
- `role` - User needs to know what they're accepting
- `inviterName` - Personal touch
- `expiresAt` - User needs to know deadline

**Security:**
- Validates token exists
- Validates token not expired
- Validates status is 'pending'
- Doesn't expose sensitive data (emails, IDs)

---

### Phase 5: Invitation Acceptance (Tasks 790-794)

**What we're building:**
- POST endpoint to accept invitation
- Validation logic
- Membership creation
- Status updates

**Why this phase:**
- **Core functionality** - Users need to accept invitations
- **Membership creation** - Creates actual organization membership
- **Status tracking** - Updates invitation to 'accepted'

#### Task 790: Create Acceptance Endpoint

**Why needed:**
- **User action** - Users need way to accept invitation
- **Authentication** - Requires logged-in user (can't accept anonymously)
- **Membership creation** - Triggers creation of organizationMembers record

**Endpoint:** `POST /api/invitations/:token/accept`

**Why POST:**
- **State change** - Accepting invitation changes system state
- **Idempotency** - Can handle duplicate requests safely
- **RESTful** - POST is correct for actions that modify state

**Token in URL:**
- Token is in the URL path: `/api/invitations/:token/accept`
- Not in query parameter for cleaner URLs
- Token is validated from path parameter

**Why requires authentication:**
- **Security** - Need to know which user is accepting
- **Email matching** - Need user's email to validate
- **Account linking** - Links invitation to user account

#### Task 791: Validate Token

**Why needed:**
- **Security** - Ensure token is valid and not tampered with
- **Expiration** - Reject expired invitations
- **Status check** - Can't accept already-accepted/cancelled invitations

**Validations:**
1. Token exists in database
2. Token not expired (`expiresAt > now()`)
3. Status is 'pending' (not already accepted/cancelled)

**Why check expiration:**
- **Security** - Old tokens shouldn't work forever
- **Data freshness** - Invitation might be outdated
- **User expectation** - Expired invitations should be rejected

**Why check status:**
- **Prevent duplicates** - Can't accept same invitation twice
- **Data integrity** - Only pending invitations can be accepted
- **User experience** - Clear error if already accepted

#### Task 792: Validate Email Match

**Why needed:**
- **Security** - Prevents token theft/abuse
- **Intent verification** - Ensures right person accepts
- **Account linking** - Links invitation to correct user

**Logic:**
1. Get accepting user's email from their account
2. Get invitation email
3. Compare (case-insensitive)
4. Reject if mismatch

**Example attack prevented:**
- Alice receives invitation to `alice@example.com`
- Bob steals the token
- Bob tries to accept with his account (`bob@example.com`)
- System rejects because emails don't match

**Why case-insensitive:**
- Email addresses are case-insensitive by RFC
- `Alice@Example.com` should match `alice@example.com`

#### Task 793: Create Membership Record

**Why needed:**
- **Actual membership** - Invitation is just an offer, membership is the reality
- **Access control** - Membership record grants actual permissions
- **Data persistence** - Stores user's role in organization

**Record created:**
```typescript
{
  userId: 42,
  organizationId: 5,
  role: "recruiter",
  isActive: true,
  createdAt: "2024-01-08T12:00:00Z"
}
```

**Why `isActive=true`:**
- New memberships start active
- Can be deactivated later if needed
- Consistent with existing pattern

**Why separate from invitation:**
- **Different purposes** - Invitation is offer, membership is reality
- **Different lifecycles** - Invitation expires, membership persists
- **Different queries** - Query members vs query invitations separately

#### Task 794: Update Invitation Status

**Why needed:**
- **Audit trail** - Record that invitation was accepted
- **Status tracking** - Mark invitation as completed
- **Prevent duplicates** - Can't accept same invitation twice

**Update:**
```typescript
{
  status: "accepted",
  acceptedAt: "2024-01-08T12:00:00Z",
  updatedAt: "2024-01-08T12:00:00Z"
}
```

**Why keep invitation record:**
- **History** - Shows when/how user joined
- **Analytics** - Track invitation success rates
- **Support** - Help users understand membership history

**Why soft update (not delete):**
- **Audit trail** - Keep record for compliance
- **Consistency** - Matches pattern for cancelled/expired
- **Analytics** - Can analyze invitation patterns

---

### Phase 6: Additional Features (Tasks 795-797)

**What we're building:**
- Welcome email
- Cancel invitation endpoint
- Background expiration job

**Why these features:**
- **User experience** - Welcome email makes users feel included
- **Management** - Admins need to cancel mistaken invitations
- **Maintenance** - Automatic cleanup of expired invitations

#### Task 795: Welcome Email

**Why needed:**
- **User experience** - Makes new members feel welcome
- **Information** - Provides next steps and organization details
- **Professional** - Shows organization cares about onboarding

**Email contains:**
- Welcome message
- Organization details
- Role information
- Next steps (e.g., "Complete your profile")
- Links to relevant pages

**Why separate from invitation email:**
- **Different purpose** - Invitation is offer, welcome is confirmation
- **Different timing** - Sent after acceptance, not before
- **Different content** - Welcome focuses on onboarding

#### Task 796: Cancel Invitation Endpoint

**Why needed:**
- **Mistake correction** - Admins can cancel wrong invitations
- **Access control** - Revoke invitations before acceptance
- **Management** - Clean up pending invitations

**Endpoint:** `DELETE /api/organizations/:orgId/invitations/:invitationId`

**Why DELETE method:**
- **RESTful** - DELETE is correct for removing resources
- **Semantic** - Clearly indicates cancellation action
- **Consistency** - Matches REST conventions

**Why soft delete:**
- **Audit trail** - Keep record of cancelled invitations
- **Analytics** - Track cancellation rates
- **Consistency** - Matches pattern for expired invitations

**Update:**
```typescript
{
  status: "cancelled",
  cancelledAt: "2024-01-08T12:00:00Z",
  cancelledBy: requesterId,
  updatedAt: "2024-01-08T12:00:00Z"
}
```

**Audit fields:**
- `cancelledAt` - Timestamp when cancelled (preserved even if reactivated)
- `cancelledBy` - User ID who cancelled (preserved even if reactivated)

**Why admin/owner only:**
- **Security** - Only privileged users can cancel
- **Access control** - Prevents abuse
- **Consistency** - Matches permission for sending invitations

#### Task 797: Background Expiration Job

**Why needed:**
- **Automatic cleanup** - Don't require manual intervention
- **Data consistency** - Mark expired invitations automatically
- **Performance** - Don't check expiration on every request

**Implementation:**
- Uses BullMQ's repeatable job pattern (same as existing temp file cleanup)
- Daily cron job scheduled via BullMQ `repeat` option
- Finds invitations where `expiresAt < now()` and `status='pending'`
- Updates status to 'expired'
- Follows existing cron job pattern in codebase

**Pattern:**
- Uses BullMQ's `repeat` option with cron syntax
- Scheduled during app initialization (in `app.ts`)
- Uses unique `jobId` to prevent duplicate jobs
- Follows same structure as `temp-file-cleanup-worker.ts`

**Implementation example:**
```typescript
// In invitation-expiration-worker.ts
export async function scheduleInvitationExpirationJob() {
  await queueService.addJob(
    QUEUE_NAMES.INVITATION_EXPIRATION_QUEUE,
    "expireInvitations",
    {},
    {
      repeat: {
        pattern: "0 6 * * *", // 6 AM UTC = midnight Central Time (approx)
      },
      jobId: "invitation-expiration", // Prevent duplicate jobs
    },
  );
}
```

**Why daily (not real-time):**
- **Performance** - Batch processing is efficient
- **Simplicity** - One job handles all expirations
- **Consistency** - All invitations expire at same time

**Why background job:**
- **Non-blocking** - Doesn't slow down API
- **Reliability** - Can retry on failure
- **Scalability** - Can process many invitations
- **Consistency** - Uses same queue system as other background jobs

**Timing:**
- Cron pattern: `"0 6 * * *"` (6:00 AM UTC ≈ midnight US Central Time)
- Scheduled during app initialization
- Can be adjusted via cron pattern if needed
- Note: Cron doesn't handle DST automatically, so uses fixed UTC time

**Why follow existing pattern:**
- **Consistency** - Matches existing codebase patterns
- **Maintainability** - Developers familiar with pattern
- **Reliability** - Uses proven BullMQ repeatable job system

**Alternative considered:** Checking expiration on every token validation would work but adds overhead to every request.

---

### Phase 7: Integration Testing (Task 799)

**What we're building:**
- End-to-end tests for invitation flows
- Tests for send, accept, and cancel flows

**Why needed:**
- **Quality assurance** - Ensures feature works correctly
- **Regression prevention** - Catches bugs before production
- **Documentation** - Tests serve as usage examples
- **Confidence** - Can refactor knowing tests will catch issues

#### Task 799: Integration Tests

**Why integration tests (not unit tests):**
- **Real-world scenarios** - Tests entire flow from API to database
- **End-to-end validation** - Ensures all components work together
- **User perspective** - Tests what users actually experience
- **Catch integration issues** - Finds problems unit tests miss

**Test scenarios:**

1. **Send invitation flow:**
   - Owner sends invitation → succeeds
   - Admin sends invitation → succeeds
   - Recruiter sends invitation → fails (permission denied)
   - Owner invites with higher role → fails (role hierarchy)
   - Invite existing member → fails (already member)

2. **Accept invitation flow:**
   - Valid token → succeeds, creates membership
   - Expired token → fails
   - Wrong email → fails
   - Already accepted → fails
   - Unauthenticated → fails

3. **Cancel invitation flow:**
   - Admin cancels → succeeds, status updated
   - Owner cancels → succeeds
   - Recruiter cancels → fails (permission denied)
   - Cancel already accepted → fails (wrong status)

**Why these scenarios:**
- **Coverage** - Tests all major paths
- **Edge cases** - Tests error conditions
- **Security** - Tests permission checks
- **User flows** - Tests actual usage patterns

**Error messages:**
- All error messages should be user-friendly
- Avoid technical jargon
- Examples:
  - ✅ "You don't have permission to send invitations"
  - ✅ "This email is already a member of the organization"
  - ❌ "ForbiddenError: User role 'recruiter' cannot send invitations"

---

## Understanding Each Component

### Database Schema

**Table: `organizationInvitations`**

```typescript
{
  id: number,                    // Primary key
  organizationId: number,        // Foreign key to organizations
  email: string,                 // Invitee email (can be pre-registration)
  role: enum,                    // owner | admin | recruiter | member
  token: string (UUID),          // Secure token for invitation link
  invitedBy: number,            // Foreign key to users (who sent it)
  status: enum,                  // pending | accepted | expired | cancelled
  expiresAt: Date,              // When invitation expires (7 days)
  acceptedAt: Date | null,      // When accepted (null until accepted)
  cancelledAt: Date | null,     // When cancelled (null until cancelled, preserved on reactivation)
  cancelledBy: number | null,   // Who cancelled it (null until cancelled, preserved on reactivation)
  expiredAt: Date | null,       // When expired (null until expired, preserved on reactivation)
  createdAt: Date,              // When invitation created
  updatedAt: Date               // Last update timestamp
}
```

**Why each field:**
- `id` - Unique identifier for referencing
- `organizationId` - Links to organization
- `email` - Who is being invited (can invite before account exists)
- `role` - What permissions they'll have
- `token` - Secure link identifier
- `invitedBy` - Audit trail of who sent invitation
- `status` - Current state of invitation
- `expiresAt` - Security (limits how long token is valid)
- `acceptedAt` - Audit trail of when accepted
- `cancelledAt` - Audit trail of when cancelled (preserved even if reactivated)
- `cancelledBy` - Audit trail of who cancelled (preserved even if reactivated)
- `expiredAt` - Audit trail of when expired (preserved even if reactivated)
- `createdAt` / `updatedAt` - Standard audit timestamps

**Audit History Preservation:**
- When invitation is cancelled: Set `cancelledAt` and `cancelledBy`, update `status` to 'cancelled'
- When invitation expires: Set `expiredAt`, update `status` to 'expired'
- When reactivating cancelled/expired invitation:
  - Change `status` back to 'pending'
  - Generate new `token`
  - Set new `expiresAt`
  - **Keep `cancelledAt`, `cancelledBy`, `expiredAt` fields unchanged** (preserves history)
  - Update `updatedAt` to current time
- This way, you can see the full history: created → cancelled → reactivated → accepted

### Role Hierarchy

**Levels:**
```
owner:    4 (highest)
admin:    3
recruiter: 2
member:   1 (lowest)
```

**Assignment rules:**
- Owner can assign: admin, recruiter, member
- Admin can assign: recruiter, member
- Recruiter can assign: member
- Member cannot assign

**Why this hierarchy:**
- **Security** - Prevents privilege escalation
- **Organizational structure** - Maintains proper hierarchy
- **Principle of least privilege** - Users can only grant permissions they have

### Status Lifecycle

```
pending → accepted (when user accepts)
pending → cancelled (when admin cancels)
pending → expired (when background job runs)
```

**Why these states:**
- `pending` - Initial state, waiting for acceptance
- `accepted` - User accepted, membership created
- `cancelled` - Admin cancelled before acceptance
- `expired` - Time limit reached, no longer valid

**Why not delete:**
- **Audit trail** - Keep history of all invitations
- **Analytics** - Track success rates
- **Support** - Help users understand history

---

## How It Works - Step by Step

### Flow 1: Sending an Invitation

1. **Frontend calls API:**
   ```
   POST /api/organizations/5/invitations
   {
     "email": "newmember@example.com",
     "role": "recruiter"
   }
   ```

2. **Backend validates:**
   - User is authenticated (via better-auth middleware)
   - User is owner/admin of organization 5
   - Email is not already an active member
   - Role is valid (recruiter < admin)
   - All validations pass ✅

3. **Backend checks for existing invitation:**
   - Query for any invitation with same email + organization
   - **If pending invitation exists:**
     - Update existing invitation (resend)
     - Generate new UUID token
     - Extend expiration (reset to 7 days)
     - Resend invitation email
   - **If cancelled invitation exists:**
     - Update existing invitation (reactivate)
     - Change status from 'cancelled' to 'pending'
     - Generate new UUID token
     - Set new expiration (reset to 7 days)
     - Send invitation email
   - **If expired invitation exists:**
     - Update existing invitation (reactivate)
     - Change status from 'expired' to 'pending'
     - Generate new UUID token
     - Set new expiration (reset to 7 days)
     - **Preserve `expiredAt`** (don't clear - maintains audit trail)
     - Send invitation email
   - **If accepted invitation exists:**
     - Reject with error: "This email is already a member"
   - **If no existing invitation:**
     - Generate UUID token
     - Set expiration (7 days from now)
     - Create `organizationInvitations` record with `status='pending'`

4. **Backend queues email:**
   - Adds job to email queue (BullMQ handles rate limiting)
   - Returns success response immediately

5. **Email worker processes:**
   - Loads email template (follows existing patterns)
   - Replaces placeholders (org name, role, token, etc.)
   - Uses logo from login page
   - Sends email to invitee

6. **Invitee receives email:**
   - Sees invitation details
   - Clicks acceptance link (points to frontend)
   - Frontend calls API to accept invitation

### Flow 2: Accepting an Invitation

1. **User clicks link in email:**
   ```
   GET /api/invitations/{token}/details
   ```

2. **Backend returns details:**
   - Validates token exists
   - Validates token not expired
   - Returns organization name, role, inviter name

3. **Frontend shows acceptance page:**
   - Displays invitation details
   - Shows "Accept" button
   - User must be logged in

4. **User clicks Accept:**
   ```
   POST /api/invitations/{token}/accept
   ```

5. **Backend validates:**
   - User is authenticated ✅
   - Token is valid ✅
   - Token not expired ✅
   - Status is 'pending' ✅
   - User's email matches invitation email ✅

6. **Backend creates membership:**
   - Creates `organizationMembers` record
   - Sets `isActive=true`
   - Assigns role from invitation

7. **Backend updates invitation:**
   - Sets `status='accepted'`
   - Sets `acceptedAt` timestamp

8. **Backend queues welcome email:**
   - Adds welcome email job to queue
   - Returns success response

9. **User is now a member:**
   - Can access organization features
   - Has assigned role permissions
   - Receives welcome email

### Flow 3: Cancelling an Invitation

1. **Admin calls API:**
   ```
   DELETE /api/organizations/5/invitations/123
   ```

2. **Backend validates:**
   - User is authenticated ✅
   - User is admin/owner ✅
   - Invitation exists ✅
   - Invitation belongs to organization ✅
   - Status is 'pending' ✅

3. **Backend updates invitation:**
   - Sets `status='cancelled'`
   - Sets `cancelledAt` timestamp (preserved even if reactivated)
   - Sets `cancelledBy` to requester ID (preserved even if reactivated)
   - Updates `updatedAt` timestamp

4. **Backend returns success:**
   - Invitation is cancelled
   - Can no longer be accepted

### Flow 4: Expiring Invitations

1. **Background job runs (daily via BullMQ cron):**
   - Scheduled via BullMQ repeatable job pattern
   - Runs at 6:00 AM UTC (≈ midnight US Central Time)
   - Queries for invitations where `expiresAt < now()` and `status='pending'`

2. **Job updates each invitation:**
   - Sets `status='expired'`
   - Sets `expiredAt` timestamp (preserved even if reactivated)
   - Updates `updatedAt` timestamp
   - Processes all expired invitations in batch

3. **Expired invitations:**
   - Can no longer be accepted
   - Still visible for audit purposes
   - Status change is logged for tracking

---

## Best Practices & Lessons Learned

### 1. Separation of Concerns

**What we did:**
- Invitation records separate from membership records
- Service layer handles business logic
- Repository layer handles database operations
- Controllers handle HTTP requests

**Why it matters:**
- **Maintainability** - Easy to change one layer without affecting others
- **Testability** - Can test each layer independently
- **Reusability** - Repository methods can be used by multiple services

### 2. Security First

**What we did:**
- UUID tokens (unpredictable)
- Email matching (prevents token theft)
- Role hierarchy (prevents privilege escalation)
- Permission checks (only authorized users)

**Why it matters:**
- **Prevents attacks** - Token guessing, privilege escalation
- **Protects data** - Only authorized access
- **Compliance** - Meets security requirements

### 3. Audit Trail

**What we did:**
- Keep invitation records permanently
- Track who invited whom and when
- Track when invitations were accepted/cancelled

**Why it matters:**
- **Compliance** - Required for some regulations
- **Debugging** - Can trace issues
- **Analytics** - Understand invitation patterns
- **Support** - Help users with questions

### 4. User Experience

**What we did:**
- Fast API responses (queue emails)
- Clear error messages
- Informative emails
- Public details endpoint (can view before login)

**Why it matters:**
- **Satisfaction** - Users have good experience
- **Adoption** - Users actually use the feature
- **Support** - Fewer support requests

### 5. Error Handling

**What we did:**
- Validate all inputs
- Return clear error messages
- Handle edge cases (expired, cancelled, etc.)

**Why it matters:**
- **User experience** - Users understand what went wrong
- **Debugging** - Easier to fix issues
- **Security** - Prevents information leakage

### 6. Testing

**What we did:**
- Integration tests for all flows
- Test error cases
- Test permission checks

**Why it matters:**
- **Quality** - Ensures feature works correctly
- **Confidence** - Can refactor safely
- **Documentation** - Tests show how to use feature

---

## Common Questions

### Q: Why not delete invitation records after acceptance?

**A:** We keep them for audit trail. This allows us to:
- Track who invited whom and when
- Analyze invitation success rates
- Help users understand their membership history
- Meet compliance requirements

### Q: Why require email matching for acceptance?

**A:** Security. If someone steals an invitation token, they can't use it unless their email matches. This prevents token theft attacks.

### Q: Why use background job for expiration instead of checking on every request?

**A:** Performance. Checking expiration on every request adds overhead. A daily batch job is more efficient and processes all expirations at once.

### Q: Why soft delete for cancelled invitations?

**A:** Audit trail. We want to keep records of cancelled invitations for analytics and compliance. The status field tracks the state without losing the record.

### Q: Can a user accept multiple invitations?

**A:** Yes, if they're invited to multiple organizations. Each invitation creates a separate membership record. However, they can't accept the same invitation twice (status check prevents this).

### Q: What happens if someone tries to accept an expired invitation?

**A:** The system rejects it with a clear error message. The invitation status is 'expired' and cannot be changed back to 'pending'. A new invitation must be sent.

---

## Summary

This implementation provides a complete invitation system that:

1. **Enables self-service** - Owners/admins can invite members
2. **Maintains security** - Proper permission checks and role hierarchy
3. **Provides audit trail** - Tracks all invitations and acceptances
4. **Offers good UX** - Fast responses, clear emails, helpful errors
5. **Scales well** - Queue-based emails, efficient database queries
6. **Is maintainable** - Clear separation of concerns, well-tested

The feature follows existing patterns in the codebase (queue system, email templates, repository pattern) while adding new functionality that organizations need to manage their members effectively.

---

## Files Created and Modified

This section documents all files that were created or modified during the implementation of the organization invitations feature.

### Created Files

#### Database & Migrations
- **`backend/src/db/migrations/0017_gorgeous_tony_stark.sql`**
  - Database migration file that creates the `organization_invitations` table with all required columns, indexes, and foreign key constraints.

- **`backend/src/db/migrations/meta/0017_snapshot.json`**
  - Drizzle ORM migration metadata snapshot for the invitation table schema.

#### Routes
- **`backend/src/routes/invitation.routes.ts`**
  - New route file for invitation-specific endpoints that don't require organization ID in the URL path.
  - Contains routes for getting invitation details (`GET /api/invitations/:token/details`) and accepting invitations (`POST /api/invitations/:token/accept`).
  - Includes Swagger/OpenAPI documentation for both endpoints.

#### Email Templates
- **`backend/src/email-templates/organizationInvitation.html`**
  - HTML email template for sending organization invitations.
  - Includes placeholders for organization name, inviter name, role, acceptance link, and expiration date.
  - Follows existing email template patterns with responsive design.

- **`backend/src/email-templates/organizationWelcome.html`**
  - HTML email template sent to new members after they accept an invitation.
  - Includes welcome message, organization name, assigned role, and dashboard link.

#### Workers
- **`backend/src/workers/invitation-expiration-worker.ts`**
  - Background worker for automatically expiring pending invitations that have passed their expiration date.
  - Implements BullMQ worker pattern with daily cron job scheduled for midnight US Central Time (6:00 AM UTC).
  - Updates invitation status to 'expired' and sets `expiredAt` timestamp.

#### Tests
- **`backend/tests/integration/controllers/organization-invitations.controller.test.ts`**
  - Comprehensive integration test suite with 21 test cases covering all invitation flows.
  - Tests sending invitations (owner, admin, recruiter scenarios), getting details, accepting invitations, and canceling invitations.
  - Includes permission checks, role hierarchy validation, and error handling scenarios.
  - All tests passing (21/21).

#### Documentation
- **`backend/documentation/organization-invitations-AI.md`**
  - Comprehensive implementation guide documenting the feature design, rationale, and step-by-step implementation.
  - Includes architecture decisions, implementation phases, component explanations, and best practices.

#### Configuration
- **`.cursorrules`**
  - Workflow rules file documenting the "Engage" keyword convention and AI suffix naming conventions.
  - Ensures consistent AI workflow patterns across sessions.

### Modified Files

#### Database Schema
- **`backend/src/db/schema/organizations.ts`**
  - Added `organizationInvitations` table schema definition using Drizzle ORM.
  - Includes all fields: id, organizationId, email, role, token, invitedBy, status, expiresAt, acceptedAt, cancelledAt, cancelledBy, expiredAt, createdAt, updatedAt.
  - Added relations for organization, inviter, and canceller.
  - Added indexes for organizationId, email, token, and status.

#### Validations
- **`backend/src/validations/organization.validation.ts`**
  - Added validation schemas for invitation operations:
    - `createOrganizationInvitationSchema` - Validates invitation creation requests
    - `acceptOrganizationInvitationSchema` - Validates invitation acceptance requests
    - `getOrganizationInvitationDetailsSchema` - Validates invitation details requests
    - `cancelOrganizationInvitationSchema` - Validates invitation cancellation requests
  - Added corresponding TypeScript types for all schemas.

- **`backend/src/validations/job.validation.ts`**
  - Fixed Zod v4 compatibility issue with `.partial()` and refinements.
  - Restructured schemas to separate base schemas (without refinements) from schemas with refinements.
  - This fix was necessary to unblock all integration tests.

#### Repository Layer
- **`backend/src/repositories/organization.repository.ts`**
  - Added 8 new repository methods for invitation management:
    - `findInvitationByToken()` - Find invitation by UUID token
    - `findInvitationById()` - Find invitation by ID
    - `findInvitationByEmailAndOrg()` - Find existing invitation for email/organization
    - `createInvitation()` - Create new invitation record
    - `updateInvitation()` - Update invitation (for resend/reactivation)
    - `updateInvitationStatus()` - Update invitation status with audit fields
    - `isEmailActiveMember()` - Check if email is already an active member
    - `createMember()` - Create organization member record with idempotency

#### Service Layer
- **`backend/src/services/organization.service.ts`**
  - Added 4 new service methods implementing business logic:
    - `sendInvitation()` - Orchestrates invitation sending with validation, token generation, and email queuing
    - `getInvitationDetails()` - Retrieves invitation details for public viewing
    - `acceptInvitation()` - Handles invitation acceptance, membership creation, and welcome email
    - `cancelInvitation()` - Handles invitation cancellation with permission checks
  - Added helper methods:
    - `getRoleLevel()` - Maps roles to hierarchy levels
    - `canAssignRole()` - Validates role assignment permissions

#### Controller Layer
- **`backend/src/controllers/organization.controller.ts`**
  - Added 4 new controller methods handling HTTP requests:
    - `sendInvitationAI` - Handles POST requests for sending invitations
    - `getInvitationDetailsAI` - Handles GET requests for invitation details
    - `acceptInvitationAI` - Handles POST requests for accepting invitations
    - `cancelInvitationAI` - Handles DELETE requests for canceling invitations
  - All methods include authentication checks and error handling.

#### Routes
- **`backend/src/routes/organization.routes.ts`**
  - Added POST route for `/api/organizations/:organizationId/invitations` (send invitation)
  - Added DELETE route for `/api/organizations/:organizationId/invitations/:invitationId` (cancel invitation)
  - Added authentication, permission, and validation middleware.
  - Added Swagger/OpenAPI documentation for both routes.

- **`backend/src/routes/index.ts`**
  - Mounted the new `invitationRoutes` router under `/invitations` path.

#### Infrastructure
- **`backend/src/infrastructure/email.service.ts`**
  - Added `sendOrganizationInvitation()` method to send invitation emails.
  - Added `sendOrganizationWelcome()` method to send welcome emails to new members.
  - Both methods load HTML templates, replace placeholders, and send emails via nodemailer.

- **`backend/src/infrastructure/queue.service.ts`**
  - Added `INVITATION_EXPIRATION_QUEUE` to the `QUEUE_NAMES` constant.
  - Ensured the queue is created during service initialization.

- **`backend/src/workers/send-email-worker.ts`**
  - Added case handlers for `"sendOrganizationInvitation"` and `"sendOrganizationWelcome"` email job types.
  - Routes email jobs to the appropriate email service methods.

#### Application Initialization
- **`backend/src/app.ts`**
  - Imported and initialized `initializeInvitationExpirationWorker()` function.
  - Imported and scheduled `scheduleInvitationExpirationJob()` for daily cron execution.
  - Ensures invitation expiration background job runs on server startup.

#### Configuration
- **`backend/.gitignore`**
  - Added `tempScripts/` directory to ignore list for temporary verification scripts.

---

## Summary of Changes

**Total Files:** 24 files
- **Created:** 9 new files
- **Modified:** 15 existing files

**Lines of Code:**
- **Insertions:** ~7,410 lines
- **Deletions:** ~10 lines

**Key Components:**
- 1 database table with migration
- 4 API endpoints with full CRUD operations
- 2 email templates
- 1 background worker
- 21 integration tests (all passing)
- Complete Swagger/OpenAPI documentation
