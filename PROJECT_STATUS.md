# Project Completion Checklist

## ✅ Completed / Implemented (current repo)
- **Database:** 22-table DDL with FKs/indexes (`db/VinHousingDDL.sql`), seed data (`db/seed.sql`), views (`views.sql`), stored procedures (`sp_create_rental_request`, `sp_change_issue_status`), trigger (`trg_contract_activate`), migration for `contract_proposed_end_dates`, and `updateView.sql` (adds `title` + `image_url`, refreshes listing view/constraint).
- **Backend API:** Express + MySQL pool on port 5000 (from `.env`); JWT auth + bcrypt; RBAC middleware; controllers/routes for auth, users, properties/rooms, listings, rental requests, contracts (incl. proposed end dates), issues (status history + attachments), reviews, organizations, verifications; request validation and centralized error handling; CORS enabled.
- **Frontend:** React app with protected routing; landing + auth pages; dashboards for tenant/landlord/admin; listing search/detail with rental request creation; landlord property/room/listing management; contract management UI (view/sign/propose end dates) for both roles; issue reporting/management; admin verification + user management views; shared Navbar/ContractForm components.
- **Documentation:** Root README plus backend README/QUICKSTART and frontend README.

## 🚧 Needs Attention / Verification
- **Schema drift:** `VinHousingDDL.sql` is missing `properties.image_url` and `issue_reports.title` (added in `db/updateView.sql`); `contract_proposed_end_dates` only exists in `db/migrations`; `ck_issue_status` in `VinHousingDDL.sql` has an empty enum. Fold these into the main DDL or ensure migrations/scripts run after base schema.
- **Seed alignment:** `db/seed.sql` assumes the extra columns above and currently seeds 25 tenants (comment says 50). Re-run after schema fixes.
- **Views:** Prefer the `CREATE OR REPLACE` version in `db/updateView.sql`; apply its `ck_listing_target` change so listings allow at least one of property_id/room_id.
- **Security:** DB roles/privileges are not scripted.
- **Testing:** No automated API/UI tests; integration not recorded; no migration/CI checks.
- **Docs:** `db/SQL_ANALYSIS.md` still claims procs/triggers/seed are missing—refresh it.
- **Performance:** No EXPLAIN/benchmark evidence captured yet.

## ❌ Still Pending / Missing Features
- Review UI/flow (frontend does not expose posting/reading reviews yet).
- Contract creation flow in UI (backend supports `createContract` after accepted requests; frontend currently only fetches/signs existing contracts).
- Formal test plan + screenshots/logs.
- Performance/DB tuning evidence.

## 🎯 MVP Checklist (current)
- Database schema: ✅
- Backend API running: ✅ (PORT 5000 from `backend/.env`)
- Frontend:
  - Login/Register: ✅
  - Browse listings: ✅ (`ListingSearch`, `ListingDetail`)
  - Create rental request: ✅ (`ListingDetail`)
  - Create contract: ⚠️ UI missing (view/sign only)
  - Report issue: ✅ (Tenant dashboard)
- Views/procedures/triggers: ✅ (run `updateView.sql` + migrations)
- Basic testing: ❌

## 🚀 Quick Start Commands
```bash
# Database (run in order)
cd db
mysql -u <user> -p < VinHousingDDL.sql
mysql -u <user> -p < updateView.sql
mysql -u <user> -p < procedures.sql
mysql -u <user> -p < triggers.sql
mysql -u <user> -p < migrations/create_contract_proposed_end_dates.sql
mysql -u <user> -p < seed.sql

# Backend API
cd ../backend
cp env.template .env   # adjust DB creds/PORT=5000
npm install
npm run dev

# Frontend
cd ../frontend
npm install
npm start   # API base: http://localhost:5000/api (src/services/api.js)
```

## 📝 Notes
- `audit_logs` table exists and is written by `sp_change_issue_status`; not yet used elsewhere.
- Align schema + seed before running the backend to avoid missing-column errors.
