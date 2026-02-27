-- Migration 036: Data Normalization
-- Normalizes existing data to align with the current schema after multiple
-- rounds of schema evolution. Safe to run multiple times (all operations are
-- idempotent — they only touch rows that actually need fixing).
-- Does NOT drop any columns or tables. No destructive changes.

BEGIN;

-- ============================================================
-- 1. CLINICARE VISITS: Backfill facility_id from facility_name
-- ============================================================
-- Old visits stored the facility as a raw string in facility_name.
-- The schema was later updated to use a proper FK (facility_id → medical_facilities).
-- New visits already use facility_id. Old ones need to be linked.

-- 1a. Upsert any facility names that don't yet exist in medical_facilities
--     so that every name has a proper record to link to.
INSERT INTO public.medical_facilities (facility_name, is_active)
SELECT DISTINCT TRIM(cv.facility_name), true
FROM public.clinicare_visits cv
WHERE cv.facility_name IS NOT NULL
  AND TRIM(cv.facility_name) <> ''
  AND cv.facility_id IS NULL
ON CONFLICT (facility_name) DO NOTHING;

-- 1b. Link old visits to their matched medical_facilities record.
--     Case-insensitive match handles minor capitalisation differences.
UPDATE public.clinicare_visits cv
SET facility_id = mf.id
FROM public.medical_facilities mf
WHERE cv.facility_id IS NULL
  AND cv.facility_name IS NOT NULL
  AND TRIM(cv.facility_name) <> ''
  AND LOWER(TRIM(cv.facility_name)) = LOWER(mf.facility_name);


-- ============================================================
-- 2. CLINICARE VISITS: Backfill cost_amount from breakdown fields
-- ============================================================
-- Newer visits auto-calculate cost_amount from medical_fees + transport_costs
-- + other_fees via a trigger (migration 009). Older visits may have had
-- cost_amount entered directly but left the breakdown fields at zero/null.
-- This backfills cost_amount where the breakdown fields together sum to more
-- than what cost_amount currently holds.

UPDATE public.clinicare_visits
SET cost_amount = COALESCE(medical_fees, 0)
                + COALESCE(transport_costs, 0)
                + COALESCE(other_fees, 0)
WHERE (cost_amount IS NULL OR cost_amount = 0)
  AND (  COALESCE(medical_fees, 0)
       + COALESCE(transport_costs, 0)
       + COALESCE(other_fees, 0)
      ) > 0;


-- ============================================================
-- 3. FOOD RECIPIENTS: Sync duplicate collection status fields
-- ============================================================
-- Two boolean fields were added at different times for the same concept:
-- `collected` (migration 003) and `is_collected` (migration 010).
-- Sync them so both always agree. is_collected is the current standard.

-- Where `collected` is set but `is_collected` disagrees → trust `collected`
UPDATE public.food_recipients
SET is_collected = collected
WHERE collected IS NOT NULL
  AND (is_collected IS NULL OR is_collected <> collected);

-- Where `is_collected` is set but `collected` disagrees → back-sync `collected`
UPDATE public.food_recipients
SET collected = is_collected
WHERE is_collected IS NOT NULL
  AND (collected IS NULL OR collected <> is_collected);

-- Mark rows where collection_time is set as collected (both fields)
-- A timestamp proves it was collected even if the boolean was missed.
UPDATE public.food_recipients
SET is_collected = true,
    collected    = true
WHERE collection_time IS NOT NULL
  AND (is_collected = false OR is_collected IS NULL);


-- ============================================================
-- 4. FOOD RECIPIENTS: Backfill primary_person_id from family_head_id
-- ============================================================
-- family_head_id was the original field (migration 003).
-- primary_person_id was added later (migration 010) for the newer household
-- logic. Old records have family_head_id set but primary_person_id null.

UPDATE public.food_recipients
SET primary_person_id = family_head_id
WHERE primary_person_id IS NULL
  AND family_head_id IS NOT NULL;


-- ============================================================
-- 5. AWARD RECIPIENTS: Safety re-run of person_id backfill
-- ============================================================
-- Migration 035 added person_id and backfilled it from
-- student_id → educare_enrollment.child_id. Run again to catch
-- any rows that may have been inserted between migrations.

UPDATE public.award_recipients ar
SET person_id = ee.child_id
FROM public.educare_enrollment ee
WHERE ar.student_id = ee.id
  AND ar.person_id IS NULL;


-- ============================================================
-- 6. SCHOOL AWARDS: Sync total_recipients count
-- ============================================================
-- total_recipients is a denormalised counter that may have drifted out of
-- sync with the actual number of award_recipients rows over time.

UPDATE public.school_awards sa
SET total_recipients = (
    SELECT COUNT(*)
    FROM public.award_recipients ar
    WHERE ar.award_id = sa.id
);


-- ============================================================
-- 7. EDUCARE ENROLLMENT: Cascade soft-deletes from people
-- ============================================================
-- When a student (person) is soft-deleted, their enrollment record should
-- also be soft-deleted. The application hooks do this together, but earlier
-- versions of the delete flow may have only soft-deleted the person.

UPDATE public.educare_enrollment ee
SET deleted_at = COALESCE(p.deleted_at, NOW())
FROM public.people p
WHERE ee.child_id = p.id
  AND p.deleted_at IS NOT NULL
  AND ee.deleted_at IS NULL;


-- ============================================================
-- 8. LEGACY WOMEN ENROLLMENT: Cascade soft-deletes from people
-- ============================================================
-- Same as above for the Legacy program. If the woman's person record is
-- soft-deleted, her enrollment should be too.

UPDATE public.legacy_women_enrollment lwe
SET deleted_at = COALESCE(p.deleted_at, NOW())
FROM public.people p
WHERE lwe.woman_id = p.id
  AND p.deleted_at IS NOT NULL
  AND lwe.deleted_at IS NULL;


-- ============================================================
-- 9. LEGACY WOMEN ENROLLMENT: Resolve accidental duplicate active enrollments
-- ============================================================
-- Before the uniqueness constraint was enforced in code, it was possible for
-- the same woman to have multiple active enrollment rows. Keep the most recent
-- one (by enrollment_date then created_at) and soft-delete the rest.

UPDATE public.legacy_women_enrollment
SET deleted_at = NOW()
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY woman_id
                   ORDER BY COALESCE(enrollment_date, '1900-01-01') DESC,
                            created_at DESC
               ) AS rn
        FROM public.legacy_women_enrollment
        WHERE deleted_at IS NULL
    ) ranked
    WHERE rn > 1
);


-- ============================================================
-- 10. COMMUNITY OUTREACH: Sync total_expenses and total_participants
-- ============================================================
-- These denormalised counters on community_outreach may have drifted.

UPDATE public.community_outreach co
SET
    total_expenses = COALESCE((
        SELECT SUM(oe.amount)
        FROM public.outreach_expenses oe
        WHERE oe.outreach_id = co.id
    ), 0),
    total_participants = (
        SELECT COUNT(*)
        FROM public.outreach_participants op
        WHERE op.outreach_id = co.id
    );


COMMIT;

-- Reload PostgREST schema cache so all changes are immediately visible
NOTIFY pgrst, 'reload config';
