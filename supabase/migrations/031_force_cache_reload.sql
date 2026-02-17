-- Migration 031: Force Schema Cache Reload
-- This is a non-destructive migration that just triggers a reload of the PostgREST schema cache.

NOTIFY pgrst, 'reload config';
