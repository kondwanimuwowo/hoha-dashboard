#!/bin/bash
# Database Backup Script for HOHA Dashboard
# This script creates a full backup of the Supabase database

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="hoha_backup_${TIMESTAMP}.sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "Starting database backup..."
echo "Backup file: $BACKUP_DIR/$BACKUP_FILE"

# Use Supabase CLI to dump the database
npx supabase db dump -f "$BACKUP_DIR/$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Backup completed successfully!"
    echo "📁 Location: $BACKUP_DIR/$BACKUP_FILE"
    
    # Compress the backup
    gzip "$BACKUP_DIR/$BACKUP_FILE"
    echo "🗜️  Compressed to: $BACKUP_DIR/$BACKUP_FILE.gz"
else
    echo "❌ Backup failed!"
    exit 1
fi
