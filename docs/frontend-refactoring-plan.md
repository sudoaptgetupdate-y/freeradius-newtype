# Frontend Componentization & Refactoring Plan

The objective of this plan is to refactor massive monolithic frontend page components (some over 1,300 lines) into a cleaner, modular structure using Custom Hooks and separate Dialog components. This adheres to **Section 5.1** of the Code Syntax Standards (Componentization & Extract Custom Hooks).

## 📊 Priority List (By Complexity & Line Count)

1. **`users.tsx`** (1,324 lines) - ✅ COMPLETED
2. **`vouchers.tsx`** (854 lines) - ✅ COMPLETED (Includes Footer Text Feature & Auto-Print)
3. **`profiles.tsx`** (842 lines) - ✅ COMPLETED
4. **`groups.tsx`** (661 lines) - ✅ COMPLETED
5. **`nas.tsx`** (512 lines) - ✅ COMPLETED
6. **`tenants.tsx`** (506 lines) - ✅ COMPLETED
7. **`portal-settings.tsx`** (492 lines) - ✅ COMPLETED
8. **`admins.tsx`** (460 lines) - ✅ COMPLETED
9. **`site-settings.tsx`** (456 lines) - ✅ COMPLETED

## 📊 Phase 2 Priority List (Consistency & Maintenance)

10. **`settings.tsx`** (452 lines) - ✅ COMPLETED
11. **`dashboard.tsx`** (414 lines) - ✅ COMPLETED
12. **`dictionary.tsx`** (277 lines) - ✅ COMPLETED

---

## 🛠️ Proposed Refactoring Architecture

Instead of having all states, API calls, tables, and dialogs mashed into a single `pages/feature.tsx` file, we will restructure each feature into its own folder.

### 📁 Target Structure Example (For `users` feature)

```text
src/pages/users/
├── index.tsx                        # Main page entry (Only Layout + Components)
├── hooks/
│   ├── useUsers.ts                  # Fetching users, search state, pagination
│   └── useUserMutations.ts          # Create, Edit, Delete, Bulk Action logic
└── components/
    ├── UserTable.tsx                # Data table rendering
    ├── UserFilterBar.tsx            # Search inputs & Tenant Dropdown
    ├── dialogs/
    │   ├── CreateEditUserDialog.tsx # The massive add/edit form
    │   ├── DeleteUserDialog.tsx
    │   ├── UserBulkActionsDialog.tsx
    │   └── UserTransferDialog.tsx
```

### Note on Routing (`App.tsx`)
Currently, `App.tsx` imports pages like `import { UsersPage } from "@/pages/users"`. 
By moving `src/pages/users.tsx` to `src/pages/users/index.tsx` and exporting `UsersPage`, the Vite/TypeScript module resolution will automatically resolve it. No changes to `App.tsx` paths will be strictly required, ensuring zero routing downtime.

---

## ⚠️ CRITICAL RULE: ZERO FUNCTIONALITY CHANGE

**The primary and absolute rule for this refactoring process is that it MUST NOT alter the existing functionality of the system in any way.**
- **No Feature Deletions:** Do not remove any buttons, inputs, columns, or dialogs.
- **No Logic Changes:** Do not alter the way APIs are called, the structure of payloads, or how authentication/roles (e.g. `useAuth()`) are handled.
- **Impersonation Mode Integrity:** When passing `user` context to sub-components, ALWAYS pass `isImpersonating` (from `useAuth()`) alongside it. Any rendering or validation logic checking `user?.role === "super_admin"` MUST also include `&& !isImpersonating` to correctly hide Tenant Dropdowns or System Admin options when a Super Admin is impersonating a Tenant.
- **Purely Structural:** This is strictly a Code Reorganization task (moving code into Components and Hooks). The end-user should not notice any difference in how the application looks or behaves.
- **Target File Size:** All refactored files (including `index.tsx`, hooks, and components) MUST be kept under **250-300 lines** (as per Code Syntax Standards 5.1).

---

## 🚀 Execution Workflow (For Future Agent Sessions)

When executing this plan in future sessions, the Agent must follow these steps strictly for each target file:

1. **Analyze Original File**: Read the target monolithic file carefully. Note down all State variables, API fetching logic, and `<Dialog>` components.
2. **Extract Hooks**: Create `src/pages/[feature]/hooks/...` and move `useState`, `useEffect`, and `api.*` calls there. Export the necessary state variables and mutation functions.
3. **Extract Dialogs**: Create `src/pages/[feature]/components/...` and move each `<Dialog>...</Dialog>` block into its own component. Pass down required states (e.g., `isOpen`, `onClose`, `onSubmit`) via React Props.
   - **3.1 Apply Dialog Standards**: Ensure extracted dialogs adhere strictly to the project's standard:
     - **DialogContent**: Use `bg-background border-none shadow-2xl` and required close button styling.
     - **DialogHeader**: Use `bg-background border-b border-border px-5 sm:px-8 py-5 sm:py-7`. No gradients. Title `text-foreground`, subtitle `text-muted-foreground`.
     - **Critical Dropdowns** (e.g. Tenant Select): Wrap in `space-y-2 bg-muted/30 p-3 rounded-lg border border-border/50`.
     - **DialogFooter**: Use `px-5 sm:px-7 py-4 border-t border-border bg-background flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-auto`.
4. **Extract Tables & Filters**: Move data tables and filter components out.
   - **4.1 Table UX Standards**: Wrap the table and pagination in `flex flex-col min-h-[500px]` (or `h-full`) and add `mt-auto` to the pagination control to prevent layout jumps.
5. **Assemble `index.tsx`**: Rebuild the main page to consume the Hooks and render the sub-components cleanly.
   - **5.1 Error Boundary**: Wrap the main page export in an `<ErrorBoundary>` to catch unhandled frontend exceptions.
6. **Type Safety**: Ensure TypeScript interfaces (`User`, `Profile`, `Tenant`) are either moved to a shared `src/types/` folder or exported cleanly.
7. **Verification**: Run `npm run dev` in a terminal tool or manually verify that the page renders without errors and all dialogs open/close correctly.
8. **Cleanup**: Delete the old monolithic `.tsx` file in `src/pages/`.
