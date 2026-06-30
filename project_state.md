# Project State: SaaS FreeRADIUS Cloud Management System

**Last Updated:** 2026-06-28

## Current Phase: Phase 2 Completed (Database & Backend Scaffolding)

### ✅ What has been completed:
1. **Requirements & Architecture (Phase 1):**
   - `docs/system_requirements.md`: Finalized (Multi-Tenancy, 802.1X, Telegram Bot, Soft Delete policies, Log Housekeeping).
   - `docs/architecture_design.md`: Finalized (PostgreSQL + Loki + Vector, Dual-Mode RadSec).
   - `docs/product_features_and_roles.md`: Finalized (Master Admin, Tenant Admin, End-User Self-Care).
2. **Backend Scaffolding & Database Schema (Phase 2):**
   - Initialized `backend` directory (Node.js, Fastify, TypeScript).
   - Created Drizzle ORM schemas (`tenants.ts`, `admins.ts`, `nas.ts`, `freeradius.ts`, `mac_bypass.ts`, `vouchers.ts`).
   - Setup Fastify Server, JWT Auth, and `admin@saas.local` seeder.
   - Database schema successfully migrated to PostgreSQL.
3. **Frontend Scaffolding & Core UI (Micro-Phase 2):**
   - Initialized React + Vite + TypeScript in `frontend` folder.
   - Installed Tailwind CSS v4 and Shadcn/UI components.
   - Implemented `i18next` for Thai (TH) and English (EN) localization.
   - Implemented Theme Provider for Dark/Light Mode.
   - Built initial Login Page and Master Admin Dashboard layout (Classic & Minimal).
4. **Frontend-Backend Integration (Phase 3):**
   - Configured Fastify CORS to allow cross-origin requests from Vite (port 5173).
   - Set up Axios with request interceptors to automatically attach JWT tokens.
   - Implemented React Context (`AuthContext`) for global authentication state.
   - Secured Dashboard with `ProtectedRoute` component (redirects to `/login` if not authenticated).
   - Successfully tested end-to-end login flow using `admin@saas.local`.
5. **Dashboard UI Implementation (Phase 4):**
   - Implemented Responsive Line Chart for Network Traffic using `recharts` with Gradient Fills and Tooltips.
   - Created `/users` page showcasing a "Modern Data-Heavy Table" with Mock Data.
6. **RADIUS Logic & Data Integration (Phase 5):**
   - Implemented `/api/v1/dashboard/stats` to calculate live active sessions and traffic (download/upload) from `radacct`.
   - Implemented `/api/v1/users` to list users from `radcheck` joined with their active session from `radacct`.
   - Created database seed script (`seed-radius.ts`) generating dummy radius sessions.
7. **Tenant Dashboard UI (Phase 6):**
   - Segregated `dashboard.tsx` into `<MasterDashboard />` and `<TenantDashboard />` based on `user.role`.
   - Updated `dashboard.controller.ts` to supply tenant-specific data (e.g. Active Vouchers, Router Status).
8. **Loki LogQL Integration (Phase 7 - Mock):**
   - Created `/api/v1/dashboard/logs/failed-logins` returning mock Loki data.
   - Built `<FailedLoginsList />` UI component to display recent authentication failures cleanly alongside the Traffic Chart.
9. **Multi-Language Support & Theme Polish (Phase 8):**
   - Configured `i18next` with EN and TH translation dictionaries.
   - Refactored `Dashboard`, `Users`, and `FailedLoginsList` components to use `useTranslation`.
   - Verified functionality of `LanguageToggle` and `ThemeToggle` in the UI layout.
10. **API Rate Limiting & Final Wrap-up (Phase 9):**
    - Installed `@fastify/rate-limit`.
    - Applied a global limit of 100 requests/minute to prevent DoS attacks.
    - Secured `/api/v1/auth/login` with a strict limit of 5 requests/minute to mitigate Brute-Force and Dictionary attacks.
11. **Core CRUD UIs & Advanced Responsive Design (Phase 10):**
    - Implemented full CRUD pages for **Profiles** (Internet Packages), **Tenants**, and **NAS/Routers**.
    - Styled headers with `Midnight Slate` gradient (`bg-gradient-to-r from-slate-800 to-slate-900`) for a premium look in both Light/Dark modes.
    - Achieved **100% Mobile Responsiveness**:
      - Replaced standard Dialogs with full-screen Modals on mobile (`h-[100dvh] w-full`) with sticky bottom footers for easy thumb access.
      - Integrated Shadcn `Sheet` for a slide-out mobile navigation Sidebar.
      - Wrapped all data tables with `overflow-x-auto` to allow swipeable horizontal scrolling.
      - Stacked form grid layouts into a single column (`grid-cols-1`) on mobile.
12. **Admins Management (Phase 11):**
    - Created backend API (`admins.controller`, `admins.routes`) with role-based restrictions.
    - Implemented UI (`admins.tsx`) for Super Admins to manage system users and assign them to specific Tenants.
    - Ensured `403 Forbidden` issues were resolved by creating valid `tenant_admin` users.
13. **Git & Deployment Preparation:**
    - Established comprehensive root `.gitignore`.
    - Created `README.md` with complete installation instructions for new environments.
    - Initialized Git repo and pushed to `https://github.com/sudoaptgetupdate-y/freeradius-newtype.git`.

14. **Vouchers & Queues (Phase 12):**
    - Implemented backend logic (`vouchers.controller.ts`) for generating bulk internet vouchers with BullMQ and Redis.
    - Built Frontend UI (`vouchers.tsx`) for managing and generating vouchers with a live progress bar.
15. **FreeRADIUS Integration & Database Polish (Post-Phase 12):**
    - Fixed `radacct` schema in PostgreSQL by adding missing IPv6 columns.
    - Resolved `DATATYPE MISMATCH` error in accounting records by ensuring FreeRADIUS is configured with `dialect = "postgresql"`.
    - Fixed `ON CONFLICT` spec constraint errors by adding a `unique()` key to `acctuniqueid` in the `radacct` table schema and running a migration.
    - Verified that active and historical session records are processed successfully, and details modals correctly format user statistics (traffic, time, MAC, session history).
16. **Dashboard UI Enhancements & Hybrid Logging Architecture:**
    - Improved User Management UI: Added visual hierarchy (emerald/pulsing for online, muted for offline) and resolved missing data for offline users by fetching "Last Known" session details and cumulative data.
    - Updated documentation (`docs/freeradius_multitenant_sql_config.md`) with production-ready PostgreSQL queries using `${....event_timestamp}` to solve Date/Time literal formatting issues.
    - Designed and documented the **Hybrid Logging Architecture** (Centralized SaaS Loki vs Dedicated/BYO Loki) in `architecture_design.md` and `system_requirements.md` to support Enterprise deployments.
    - Resolved database session timezone discrepancy (+7 hours shift in Web UI) by setting default database timezone to `UTC` (`ALTER DATABASE radius SET timezone TO 'UTC';`), updating `freeradius_complete_setup_guide.md` and `architecture_design.md` to ensure standardized datetime display.
17. **Profiles Wizard Refactor & FortiGate Integration:**
    - Refactored the Add/Edit Profile Dialog into a 3-step wizard layout (General Info -> Limits -> Configuration) to resolve overflow issues.
    - Implemented a marker attribute (`Class = <Groupname>`) in the backend database mapping to persist empty profiles and prevent deletion issues.
    - Integrated a dedicated **FortiGate Template** in the wizard UI and backend, sending `Fortinet-Group-Name` back to FortiGate to pair with local Traffic Shapers on the firewall.
    - Documented all RADIUS Attribute and Package configurations in `docs/attributes_and_packages.md`.
18. **Captive Portal Settings, Self-Registration & Portal Login (Phase 13):**
    - Created `tenant_portal_settings` database schema with Drizzle migrations to store tenant branding assets (Logo, Org Name, Theme Color, Terms of Service).
    - Developed backend controllers and routes handling dynamic portal settings retrieval, updates, and public self-registration.
    - Implemented transaction-safe self-registration adding credentials to `radcheck` and mapping users to the tenant's `defaultRegisterProfile` in `radusergroup` with custom registration details stored as attributes in `radreply`.
    - Created **Portal Settings** management UI inside the dashboard layout enabling Tenant Admins to customize portal colors, branding assets, configure switches for registration/social logins, and copy the registration URL.
    - Built a responsive, mobile-first **Public Registration Page** carrying over query parameters for seamless authentication redirections.
    - Built a public **Portal Login Page** with dynamic styling that detects and supports multi-vendor Hotspot login submission flows (Mikrotik, Fortigate, Cisco Meraki, Aruba, and generic fallback devices) by automatically posting user credentials back to the gateway.
19. **Portal Settings & Vouchers UI/UX Enhancements (Post-Phase 13):**
    - Redesigned the **Portal Settings** page into a 3-step Wizard layout (Branding & Identity -> Theme Colors -> Settings & Legal).
    - Added a persistent **"Live Preview"** slide-out Sheet (Drawer) showing real-time updates for Login/Register layouts during editing.
    - Aligned page constraints of Portal Settings to match Global Settings (`max-w-[1200px] mx-auto`) and removed duplicate padding.
    - Standardized **Vouchers** list layout by grouping filters and the Refresh button into a single `<CardHeader>` row, eliminating vertical whitespace.

### 3. UI/UX Mockups & Design Decisions:
   - Generated visual mockups for Master Dashboard, Tenant Dashboard, and Captive Portal.
   - **[Finalized Design] Dashboard Layout:** Selected 'Classic & Minimal' (Light Mode). Features metric cards at the top (Total Tenants, Online Users) and a large Network Traffic line chart below. Clean and professional aesthetic.
   - **[Finalized Design] User Management Layout:** Selected 'Modern Data-Heavy Table' (Light Mode, matching Dashboard). Features a clean, full-width Shadcn/UI Data Table with an advanced Filter Bar (Dropdowns, Date Pickers) and Search input cleanly arranged above the table headers.
   - Requirement added: Multi-Language support (EN/TH) and Dark/Light Mode toggle.

### 4. AI Guidelines:
   - Created `SKILL.md` enforcing Multi-Tenancy isolation, Soft Deletes, and Tech Stack.
   - Added standard styling guidelines for React Dialogs in `AGENTS.md`.

### 🚧 MVP STATUS: IN PROGRESS (Missing Core Features)
- Phase 1 to 12 have been successfully completed. 
- However, several critical requirements from the SRS are still pending implementation to achieve true MVP for a SaaS Hotspot system.

### 🎯 Next Steps & Pending Phases:
1. **Phase 13: Captive Portal Social Login & Ads (REQ-PORTAL-01, 02)**
   - Implement External Social Login integrations (Google OAuth 2.0 and LINE Login) for the public login page.
   - Implement pre-login advertisement logic.
3. **Phase 14: End-User Self-Care Portal (REQ-USER-05)**
   - Build a dashboard for internet users to check quota, change passwords, and self-disconnect sessions via RADIUS CoA.
4. **Phase 15: Telegram Bot Integration (REQ-SAAS-06)**
   - Implement `webhooks.controller.ts` to send alerts (NAS offline, approval requests) to Telegram.
5. **Phase 16: Walled Garden & MAB (REQ-MTK-03)**
   - Implement UI for `mac_bypass` schema to manage IoT devices and Walled Garden lists.
6. **Phase 17: True Grafana Loki Integration (REQ-LOG-01)**
   - Replace the current "Mock" logs in the Dashboard with real LogQL queries to Grafana Loki.
7. **Hardware Integration:**
   - Connect a real Mikrotik Router to fully verify CoA / Disconnect functionality. (API status fetching has been verified).

## Project Structure
- `/backend`: Node.js + Fastify + Drizzle ORM API.
- `/docs/system_requirements.md`: Core SRS document.
- `/docs/architecture_design.md`: Technical Architecture document.
- `/docs/product_features_and_roles.md`: Business Logic, Features and Roles mapping.
- `/docs/freeradius_complete_setup_guide.md`: Installation Guide.
- `/docs/freeradius_setup_recheck.md`: Post-Installation Verification.
- `/.agents/skills/saas_freeradius/SKILL.md`: Strict coding guidelines for AI.
