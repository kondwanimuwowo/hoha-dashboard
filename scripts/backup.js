import { createClient } from '@supabase/supabase-js'
import fs from 'fs/promises'
import path from 'path'
import { gzipSync } from 'zlib'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables from .env and .env.local files
dotenv.config({ path: path.join(__dirname, '..', '.env') })
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
// The anon key is subject to row-level security, so it silently returns empty
// tables instead of failing. Only the service role key produces a full backup.
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
    console.error('   Find the service role key in Supabase: Project Settings > API.')
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
})

const PAGE_SIZE = 1000
const ORDER_KEYS = { user_preferences: 'user_id' }
const BACKUP_BUCKET = 'database-backups'

async function uploadToStorage(timestamp, json) {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    if (listError) throw listError

    if (!buckets.some((b) => b.name === BACKUP_BUCKET)) {
        const { error } = await supabase.storage.createBucket(BACKUP_BUCKET, { public: false })
        if (error) throw error
        console.log(`🪣 Created private storage bucket: ${BACKUP_BUCKET}`)
    }

    const objectPath = `${timestamp}/backup.json.gz`
    const { error } = await supabase.storage
        .from(BACKUP_BUCKET)
        .upload(objectPath, gzipSync(json), { contentType: 'application/gzip', upsert: true })
    if (error) throw error

    return objectPath
}

// Tables to backup
const TABLES = [
    'people',
    'relationships',
    'government_schools',
    'educare_enrollment',
    'tuition_schedule',
    'tuition_attendance',
    'legacy_women_enrollment',
    'legacy_program_attendance',
    'clinicare_visits',
    'food_distribution',
    'food_recipients',
    'medical_facilities',
    'emergency_relief_distributions',
    'emergency_relief_recipients',
    'user_profiles',
    'user_preferences',
    'case_notes',
    'student_documents',
    'parent_emergency_contacts',
    'health_facilities',
    'outreach_locations',
    'community_outreach',
    'outreach_participants',
    'outreach_expenses',
    'school_awards',
    'award_recipients',
    'award_resource_types',
    'award_event_resources',
    'notification_reads',
    'deworming_events',
    'deworming_records',
    'person_documents',
    'family_members',
]

// Supabase caps a single select at 1000 rows, so larger tables must be paged
// or the backup is silently truncated.
async function fetchTable(table) {
    const { count, error: countError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
    if (countError) throw countError

    const orderKey = ORDER_KEYS[table] || 'id'
    let rows = []
    for (let from = 0; from < count; from += PAGE_SIZE) {
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .order(orderKey, { ascending: true })
            .range(from, from + PAGE_SIZE - 1)
        if (error) throw error
        rows = rows.concat(data ?? [])
    }

    if (rows.length !== count) {
        throw new Error(`expected ${count} rows but fetched ${rows.length}`)
    }
    return rows
}

async function backupDatabase() {
    const timestamp = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const backupDir = path.join(__dirname, '..', 'backups', timestamp)
    const failures = []

    try {
        await fs.mkdir(backupDir, { recursive: true })
        console.log(`📁 Created backup directory: ${backupDir}`)

        const backup = {
            timestamp: new Date().toISOString(),
            tables: {}
        }

        for (const table of TABLES) {
            try {
                console.log(`⏳ Backing up ${table}...`)
                const data = await fetchTable(table)
                backup.tables[table] = { count: data.length, data }
                console.log(`✅ Backed up ${table}: ${data.length} rows`)
            } catch (err) {
                failures.push({ table, error: err.message })
                console.error(`❌ Failed to back up ${table}: ${err.message}`)
            }
        }

        // Save to file
        const json = JSON.stringify(backup, null, 2)
        const backupFile = path.join(backupDir, 'backup.json')
        await fs.writeFile(backupFile, json)

        // Create summary
        const summary = {
            timestamp: backup.timestamp,
            tables: Object.entries(backup.tables).map(([name, info]) => ({
                name,
                rows: info.count
            })),
            totalRows: Object.values(backup.tables).reduce((sum, t) => sum + t.count, 0),
            failures,
        }

        const summaryFile = path.join(backupDir, 'summary.json')
        await fs.writeFile(summaryFile, JSON.stringify(summary, null, 2))

        console.log(`📊 Total rows backed up: ${summary.totalRows}`)
        console.log(`📁 Location: ${backupDir}`)

        if (failures.length > 0) {
            console.error(`\n❌ Backup INCOMPLETE: ${failures.length} table(s) failed: ${failures.map(f => f.table).join(', ')}`)
            process.exit(1)
        }

        const objectPath = await uploadToStorage(timestamp, json)
        console.log(`☁️  Uploaded to Supabase Storage: ${BACKUP_BUCKET}/${objectPath}`)

        console.log('\n✅ Backup completed successfully!')
    } catch (error) {
        console.error('❌ Backup failed:', error.message)
        process.exit(1)
    }
}

backupDatabase()
