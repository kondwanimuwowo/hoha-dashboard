import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uxewirvydfvkpmlucyos.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_fFyGSSn36M25gyqAtpWCaw_eUC14wA6';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

function normalize(s) {
    return (s || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

async function cleanup() {
    console.log('--- Step 1: Deduplicating People ---');

    // 1. Fetch all people
    const { data: people, error } = await supabase.from('people').select('*');
    if (error) throw error;

    const masterMap = new Map(); // normalized name -> master person record
    const duplicates = [];

    // Identify duplicates
    for (const p of people) {
        const norm = normalize(`${p.first_name} ${p.last_name}`);
        if (!masterMap.has(norm)) {
            masterMap.set(norm, p);
        } else {
            const master = masterMap.get(norm);
            // Keep the one with more info (phone, dob) or just the older one
            const masterScore = (master.phone_number ? 2 : 0) + (master.date_of_birth ? 2 : 0) + (master.created_at < p.created_at ? 1 : 0);
            const currentScore = (p.phone_number ? 2 : 0) + (p.date_of_birth ? 2 : 0);

            if (currentScore > masterScore) {
                duplicates.push(master.id);
                masterMap.set(norm, p);
            } else {
                duplicates.push(p.id);
            }
        }
    }

    console.log(`Found ${duplicates.length} duplicate people.`);

    if (duplicates.length > 0) {
        // Fix References
        console.log('Merging duplicate references...');
        // We need to map dupId -> masterId
        // This is tricky because we just have a list of dups. Re-construct the map.
        const dupToMaster = new Map();
        for (const p of people) {
            const norm = normalize(`${p.first_name} ${p.last_name}`);
            const master = masterMap.get(norm);
            if (p.id !== master.id) {
                dupToMaster.set(p.id, master.id);
            }
        }

        const tables = [
            { name: 'relationships', col: 'person_id' },
            { name: 'relationships', col: 'related_person_id' },
            { name: 'educare_enrollment', col: 'child_id' },
            { name: 'clinicare_visits', col: 'patient_id' },
            { name: 'legacy_women_enrollment', col: 'woman_id' },
            { name: 'case_notes', col: 'person_id' },
            { name: 'student_documents', col: 'student_id' },
            { name: 'food_recipients', col: 'family_head_id' }
        ];

        for (const [dupId, masterId] of dupToMaster.entries()) {
            for (const t of tables) {
                await supabase.from(t.name).update({ [t.col]: masterId }).eq(t.col, dupId);
            }
        }

        console.log('Deleting duplicate people...');
        // Batched delete
        for (let i = 0; i < duplicates.length; i += 100) {
            await supabase.from('people').delete().in('id', duplicates.slice(i, i + 100));
        }
    } else {
        console.log('No duplicate people found.');
    }

    console.log('\n--- Step 2: Deduplicating Related Records ---');

    // Helper to deduplicate any table by a grouping key (e.g., student_id)
    async function deduplicateTable(tableName, groupCol, orderBy = 'created_at') {
        console.log(`Checking ${tableName}...`);
        const { data: records, error: tError } = await supabase.from(tableName).select('*').order(orderBy);
        if (tError) {
            console.error(`Error fetching ${tableName}:`, tError);
            return;
        }

        const seen = new Set();
        const idsToDelete = [];

        for (const r of records) {
            // Unique key: groupID + (maybe some other distinction?)
            // For enrollments: child_id is enough (one active enrollment per child)
            // For legacy: woman_id + stage?
            // For visits: patient_id + date + provider?

            let key = '';
            if (tableName === 'educare_enrollment') {
                key = r.child_id; // Only one enrollment per child
            } else if (tableName === 'legacy_women_enrollment') {
                key = `${r.woman_id}_${r.stage}`;
            } else if (tableName === 'clinicare_visits') {
                // Allow multiple visits on same day? Yes. But duplicate imports will look identical.
                // Key: patient_id + date + reason
                key = `${r.patient_id}_${r.visit_date}_${r.reason_for_visit}_${r.cost_amount}`;
            } else if (tableName === 'relationships') {
                key = `${r.person_id}_${r.related_person_id}_${r.relationship_type}`;
            }

            if (seen.has(key)) {
                idsToDelete.push(r.id);
            } else {
                seen.add(key);
            }
        }

        if (idsToDelete.length > 0) {
            console.log(`Removing ${idsToDelete.length} duplicates from ${tableName}...`);
            for (let i = 0; i < idsToDelete.length; i += 100) {
                await supabase.from(tableName).delete().in('id', idsToDelete.slice(i, i + 100));
            }
        } else {
            console.log(`No duplicates in ${tableName}.`);
        }
    }

    await deduplicateTable('educare_enrollment', 'child_id');
    await deduplicateTable('legacy_women_enrollment', 'woman_id');
    await deduplicateTable('clinicare_visits', 'patient_id'); // Uses complex key
    await deduplicateTable('relationships', 'person_id'); // Uses complex key

    console.log('\nCleanup Complete!');
    process.exit(0);
}

cleanup().catch(err => {
    console.error(err);
    process.exit(1);
});
