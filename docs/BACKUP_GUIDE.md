# Database Backup Guide

## Quick Backup

To create a backup of your entire database:

```bash
npm run backup
```

This will create a backup in `backups/YYYY-MM-DD/` with:
- `backup.json` - Full database export (all tables)
- `summary.json` - Backup metadata and row counts

## What Gets Backed Up

The backup includes all data from these tables:
- People & Relationships
- Educare (enrollment, attendance, schedules)
- Legacy Women's Program
- CliniCare visits
- Food & Emergency Relief distributions
- Medical facilities
- User profiles & preferences
- Case notes & documents

## Backup Location

All backups are stored in `backups/YYYY-MM-DD/` directory (gitignored for security).

Example: `backups/2026-02-17/backup.json`

## Restore from Backup

To restore data from a backup, you can:

1. **Manual restore via Supabase SQL Editor:**
   - Open the `backup.json` file
   - Use the data to create INSERT statements
   - Run them in the SQL Editor

2. **Programmatic restore (future enhancement):**
   - A restore script can be created if needed

## Best Practices

- **Run backups regularly** (weekly or before major changes)
- **Keep multiple backups** (don't delete old ones immediately)
- **Test restores** occasionally to ensure backups work
- **Store backups externally** (copy to cloud storage or external drive)

## Backup Size

The backup files are JSON format and can be large depending on your data. Current backup size is approximately 1-5 MB for typical usage.
