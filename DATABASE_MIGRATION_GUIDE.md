# Database Migration Guide

## How to Apply Migrations

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of each migration file in order:
   - First: `008_enhanced_features.sql`
   - Second: `009_clinicare_enhancements.sql`
   - Third: `010_family_groups_distribution.sql`
5. Click **Run** for each migration
6. Verify no errors appear

### Option 2: Supabase CLI

If you have the Supabase CLI installed:

```bash
# Make sure you're in the project directory
cd c:\Users\kondw\Desktop\repos\hoha-dashboard

# Link to your project (if not already linked)
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push
```

## Migration Order

**IMPORTANT:** Apply migrations in this exact order:

1. **008_enhanced_features.sql** - Core enhancements
   - Adds soft delete support
   - Creates case_notes table
   - Creates student_documents table
   - Creates parent_emergency_contacts table
   - Updates student_details view

2. **009_clinicare_enhancements.sql** - CliniCare improvements
   - Creates health_facilities table
   - Adds follow-up visit tracking
   - Adds other_fees field
   - Creates automatic cost calculation trigger
   - Updates currency to ZMW

3. **010_family_groups_distribution.sql** - Distribution system
   - Creates family_groups view
   - Creates distribution helper functions
   - Updates food_recipients table

## Verification

After applying each migration, verify:

```sql
-- Check if tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'case_notes', 
  'student_documents', 
  'parent_emergency_contacts',
  'health_facilities'
);

-- Check if views were created
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name IN (
  'student_details',
  'visit_details',
  'family_groups',
  'distribution_summary'
);

-- Check if columns were added
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'people' 
AND column_name = 'deleted_at';

SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'clinicare_visits' 
AND column_name IN ('other_fees', 'parent_visit_id');
```

## Rollback (If Needed)

If you need to rollback a migration:

```sql
-- Rollback 010_family_groups_distribution.sql
DROP VIEW IF EXISTS distribution_summary;
DROP FUNCTION IF EXISTS mark_family_collected(UUID, VARCHAR);
DROP FUNCTION IF EXISTS get_distribution_recipients();
DROP VIEW IF EXISTS family_groups;
ALTER TABLE food_recipients DROP COLUMN IF EXISTS family_type;
ALTER TABLE food_recipients DROP COLUMN IF EXISTS primary_person_id;
ALTER TABLE food_recipients DROP COLUMN IF EXISTS family_member_ids;
ALTER TABLE food_recipients DROP COLUMN IF EXISTS is_collected;
ALTER TABLE food_recipients DROP COLUMN IF EXISTS collected_at;

-- Rollback 009_clinicare_enhancements.sql
DROP VIEW IF EXISTS visit_details;
DROP TRIGGER IF EXISTS trigger_calculate_visit_cost ON clinicare_visits;
DROP FUNCTION IF EXISTS calculate_visit_total_cost();
DROP TABLE IF EXISTS health_facilities;
ALTER TABLE clinicare_visits DROP COLUMN IF EXISTS parent_visit_id;
ALTER TABLE clinicare_visits DROP COLUMN IF EXISTS other_fees;
ALTER TABLE clinicare_visits DROP COLUMN IF EXISTS facility_id;
ALTER TABLE clinicare_visits DROP COLUMN IF EXISTS last_edited_by;
ALTER TABLE clinicare_visits DROP COLUMN IF EXISTS last_edited_at;

-- Rollback 008_enhanced_features.sql
DROP TABLE IF EXISTS parent_emergency_contacts;
DROP TABLE IF EXISTS student_documents;
DROP TABLE IF EXISTS case_notes;
ALTER TABLE people DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE educare_enrollment DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE legacy_women_enrollment DROP COLUMN IF EXISTS deleted_at;
```

## Common Issues

### Issue: "relation already exists"
**Solution:** The table/view was already created. You can safely ignore this or drop and recreate.

### Issue: "column already exists"
**Solution:** The column was already added. You can safely ignore this.

### Issue: "function does not exist"
**Solution:** Make sure you're running migrations in order. Some functions depend on tables from earlier migrations.

### Issue: RLS policy errors
**Solution:** Check if policies with the same name already exist. You may need to drop old policies first.

## Post-Migration Steps

After successfully applying all migrations:

1. **Refresh your app** - The dev server should pick up the changes
2. **Test the new features** - Try creating a student without phone/compound
3. **Check the console** - Look for any errors related to the new tables
4. **Verify data integrity** - Existing records should still work

## Need Help?

If you encounter any issues:
1. Check the Supabase logs in the dashboard
2. Verify your database connection
3. Make sure you have the necessary permissions
4. Try running migrations one at a time
