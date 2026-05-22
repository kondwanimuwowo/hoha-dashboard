-- Person documents table (generic, for any person — women, parents, etc.)
-- Students use student_documents; everyone else uses this table.

create table if not exists person_documents (
    id uuid primary key default gen_random_uuid(),
    person_id uuid not null references people(id) on delete cascade,
    document_type text not null default 'Other',
    document_name text not null,
    document_url text not null,
    file_size bigint,
    mime_type text,
    notes text,
    upload_date timestamptz not null default now(),
    uploaded_by uuid references auth.users(id)
);

alter table person_documents enable row level security;

create policy "Authenticated users can view person documents"
    on person_documents for select
    to authenticated
    using (true);

create policy "Authenticated users can insert person documents"
    on person_documents for insert
    to authenticated
    with check (true);

create policy "Users can delete own uploads, admins can delete any"
    on person_documents for delete
    to authenticated
    using (
        uploaded_by = auth.uid()
        or exists (
            select 1 from user_profiles
            where user_profiles.id = auth.uid()
            and user_profiles.role = 'Admin'
        )
    );
