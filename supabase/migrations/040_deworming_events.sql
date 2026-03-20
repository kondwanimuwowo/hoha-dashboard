-- Migration 040: Deworming Events
-- Event + records pattern (like food distribution + recipients)

-- One row per deworming day
CREATE TABLE IF NOT EXISTS deworming_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_date DATE NOT NULL,
    medication_name TEXT NOT NULL,
    dosage_amount NUMERIC(8,2) NOT NULL,
    dosage_unit TEXT NOT NULL DEFAULT 'mg',
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One row per child per event
CREATE TABLE IF NOT EXISTS deworming_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES deworming_events(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES people(id),
    weight_kg NUMERIC(5,2),
    height_cm NUMERIC(5,1),
    administered BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(event_id, child_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_deworming_records_event_id ON deworming_records(event_id);
CREATE INDEX IF NOT EXISTS idx_deworming_records_child_id ON deworming_records(child_id);
CREATE INDEX IF NOT EXISTS idx_deworming_events_event_date ON deworming_events(event_date);

-- RLS
ALTER TABLE deworming_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE deworming_records ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'deworming_events' AND policyname = 'auth_all'
    ) THEN
        CREATE POLICY "auth_all" ON deworming_events FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'deworming_records' AND policyname = 'auth_all'
    ) THEN
        CREATE POLICY "auth_all" ON deworming_records FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;

NOTIFY pgrst, 'reload config';
