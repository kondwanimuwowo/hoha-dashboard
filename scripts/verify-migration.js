import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uxewirvydfvkpmlucyos.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_fFyGSSn36M25gyqAtpWCaw_eUC14wA6';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function verify() {
    console.log('Verifying migration results...');
    const tables = [
        'people',
        'relationships',
        'educare_enrollment',
        'clinicare_visits',
        'legacy_women_enrollment'
    ];

    const results = [];
    for (const table of tables) {
        const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

        if (error) {
            results.push({ table, count: 'Error', message: error.message });
        } else {
            results.push({ table, count });
        }
    }

    console.table(results);
    process.exit(0);
}

verify().catch(err => {
    console.error(err);
    process.exit(1);
});
