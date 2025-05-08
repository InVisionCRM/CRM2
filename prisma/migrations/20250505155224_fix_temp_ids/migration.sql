-- Fix any leads with temporary IDs
DO $$
DECLARE
    temp_lead RECORD;
BEGIN
    FOR temp_lead IN 
        SELECT id 
        FROM "Lead" 
        WHERE id LIKE 'temp-%'
    LOOP
        -- Update the lead with a new UUID
        UPDATE "Lead"
        SET id = gen_random_uuid()
        WHERE id = temp_lead.id;
    END LOOP;
END $$; 