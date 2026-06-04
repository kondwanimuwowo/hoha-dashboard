-- Allow emergency relief recipients to be non-registered people (name string only,
-- no people row required). Mirrors the outreach_participants.ad_hoc_name pattern.
alter table emergency_relief_recipients
    add column if not exists ad_hoc_name text;
