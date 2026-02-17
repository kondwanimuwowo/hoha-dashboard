import { createClient } from '@supabase/supabase-js'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables from .env and .env.local files
dotenv.config({ path: path.join(__dirname, '..', '.env') })
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

// Load environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing Supabase credentials in .env file')
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

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
    'health_facilities'
]

async function backupDatabase() {
    const timestamp = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const backupDir = path.join(__dirname, '..', 'backups', timestamp)

    try {
        // Create backup directory
        await fs.mkdir(backupDir, { recursive: true })
        console.log(`📁 Created backup directory: ${backupDir}`)

        const backup = {
            timestamp: new Date().toISOString(),
            tables: {}
        }

        // Backup each table
        for (const table of TABLES) {
            try {
                console.log(`⏳ Backing up ${table}...`)
                const { data, error } = await supabase.from(table).select('*')

                if (error) {
                    console.warn(`⚠️  Warning: Could not backup ${table}: ${error.message}`)
                    continue
                }

                backup.tables[table] = {
                    count: data?.length || 0,
                    data: data || []
                }

                console.log(`✅ Backed up ${table}: ${data?.length || 0} rows`)
            } catch (err) {
                console.warn(`⚠️  Warning: Error backing up ${table}: ${err.message}`)
            }
        }

        // Save to file
        const backupFile = path.join(backupDir, 'backup.json')
        await fs.writeFile(backupFile, JSON.stringify(backup, null, 2))

        // Create summary
        const summary = {
            timestamp: backup.timestamp,
            tables: Object.entries(backup.tables).map(([name, info]) => ({
                name,
                rows: info.count
            })),
            totalRows: Object.values(backup.tables).reduce((sum, t) => sum + t.count, 0)
        }

        const summaryFile = path.join(backupDir, 'summary.json')
        await fs.writeFile(summaryFile, JSON.stringify(summary, null, 2))

        console.log('\n✅ Backup completed successfully!')
        console.log(`📊 Total rows backed up: ${summary.totalRows}`)
        console.log(`📁 Location: ${backupDir}`)

    } catch (error) {
        console.error('❌ Backup failed:', error.message)
        process.exit(1)
    }
}

backupDatabase()
