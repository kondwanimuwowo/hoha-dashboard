-- Migration 043: Add unique constraint on relationships(person_id, related_person_id)
-- Required for the upsert in useCreateRelationship to work correctly.
-- First remove any duplicate rows (keep the earliest one per pair).

delete from public.relationships
where id not in (
    select min(id)
    from public.relationships
    group by person_id, related_person_id
);

alter table public.relationships
    add constraint relationships_person_id_related_person_id_key
    unique (person_id, related_person_id);
