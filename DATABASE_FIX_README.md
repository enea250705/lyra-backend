# Database Foreign Key Constraint Fix

## Problem
The backend deployment is failing with a foreign key constraint error:
```
insert or update on table "usage_analytics" violates foreign key constraint "usage_analytics_user_id_fkey"
Key (user_id)=(c11ed8a9-ba3a-4c97-917e-0600e4985488) is not present in table "users"
```

## Root Cause
1. The `usage_analytics` table was missing from the migration files
2. There was a mismatch between the Sequelize model definition and the database schema
3. Orphaned records existed in the `usage_analytics` table referencing non-existent users

## Solution

### 1. Created Missing Migration
- Added `004-usage-analytics-table.ts` migration file
- Properly defines the `usage_analytics` table with correct foreign key constraints

### 2. Fixed Model Definition
- Updated `UsageAnalytics.ts` model to match the database schema
- Added proper field mappings for snake_case database columns
- Fixed attribute names to match the actual table structure

### 3. Added Cleanup Scripts
- `cleanup-database.js` - Manual cleanup script for orphaned records
- `src/scripts/cleanup-orphaned-records.ts` - Programmatic cleanup
- `src/scripts/run-migrations.ts` - Safe migration runner

### 4. Updated App Initialization
- Modified `app.ts` to clean orphaned records before syncing
- Removed `force: true` option that was causing data loss
- Added safe migration approach

## How to Fix

### Option 1: Run Cleanup Script (Recommended)
```bash
cd backend
npm run db:cleanup
```

### Option 2: Manual Database Cleanup
```sql
-- Connect to your database and run:
DELETE FROM usage_analytics WHERE user_id NOT IN (SELECT id FROM users);
```

### Option 3: Reset Database (Development Only)
```bash
cd backend
npm run db:reset
```

## Prevention
- Always create proper migration files for new tables
- Ensure model definitions match database schema
- Use `alter: true` instead of `force: true` in production
- Regularly clean up orphaned records

## Files Modified
- `backend/src/database/migrations/004-usage-analytics-table.ts` (new)
- `backend/src/models/UsageAnalytics.ts` (updated)
- `backend/src/app.ts` (updated)
- `backend/package.json` (updated)
- `backend/cleanup-database.js` (new)
- `backend/src/scripts/cleanup-orphaned-records.ts` (new)
- `backend/src/scripts/run-migrations.ts` (new)

