-- Migration 023: Backfill existing food recipients to parent-first household fields.
-- Safe to run after 022_family_groups_parent_first.sql.

-- 1) If a recipient has a family_group_id, sync it directly from family_groups.
UPDATE public.food_recipients fr
SET
  primary_person_id = fg.recipient_id,
  family_size = fg.family_size,
  family_member_ids = fg.family_member_ids,
  family_member_names = fg.family_member_names,
  family_type = fg.family_type
FROM public.family_groups fg
WHERE fr.family_group_id = fg.recipient_id
  AND (
    fr.primary_person_id IS DISTINCT FROM fg.recipient_id
    OR fr.family_member_ids IS DISTINCT FROM fg.family_member_ids
    OR fr.family_member_names IS DISTINCT FROM fg.family_member_names
    OR fr.family_type IS DISTINCT FROM fg.family_type
  );

-- 2) Fallback: rows without family_group_id can still map by family_head_id.
--    This handles historical data where family_group_id was not populated.
UPDATE public.food_recipients fr
SET
  primary_person_id = fg.recipient_id,
  family_size = fg.family_size,
  family_member_ids = fg.family_member_ids,
  family_member_names = fg.family_member_names,
  family_type = fg.family_type,
  family_group_id = fg.recipient_id
FROM public.family_groups fg
WHERE fr.family_group_id IS NULL
  AND (
    fr.family_head_id = fg.recipient_id
    OR fr.family_head_id = ANY(COALESCE(fg.family_member_ids, ARRAY[]::uuid[]))
  )
  AND (
    fr.primary_person_id IS DISTINCT FROM fg.recipient_id
    OR fr.family_member_ids IS DISTINCT FROM fg.family_member_ids
    OR fr.family_member_names IS DISTINCT FROM fg.family_member_names
    OR fr.family_type IS DISTINCT FROM fg.family_type
    OR fr.family_group_id IS DISTINCT FROM fg.recipient_id
  );
