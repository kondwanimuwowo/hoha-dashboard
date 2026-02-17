-- Migration: Community Outreach Module
-- Description: Create tables for tracking community outreach events, participants, and expenses

-- Create outreach_locations lookup table for predefined location types
CREATE TABLE IF NOT EXISTS outreach_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    is_custom BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert predefined location types
INSERT INTO outreach_locations (name, is_custom) VALUES
    ('Hospital', false),
    ('School', false),
    ('Home', false),
    ('Community Center', false)
ON CONFLICT (name) DO NOTHING;

-- Main community outreach events table
CREATE TABLE IF NOT EXISTS community_outreach (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outreach_date DATE NOT NULL,
    location_id UUID REFERENCES outreach_locations(id),
    location_name TEXT, -- For custom locations or additional details
    notes TEXT,
    total_expenses DECIMAL(10, 2) DEFAULT 0,
    total_participants INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Participants in each outreach event
CREATE TABLE IF NOT EXISTS outreach_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outreach_id UUID NOT NULL REFERENCES community_outreach(id) ON DELETE CASCADE,
    person_id UUID REFERENCES people(id), -- Nullable: links to existing person
    ad_hoc_name TEXT, -- Nullable: for non-registered individuals
    is_registered_member BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- Ensure either person_id or ad_hoc_name is provided
    CONSTRAINT participant_identity_check CHECK (
        (person_id IS NOT NULL AND ad_hoc_name IS NULL) OR
        (person_id IS NULL AND ad_hoc_name IS NOT NULL)
    )
);

-- Itemized expenses for each outreach
CREATE TABLE IF NOT EXISTS outreach_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outreach_id UUID NOT NULL REFERENCES community_outreach(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES outreach_participants(id) ON DELETE CASCADE, -- Nullable: can be group expense
    expense_type TEXT NOT NULL CHECK (expense_type IN ('Medical Bills', 'Rent', 'School Fees', 'Food', 'Other')),
    amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_outreach_date ON community_outreach(outreach_date DESC);
CREATE INDEX IF NOT EXISTS idx_outreach_location ON community_outreach(location_id);
CREATE INDEX IF NOT EXISTS idx_outreach_participants_outreach ON outreach_participants(outreach_id);
CREATE INDEX IF NOT EXISTS idx_outreach_participants_person ON outreach_participants(person_id);
CREATE INDEX IF NOT EXISTS idx_outreach_participants_registered ON outreach_participants(is_registered_member);
CREATE INDEX IF NOT EXISTS idx_outreach_expenses_outreach ON outreach_expenses(outreach_id);
CREATE INDEX IF NOT EXISTS idx_outreach_expenses_participant ON outreach_expenses(participant_id);

-- Function to update total_expenses and total_participants
CREATE OR REPLACE FUNCTION update_outreach_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Update total expenses
    UPDATE community_outreach
    SET total_expenses = (
        SELECT COALESCE(SUM(amount), 0)
        FROM outreach_expenses
        WHERE outreach_id = COALESCE(NEW.outreach_id, OLD.outreach_id)
    ),
    total_participants = (
        SELECT COUNT(*)
        FROM outreach_participants
        WHERE outreach_id = COALESCE(NEW.outreach_id, OLD.outreach_id)
    ),
    updated_at = now()
    WHERE id = COALESCE(NEW.outreach_id, OLD.outreach_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update totals
DROP TRIGGER IF EXISTS update_outreach_totals_on_expense ON outreach_expenses;
CREATE TRIGGER update_outreach_totals_on_expense
AFTER INSERT OR UPDATE OR DELETE ON outreach_expenses
FOR EACH ROW
EXECUTE FUNCTION update_outreach_totals();

DROP TRIGGER IF EXISTS update_outreach_totals_on_participant ON outreach_participants;
CREATE TRIGGER update_outreach_totals_on_participant
AFTER INSERT OR UPDATE OR DELETE ON outreach_participants
FOR EACH ROW
EXECUTE FUNCTION update_outreach_totals();

-- RLS Policies
ALTER TABLE outreach_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_outreach ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_expenses ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read locations
DROP POLICY IF EXISTS "Allow authenticated users to read locations" ON outreach_locations;
CREATE POLICY "Allow authenticated users to read locations"
    ON outreach_locations FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to add custom locations
DROP POLICY IF EXISTS "Allow authenticated users to add custom locations" ON outreach_locations;
CREATE POLICY "Allow authenticated users to add custom locations"
    ON outreach_locations FOR INSERT
    TO authenticated
    WITH CHECK (is_custom = true);

-- Community outreach policies
DROP POLICY IF EXISTS "Allow authenticated users to read outreach events" ON community_outreach;
CREATE POLICY "Allow authenticated users to read outreach events"
    ON community_outreach FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to create outreach events" ON community_outreach;
CREATE POLICY "Allow authenticated users to create outreach events"
    ON community_outreach FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow users to update their own outreach events" ON community_outreach;
CREATE POLICY "Allow users to update their own outreach events"
    ON community_outreach FOR UPDATE
    TO authenticated
    USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Allow users to delete their own outreach events" ON community_outreach;
CREATE POLICY "Allow users to delete their own outreach events"
    ON community_outreach FOR DELETE
    TO authenticated
    USING (created_by = auth.uid());

-- Participants policies
DROP POLICY IF EXISTS "Allow authenticated users to read participants" ON outreach_participants;
CREATE POLICY "Allow authenticated users to read participants"
    ON outreach_participants FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to manage participants" ON outreach_participants;
CREATE POLICY "Allow authenticated users to manage participants"
    ON outreach_participants FOR ALL
    TO authenticated
    USING (true);

-- Expenses policies
DROP POLICY IF EXISTS "Allow authenticated users to read expenses" ON outreach_expenses;
CREATE POLICY "Allow authenticated users to read expenses"
    ON outreach_expenses FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to manage expenses" ON outreach_expenses;
CREATE POLICY "Allow authenticated users to manage expenses"
    ON outreach_expenses FOR ALL
    TO authenticated
    USING (true);
