---
description: HOHA Dashboard Cleanup and Enhancement Plan
---

# HOHA Dashboard Cleanup and Enhancement Implementation Plan

## Overview
This plan addresses 13 major improvement areas for the HOHA Dashboard system.

## Phase 1: Form Improvements (Items 1, 2, 6)
### 1.1 Student Form Cleanup
- [x] Remove phone_number field from student personal information section
- [x] Remove compound_area field from student personal information section
- [x] Keep these fields in the database schema (people table) for data integrity
- [x] Only hide from the new student registration form

### 1.2 Emergency Contact Memory System
**Database Changes:**
- [x] Create new table: `parent_emergency_contacts` to store emergency contact preferences per parent (Implemented in `008`)
- [x] Schema implemented in migration files.

**Frontend Changes:**
- [x] When a parent is linked/selected, check if they have a saved emergency contact
- [x] Auto-populate emergency contact fields if found
- [x] Save emergency contact to parent_emergency_contacts when first child is registered
- [x] Update StudentForm.jsx to implement this logic

### 1.3 Enrollment Date Fallback
- [x] Make enrollment_date optional in validation schema
- [x] Set default to NULL instead of current date if not provided
- [x] Update form to show placeholder text: "Leave blank if unknown"
- [x] Handle NULL enrollment dates in display components

## Phase 2: Records Management (Item 3)

### 2.1 Delete Functionality
**Database:**
- [x] Add soft delete support: `deleted_at` column to people, educare_enrollment, legacy_women_enrollment
- [x] Create migration: `008_enhanced_features.sql`

**Frontend:**
- [x] Add delete button to StudentProfile.jsx
- [x] Add delete button to WomanProfile.jsx
- [x] Create confirmation dialog component
- [x] Implement soft delete in useStudents.js hook
- [x] Implement soft delete in useWomen.js hook
- [x] Filter out deleted records in list views

### 2.2 Edit Functionality
**Fix Update Buttons:**
- [x] Debug useUpdateStudent hook
- [x] Debug useUpdateWoman hook
- [x] Ensure StudentForm properly handles initialData for editing
- [x] Ensure WomenForm properly handles initialData for editing
- [x] Test update flow end-to-end

**Student Status Management:**
- [x] Add status dropdown to StudentProfile: Active, Graduated, Withdrawn, Transferred
- [x] Create useUpdateStudentStatus hook
- [x] Add graduation date field (shows when status = Graduated)
- [x] Update educare_enrollment.current_status field

## Phase 3: Grade Progression (Item 4)

### 3.1 Automatic Grade Advancement
**Database:**
- [x] Create function: `promote_all_students()` for bulk progression (Implemented in `012`)
- [x] Create admin utility to run at year-end

**Frontend:**
- [x] Create Academic Year Management tool in Settings.jsx
- [x] Batch update with confirmation
- [x] Auto-graduate Grade 12 students

### 3.2 Manual Grade Adjustment
- [x] Support grade changes via StudentForm/Profile updates.

## Phase 4: Student Records Enhancement (Item 5)

### 4.1 Printable Records
- [x] Add print support to StudentProfile.jsx and WomanProfile.jsx (using browser print with custom styles)

### 4.2 Document Uploads
**Database:**
- [x] Create table: `student_documents` (Implemented in `008`)
- [x] Setup Storage Buckets: `student-documents` and `photos` (Implemented in `011`)

**Frontend:**
- [x] Create StudentDocuments component
- [x] Add documents section to StudentProfile
- [x] List uploaded documents with download links
- [x] Support multiple file types (PDF, JPG, PNG, DOC)

### 4.3 Case Notes
**Database:**
- [x] Create table: `case_notes` (Implemented in `008`)

**Frontend:**
- [x] Add Case Notes tab to StudentProfile and WomanProfile
- [x] Create CaseNote component with RichTextEditor
- [x] Display case notes timeline
- [x] Allow creation/editing/deletion of notes

## Phase 5: CliniCare Improvements (Items 7-12)

### 5.1 Fix Patient Not Found Error
- [x] Debug patient lookup (relaxed `is_active` filter and removed invalid relationship)
- [x] Ensure patient is discoverable even if not active in a program

### 5.2 Editable Visits
- [x] Add edit button to visits table
- [x] Update VisitForm.jsx to support editing
- [x] Implement useUpdateVisit hook

### 5.3 Currency Fix
- [x] Change all "MK" references to "ZMW"
- [x] Update global `formatCurrency` utility in `src/lib/utils.js`

### 5.4 Enhanced Follow-ups
- [x] Integrated follow-up required flag and date selection.
- [x] Added Follow-ups dashboard overview.

### 5.5 Cost Calculation
**Database:**
- [x] Add `other_fees` column to clinicare_visits (Implemented in `009`)

**Frontend:**
- [x] Add "Other Fees" input to VisitForm
- [x] Auto-calculate total: medical_fees + transport_costs + other_fees

## Phase 6: Distribution System Overhaul (Item 13)

### 6.1 Family Detection System
**Database:**
- [x] Create DO block and intelligent view: `family_groups` (Implemented in `010`)
  - Correctly groups Women + Children, Sibling Groups, and Individual Children.

**Frontend:**
- [x] Add "Family Groups" tab to AddRecipientDialog.jsx
- [x] Show family structure (head + member count)
- [x] Auto-calculate family_size from group data

### 6.2 Smart Recipient Grouping
- [x] Unified collection recording for entire family groups.
- [x] Support for individual recipients when not in a group.

## Migration Files Created

1. `008_enhanced_features.sql` - Core schema (soft delete, notes, docs, emergency contacts)
2. `009_clinicare_enhancements.sql` - Other fees, facilities, updated visit schema
3. `010_family_groups_distribution.sql` - Intelligent family detection view
4. `011_storage_setup.sql` - Supabase storage buckets and RLS
5. `012_grade_progression.sql` - End-of-year administrative tools

## TESTING & VERIFICATION

- [x] Run all 5 migrations in Supabase SQL Editor.
- [x] Verify Patient lookup works for community members.
- [x] Verify ZMW currency display across CliniCare.
- [x] Verify "Academic Year Management" in Settings.
- [x] Verify "Family Groups" tab when adding distribution recipients.
- [x] Verify Document storage uploads (requires `011` migration).