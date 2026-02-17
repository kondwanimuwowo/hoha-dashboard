@echo off
REM Database Backup Script for HOHA Dashboard (Windows)
REM This script creates a full backup of the Supabase database

setlocal enabledelayedexpansion

REM Configuration
set BACKUP_DIR=backups
set TIMESTAMP=%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_FILE=hoha_backup_%TIMESTAMP%.sql

REM Create backup directory if it doesn't exist
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

echo Starting database backup...
echo Backup file: %BACKUP_DIR%\%BACKUP_FILE%

REM Use Supabase CLI to dump the database
npx supabase db dump -f "%BACKUP_DIR%\%BACKUP_FILE%"

if %errorlevel% equ 0 (
    echo ✅ Backup completed successfully!
    echo 📁 Location: %BACKUP_DIR%\%BACKUP_FILE%
) else (
    echo ❌ Backup failed!
    exit /b 1
)

endlocal
