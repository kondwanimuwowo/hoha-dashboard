-- Migration: Auto-populate food distribution recipients
-- Automatically generates a list of recipients (one per household) for every new distribution

CREATE OR REPLACE FUNCTION public.auto_populate_food_recipients()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert all households from family_groups view into the new distribution
    INSERT INTO public.food_recipients (
        distribution_id,
        family_head_id,
        family_size,
        family_type,
        primary_person_id,
        family_member_ids,
        is_collected
    )
    SELECT 
        NEW.id,
        recipient_id,
        family_size,
        family_type,
        primary_person_id,
        family_member_ids,
        false
    FROM public.family_groups;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to food_distribution table
DROP TRIGGER IF EXISTS tr_auto_populate_food_recipients ON public.food_distribution;
CREATE TRIGGER tr_auto_populate_food_recipients
AFTER INSERT ON public.food_distribution
FOR EACH ROW
EXECUTE FUNCTION public.auto_populate_food_recipients();
