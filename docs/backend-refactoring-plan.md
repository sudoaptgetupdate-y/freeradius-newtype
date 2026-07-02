# Backend Refactoring Plan

## 🎯 Objective
Refactor the monolithic Fastify/Node.js backend into a clean **3-Layer Architecture** (Routes, Thin Controllers, Fat Services) while extracting Zod validation schemas. This will align the backend with the Code Syntax Standards, improving maintainability, testability, and code readability without altering any existing API functionality.

## 📊 Current State Assessment
- **Controllers are Fat:** Files like `users.controller.ts` (27KB+), `groups.controller.ts` (23KB+), and `profiles.controller.ts` contain massive amounts of business logic, Drizzle ORM queries, and inline Zod schemas.
- **Services are Missing:** Domain-specific services (e.g., `users.service.ts`, `groups.service.ts`) do not exist. Only external integration services (`mikrotik`, `telegram`, `radius-coa`) are currently utilizing the `services/` folder.
- **Inline Validation:** Zod schemas are tightly coupled inside controller files or route files, making them hard to reuse (e.g., for bulk operations or internal function calls).

## 🏗️ Proposed Architecture

We will adopt a strict Separation of Concerns:

1. **`src/routes/*.routes.ts`**
   - Bind HTTP methods and paths to Controllers.
   - Attach Zod validation schemas to the Fastify route configuration for automatic validation.
2. **`src/schemas/validation/*.schema.ts` (NEW)**
   - Extract all Zod schemas (Body, Query, Params) from controllers into this dedicated directory.
   - Example: `users.schema.ts` containing `createUserSchema`, `updateUserSchema`, etc.
3. **`src/controllers/*.controller.ts` (Thin)**
   - **Role:** Handle HTTP Transport layer.
   - Extract parameters (`request.body`, `request.query`, `request.user`).
   - Call the appropriate function in the Service layer.
   - Return standard HTTP responses (`reply.send()`) and handle top-level errors.
   - **No Drizzle ORM `db` queries allowed here.**
4. **`src/services/*.service.ts` (Fat / NEW)**
   - **Role:** Business Logic & Database operations.
   - Create new files like `users.service.ts`, `groups.service.ts`, `tenants.service.ts`.
   - All `db.select()`, `db.insert()`, and `db.transaction()` operations go here.
   - **Must enforce Multi-tenancy** (`where(eq(users.tenantId, tenantId))`).

## ⚠️ CRITICAL RULES: ZERO FUNCTIONALITY CHANGE
1. **API Contracts Must Remain Identical:** Do not change HTTP methods, endpoint URLs, request payload structures, or response JSON formats. The Frontend must not break.
2. **Multi-Tenancy Integrity:** When moving DB queries to Services, you MUST ensure that `tenantId` is passed down and strictly enforced in every `where` clause to prevent Cross-Tenant Data Leakage.
3. **Soft Delete Preservation:** Maintain all `deleted_at = null` and `deleted_at = now()` logic.
4. **Error Handling:** Maintain the existing HTTP Status codes (400, 401, 403, 404, 500).

## 🛡️ Security & RBAC Enforcement
During the extraction of logic from Controllers to Services, we must systematically audit and enforce the following security rules:
1. **Multi-Tenancy Isolation (Cross-Tenant Leakage):** Every single database query in the Service layer MUST accept and apply `tenantId` in the `where` clause unless executed by a `super_admin`.
2. **Strict Zod Validation:** Ensure all extracted Zod schemas use `.strict()` or `.strip()` to prevent mass-assignment vulnerabilities or NoSQL/SQL injection via unexpected JSON keys.
3. **Role-Based Access Control (RBAC):** Controller routes must explicitly verify `req.user.role`. Services must not blindly trust inputs; they must validate if the user's role has permission to perform the action (e.g., only `super_admin` can create a new Tenant).
4. **Error Sanitization:** Ensure the Global Error Handler catches all Service layer exceptions and returns standardized HTTP errors (e.g., `500 Internal Server Error`) without leaking sensitive database stack traces.

## 🚀 Execution Phases

### Phase 1: Preparation & Schema Extraction
- Create `src/schemas/validation/` directory.
- Extract Zod schemas from `users`, `groups`, `profiles`, `tenants`, `admins`, and `nas` controllers.
- Update `routes/` to import Zod schemas from the new directory.

### Phase 2: Refactor Core Domain (Users & Groups)
- Create `src/services/users.service.ts` and `groups.service.ts`.
- Move DB logic from `users.controller.ts` and `groups.controller.ts` to services.
- Refactor Controllers to be thin wrappers calling the services.

### Phase 3: Refactor Profiles, NAS & Tenants
- Create `src/services/profiles.service.ts`, `nas.service.ts`, and `tenants.service.ts`.
- Migrate business logic from controllers to services.

### Phase 4: Refactor Settings, Vouchers & Portal
- Create `src/services/settings.service.ts`, `vouchers.service.ts`, and `portal.service.ts`.
- Migrate logic from remaining controllers.
- Run comprehensive build checks and test the backend locally.

---
**Note:** This plan provides a systematic approach. The agent should execute these phases sequentially, verifying TypeScript compilation (`npx tsc --noEmit`) after each phase.
