-- Marks deworming events created to preserve earlier readings (not real deworming
-- sessions), so they can be hidden from the Health page while staying in each
-- student's history.
alter table deworming_events
    add column if not exists is_backfilled boolean not null default false;

update deworming_events
set is_backfilled = true
where medication_name = 'Not recorded (backfilled)';

notify pgrst, 'reload schema';
