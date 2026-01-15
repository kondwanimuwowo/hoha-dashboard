import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

// Config
const SUPABASE_URL = 'https://uxewirvydfvkpmlucyos.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_fFyGSSn36M25gyqAtpWCaw_eUC14wA6';
const PUBLIC_DIR = './public';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

function parseCSV(content) {
    const rows = [];
    let currentField = '';
    let currentRow = [];
    let inQuotes = false;

    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        const nextChar = content[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                currentField += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            currentRow.push(currentField.trim());
            currentField = '';
        } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuotes) {
            currentRow.push(currentField.trim());
            rows.push(currentRow);
            currentRow = [];
            currentField = '';
            if (char === '\r') i++;
        } else {
            currentField += char;
        }
    }
    if (currentField || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        rows.push(currentRow);
    }

    const headers = rows[0].map(h => h.replace(/^"|"$/g, '').trim());
    return rows.slice(1).map(row => {
        return headers.reduce((obj, header, i) => {
            let val = row[i] || '';
            if (val.startsWith('"') && val.endsWith('"')) {
                val = val.substring(1, val.length - 1).replace(/""/g, '"');
            }
            obj[header] = val;
            return obj;
        }, {});
    });
}

function normalizeName(first, last) {
    if (!first && !last) return '';
    return `${first?.trim() || ''} ${last?.trim() || ''}`.trim().toLowerCase().replace(/\s+/g, ' ');
}

async function migrate() {
    console.log('Starting robust migration...');

    // 1. Load Data
    const studentsRaw = parseCSV(await fs.readFile(path.join(PUBLIC_DIR, 'Students-All students.csv'), 'utf8'));
    const formerStudentsRaw = parseCSV(await fs.readFile(path.join(PUBLIC_DIR, 'Former HOHA Clients-All students.csv'), 'utf8'));
    const guardiansRaw = parseCSV(await fs.readFile(path.join(PUBLIC_DIR, 'Guardians-All Parents.csv'), 'utf8'));
    const legacyWomenRaw = parseCSV(await fs.readFile(path.join(PUBLIC_DIR, 'Legacy Women Participants Participants 2024-All Stages.csv'), 'utf8'));
    const clinicareRaw = parseCSV(await fs.readFile(path.join(PUBLIC_DIR, 'Clinicare Incidences-All.csv'), 'utf8'));

    // Fetch existing people
    const { data: existingPeople } = await supabase.from('people').select('id, first_name, last_name');
    const nameToId = new Map(existingPeople?.map(p => [normalizeName(p.first_name, p.last_name), p.id]) || []);

    const peopleToInsertMap = new Map();

    function addPerson(first, last, extra = {}) {
        if (!first && !last) return;
        const norm = normalizeName(first, last);
        if (!norm || nameToId.has(norm)) return;

        const person = {
            first_name: (first || 'Unknown').substring(0, 100),
            last_name: (last || 'TBD').substring(0, 100),
            ...extra
        };
        peopleToInsertMap.set(norm, person);
    }

    // 2. Collection
    for (const g of guardiansRaw) {
        if (!g.Name) continue;
        const parts = g.Name.split(' ');
        addPerson(parts[0], parts.slice(1).join(' '), { phone_number: g.Phone, is_active: true });
    }

    for (const s of [...studentsRaw, ...formerStudentsRaw]) {
        const isArchive = s.Archive?.toLowerCase() === 'checked' || s.Archive === 'true';
        addPerson(s['First name'], s['Last name'], {
            gender: s.Gender || null,
            date_of_birth: s['Date Of Birth'] || null,
            is_active: !isArchive
        });
    }

    for (const w of legacyWomenRaw) {
        if (!w.Name) continue;
        const parts = w.Name.split(' ');
        addPerson(parts[0], parts.slice(1).join(' '), { phone_number: w.Phone, is_active: true });
    }

    for (const v of clinicareRaw) {
        if (!v.Patient || v.Patient.toLowerCase().includes('unnamed') || v.Patient.toLowerCase().includes('record') || v.Patient.length > 100) continue;
        const parts = v.Patient.split(' ');
        addPerson(parts[0], parts.slice(1).join(' '), { is_active: true });
    }

    // 3. Insert People
    if (peopleToInsertMap.size > 0) {
        const peopleArray = Array.from(peopleToInsertMap.values()).map(p => {
            if (p.date_of_birth?.includes('/')) {
                const [d, m, y] = p.date_of_birth.split('/');
                if (y && m && d) p.date_of_birth = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                else p.date_of_birth = null;
            }
            return p;
        });

        for (let i = 0; i < peopleArray.length; i += 50) {
            const batch = peopleArray.slice(i, i + 50);
            const { data, error } = await supabase.from('people').insert(batch).select();
            if (error) console.error('Error Inserting People:', error.message);
            else if (data) data.forEach(p => nameToId.set(normalizeName(p.first_name, p.last_name), p.id));
        }
    }

    // 4. Enrollments & Visits
    console.log('Inserting Enrollments, Visits, and Relationships...');
    const enrollments = [];
    for (const s of [...studentsRaw, ...formerStudentsRaw]) {
        const pId = nameToId.get(normalizeName(s['First name'], s['Last name']));
        if (!pId) continue;
        enrollments.push({
            child_id: pId,
            grade_level: s.Grade || s['Last Grade Attained'] || 'TBD',
            notes: (s.School || s['Last School Attended'] || '').substring(0, 500),
            current_status: s.Archive === 'checked' ? 'Withdrawn' : 'Active'
        });
    }
    if (enrollments.length > 0) await supabase.from('educare_enrollment').upsert(enrollments);

    const visits = [];
    for (const v of clinicareRaw) {
        const pId = nameToId.get(normalizeName(...(v.Patient || '').split(' ')));
        if (!pId) continue;
        let vDate = v.Date;
        if (vDate?.includes('/')) {
            const [d, m, y] = vDate.split('/');
            if (y && m && d) vDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
        visits.push({
            patient_id: pId,
            visit_date: vDate || new Date().toISOString().split('T')[0],
            facility_name: v.Provider?.substring(0, 200) || null,
            reason_for_visit: v.Condition?.substring(0, 500) || null,
            treatment_provided: v.Procedure?.substring(0, 500) || null,
            notes: (v.Notes || '').substring(0, 2000),
            cost_amount: parseFloat(v['Total Cost']?.replace(/[^\d.]/g, '') || '0')
        });
    }
    if (visits.length > 0) await supabase.from('clinicare_visits').upsert(visits);

    console.log('Migration finished successfully!');
    process.exit(0);
}

migrate();
