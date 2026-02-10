import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    flexRender,
} from '@tanstack/react-table'
import { PersonAvatar } from '@/components/shared/PersonAvatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ArrowUpDown,
    ChevronsUpDown,
    Check,
    Edit2,
    Save,
    Loader2,
    AlertCircle,
    CheckCircle2
} from 'lucide-react'
import { calculateAge } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useUpdateStudent } from '@/hooks/useStudents'
import { useParents } from '@/hooks/usePeople'
import { useSchools } from '@/hooks/useSchools'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { GRADE_LEVELS } from '@/lib/constants'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

// Editable row component for inline editing
function EditableRow({ row, onSave, onValuesChange, isSaving, schools, parentOptions }) {
    const normalizeText = (value) => (value || '').trim().toLowerCase()
    const inferParentId = () => {
        if (row.parent_id) return row.parent_id

        const normalizedParentName = normalizeText(row.parent_name)
        const normalizedParentPhone = normalizeText(row.parent_phone)
        if (!normalizedParentName && !normalizedParentPhone) return '__none__'

        const match = (parentOptions || []).find((parent) => {
            const fullName = normalizeText(`${parent.first_name} ${parent.last_name}`)
            const phone = normalizeText(parent.phone_number)
            if (normalizedParentPhone && phone) {
                return normalizedParentPhone === phone
            }
            return normalizedParentName && fullName === normalizedParentName
        })

        return match?.id || '__none__'
    }

    const initialParentId = inferParentId()
    const [parentOpen, setParentOpen] = useState(false)
    const [values, setValues] = useState({
        first_name: row.first_name || '',
        last_name: row.last_name || '',
        date_of_birth: row.date_of_birth || '',
        grade_level: row.grade_level || '',
        government_school_id: row.government_school_id || '__none__',
        parent_id: initialParentId,
        parent_phone: row.parent_phone || '',
    })

    // Check if any value has changed from original
    const hasChanges =
        values.first_name !== (row.first_name || '') ||
        values.last_name !== (row.last_name || '') ||
        values.date_of_birth !== (row.date_of_birth || '') ||
        values.grade_level !== (row.grade_level || '') ||
        values.government_school_id !== (row.government_school_id || '__none__') ||
        values.parent_id !== initialParentId ||
        values.parent_phone !== (row.parent_phone || '')

    const handleChange = (field, value) => {
        const newValues = { ...values, [field]: value }
        if (field === 'parent_id') {
            if (value === '__none__') {
                newValues.parent_phone = ''
            } else {
                const selectedParent = parentOptions.find((parent) => parent.id === value)
                newValues.parent_phone = selectedParent?.phone_number || ''
            }
        }
        setValues(newValues)
        onValuesChange?.(row.id, newValues, initialParentId, hasChanges || field !== values[field])
    }

    const handleSave = () => {
        onSave(row.id, values, initialParentId)
    }

    const selectedParent = values.parent_id !== '__none__'
        ? (parentOptions || []).find((parent) => parent.id === values.parent_id)
        : null

    const parentLabel = selectedParent
        ? `${selectedParent.first_name} ${selectedParent.last_name}`
        : (row.parent_name || 'No parent linked')

    return (
        <tr className={cn(
            "border-b transition-colors",
            hasChanges ? "bg-red-50/50 border-red-100" : "bg-amber-50/50 border-amber-100"
        )}>
            <td className="px-4 py-2">
                <PersonAvatar
                    photoUrl={row.photo_url}
                    gender={row.gender}
                    firstName={row.first_name}
                    lastName={row.last_name}
                />
            </td>
            <td className="px-2 py-2">
                <Input
                    value={values.first_name}
                    onChange={(e) => handleChange('first_name', e.target.value)}
                    className={cn("h-8 text-sm", hasChanges && "border-red-300 focus:border-red-500")}
                />
            </td>
            <td className="px-2 py-2">
                <Input
                    value={values.last_name}
                    onChange={(e) => handleChange('last_name', e.target.value)}
                    className={cn("h-8 text-sm", hasChanges && "border-red-300 focus:border-red-500")}
                />
            </td>
            <td className="px-2 py-2">
                <div className="text-sm text-neutral-500">{row.gender}</div>
            </td>
            <td className="px-2 py-2">
                <Input
                    type="date"
                    value={values.date_of_birth}
                    onChange={(e) => handleChange('date_of_birth', e.target.value)}
                    className={cn("h-8 text-sm", hasChanges && "border-red-300 focus:border-red-500")}
                />
            </td>
            <td className="px-2 py-2">
                <Select
                    value={values.grade_level}
                    onValueChange={(value) => handleChange('grade_level', value)}
                >
                    <SelectTrigger className={cn("h-8 text-sm", hasChanges && "border-red-300")}>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {GRADE_LEVELS.map((grade) => (
                            <SelectItem key={grade} value={grade}>
                                {grade}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </td>
            <td className="px-2 py-2">
                <Select
                    value={values.government_school_id}
                    onValueChange={(value) => handleChange('government_school_id', value)}
                >
                    <SelectTrigger className={cn("h-8 text-sm", hasChanges && "border-red-300")}>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__none__">HOHA Only</SelectItem>
                        {(schools || []).map((school) => (
                            <SelectItem key={school.id} value={school.id}>
                                {school.school_name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </td>
            <td className="px-2 py-2">
                <Popover open={parentOpen} onOpenChange={setParentOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={parentOpen}
                            className={cn(
                                "h-8 w-full justify-between text-sm",
                                hasChanges && "border-red-300"
                            )}
                        >
                            {parentLabel}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[320px] p-0">
                        <Command>
                            <CommandInput placeholder="Search parent/guardian..." />
                            <CommandList className="max-h-72">
                                <CommandEmpty>No parent found.</CommandEmpty>
                                <CommandGroup>
                                    <CommandItem
                                        value="No parent linked"
                                        onSelect={() => {
                                            handleChange('parent_id', '__none__')
                                            setParentOpen(false)
                                        }}
                                    >
                                        <Check className={cn("mr-2 h-4 w-4", values.parent_id === '__none__' ? "opacity-100" : "opacity-0")} />
                                        No parent linked
                                    </CommandItem>
                                    {(parentOptions || []).map((parent) => {
                                        const fullName = `${parent.first_name} ${parent.last_name}`
                                        const searchable = `${fullName} ${parent.phone_number || ''}`
                                        return (
                                            <CommandItem
                                                key={parent.id}
                                                value={searchable}
                                                onSelect={() => {
                                                    handleChange('parent_id', parent.id)
                                                    setParentOpen(false)
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        values.parent_id === parent.id ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                <span>{fullName}</span>
                                                {parent.phone_number && (
                                                    <span className="ml-2 text-xs text-muted-foreground">
                                                        {parent.phone_number}
                                                    </span>
                                                )}
                                            </CommandItem>
                                        )
                                    })}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </td>
            <td className="px-2 py-2">
                <Input
                    value={values.parent_phone}
                    className={cn("h-8 text-sm", hasChanges && "border-red-300 focus:border-red-500")}
                    placeholder="Phone"
                    disabled
                />
            </td>
            <td className="px-2 py-2">
                <Badge variant={row.current_status === 'Active' ? 'success' : 'secondary'}>
                    {row.current_status}
                </Badge>
            </td>
            <td className="px-2 py-2">
                <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving || !hasChanges}
                    className={cn(
                        "h-8 transition-all",
                        hasChanges
                            ? "bg-red-500 hover:bg-red-600 text-white"
                            : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                    )}
                    variant={hasChanges ? "destructive" : "secondary"}
                >
                    {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <span className="flex items-center">
                            <Save className="h-4 w-4 mr-1" />
                            Save
                        </span>
                    )}
                </Button>
            </td>
        </tr>
    )
}

export function StudentTable({ data, onRowClick, sorting, onSortingChange }) {
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 })
    const [isQuickEdit, setIsQuickEdit] = useState(false)
    const [savingRowId, setSavingRowId] = useState(null)
    const [isSavingAll, setIsSavingAll] = useState(false)
    const [dirtyRows, setDirtyRows] = useState({}) // { [id]: { values, parentId } }
    const [showExitWarning, setShowExitWarning] = useState(false)

    const queryClient = useQueryClient()
    const updateStudent = useUpdateStudent()
    const { data: schools = [] } = useSchools()
    const { data: parents = [], isLoading: isLoadingParents } = useParents('')

    const hasUnsavedChanges = Object.keys(dirtyRows).length > 0

    const handleValuesChange = (studentId, values, parentId, isDirty) => {
        setDirtyRows(prev => {
            const next = { ...prev }
            if (isDirty) {
                next[studentId] = { values, parentId }
            } else {
                delete next[studentId]
            }
            return next
        })
    }

    const saveSingleStudent = async (studentId, values, originalParentId) => {
        await updateStudent.mutateAsync({
            id: studentId,
            first_name: values.first_name,
            last_name: values.last_name,
            date_of_birth: values.date_of_birth,
            grade_level: values.grade_level,
            government_school_id: values.government_school_id === '__none__' ? null : values.government_school_id
        })

        const nextParentId = values.parent_id === '__none__' ? null : values.parent_id
        const previousParentId = originalParentId === '__none__' ? null : originalParentId

        if (nextParentId === previousParentId) {
            return
        }

        const { data: existingLinks, error: linksError } = await supabase
            .from('relationships')
            .select('id, person_id, is_primary')
            .eq('related_person_id', studentId)
            .in('relationship_type', ['Mother', 'Father', 'Parent', 'Guardian'])

        if (linksError) throw linksError

        const primaryLink = (existingLinks || []).find((link) => link.is_primary)

        if (!nextParentId) {
            if (primaryLink) {
                const { error: deletePrimaryError } = await supabase
                    .from('relationships')
                    .delete()
                    .eq('id', primaryLink.id)

                if (deletePrimaryError) throw deletePrimaryError
            }
            return
        }

        let activePrimaryId = null
        if (primaryLink) {
            if (primaryLink.person_id !== nextParentId) {
                const { data: updatedPrimary, error: updatePrimaryError } = await supabase
                    .from('relationships')
                    .update({
                        person_id: nextParentId,
                        relationship_type: 'Parent',
                        is_primary: true,
                    })
                    .eq('id', primaryLink.id)
                    .select('id')
                    .single()

                if (updatePrimaryError) throw updatePrimaryError
                activePrimaryId = updatedPrimary.id
            } else {
                activePrimaryId = primaryLink.id
            }
        } else {
            const existingMatch = (existingLinks || []).find((link) => link.person_id === nextParentId)

            if (existingMatch) {
                const { data: promotedLink, error: promoteError } = await supabase
                    .from('relationships')
                    .update({ is_primary: true, relationship_type: 'Parent' })
                    .eq('id', existingMatch.id)
                    .select('id')
                    .single()

                if (promoteError) throw promoteError
                activePrimaryId = promotedLink.id
            } else {
                const { data: insertedLink, error: linkError } = await supabase
                    .from('relationships')
                    .insert([{
                        person_id: nextParentId,
                        related_person_id: studentId,
                        relationship_type: 'Parent',
                        is_primary: true,
                        is_emergency_contact: false,
                    }])
                    .select('id')
                    .single()

                if (linkError) throw linkError
                activePrimaryId = insertedLink.id
            }
        }

        const { error: demoteOthersError } = await supabase
            .from('relationships')
            .update({ is_primary: false })
            .eq('related_person_id', studentId)
            .in('relationship_type', ['Mother', 'Father', 'Parent', 'Guardian'])
            .neq('id', activePrimaryId)

        if (demoteOthersError) throw demoteOthersError
    }

    const handleSaveRow = async (studentId, values, parentId) => {
        setSavingRowId(studentId)
        try {
            await saveSingleStudent(studentId, values, parentId)
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['students'] }),
                queryClient.invalidateQueries({ queryKey: ['parents'] }),
                queryClient.invalidateQueries({ queryKey: ['people'] }),
            ])
            await Promise.all([
                queryClient.refetchQueries({ queryKey: ['students'], type: 'active' }),
                queryClient.refetchQueries({ queryKey: ['parents'], type: 'active' }),
                queryClient.refetchQueries({ queryKey: ['people'], type: 'active' }),
            ])
            setDirtyRows(prev => {
                const next = { ...prev }
                delete next[studentId]
                return next
            })
            toast.success('Student updated successfully')
        } catch (err) {
            console.error('Failed to update student:', err)
            toast.error(err.message || 'Failed to update student')
        } finally {
            setSavingRowId(null)
        }
    }

    const handleSaveAll = async () => {
        if (!hasUnsavedChanges) return
        setIsSavingAll(true)
        const rowIds = Object.keys(dirtyRows)
        let successCount = 0
        let failCount = 0

        try {
            await Promise.all(rowIds.map(async (id) => {
                const { values, parentId } = dirtyRows[id]
                try {
                    await saveSingleStudent(id, values, parentId)
                    successCount++
                } catch (err) {
                    console.error(`Failed to save row ${id}:`, err)
                    failCount++
                }
            }))

            if (successCount > 0) {
                await Promise.all([
                    queryClient.invalidateQueries({ queryKey: ['students'] }),
                    queryClient.invalidateQueries({ queryKey: ['parents'] }),
                    queryClient.invalidateQueries({ queryKey: ['people'] }),
                ])
                await Promise.all([
                    queryClient.refetchQueries({ queryKey: ['students'], type: 'active' }),
                    queryClient.refetchQueries({ queryKey: ['parents'], type: 'active' }),
                    queryClient.refetchQueries({ queryKey: ['people'], type: 'active' }),
                ])
            }

            if (failCount === 0) {
                toast.success(`Successfully saved all ${successCount} changes`)
                setDirtyRows({})
            } else {
                toast.error(`Saved ${successCount} changes, but ${failCount} failed`)
                // Only clear the ones that succeeded if we tracked them individually
                // For simplicity, we'll keep the dirty state since we don't know which failed here without more granular tracking
                // But let's assume if it throws it didn't save. 
                // Better yet, let's refresh the whole data if any partial success occurred
            }
        } catch {
            toast.error('An error occurred while saving all changes')
        } finally {
            setIsSavingAll(false)
        }
    }

    const handleToggleQuickEdit = () => {
        if (!isQuickEdit && isLoadingParents) {
            toast.info('Loading parent/guardian options. Please try again in a moment.')
            return
        }
        if (isQuickEdit && hasUnsavedChanges) {
            setShowExitWarning(true)
        } else {
            setIsQuickEdit(!isQuickEdit)
            setDirtyRows({})
        }
    }

    const confirmExit = () => {
        setIsQuickEdit(false)
        setDirtyRows({})
        setShowExitWarning(false)
    }

    const columns = useMemo(
        () => [
            {
                accessorKey: 'photo_url',
                header: '',
                size: 60,
                cell: ({ row }) => (
                    <PersonAvatar
                        photoUrl={row.original.photo_url}
                        gender={row.original.gender}
                        firstName={row.original.first_name}
                        lastName={row.original.last_name}
                    />
                ),
            },
            {
                accessorKey: 'first_name',
                header: ({ column }) => (
                    <button
                        onClick={() => column.toggleSorting()}
                        className="flex items-center space-x-1 hover:text-primary-600"
                    >
                        <span>First Name</span>
                        <ArrowUpDown className="h-4 w-4" />
                    </button>
                ),
                cell: ({ row }) => (
                    <div className="font-medium text-neutral-900">{row.original.first_name}</div>
                ),
            },
            {
                accessorKey: 'last_name',
                header: ({ column }) => (
                    <button
                        onClick={() => column.toggleSorting()}
                        className="flex items-center space-x-1 hover:text-primary-600"
                    >
                        <span>Last Name</span>
                        <ArrowUpDown className="h-4 w-4" />
                    </button>
                ),
                cell: ({ row }) => (
                    <div className="text-neutral-600">{row.original.last_name}</div>
                ),
            },
            {
                accessorKey: 'gender',
                header: 'Gender',
                size: 80,
                cell: ({ row }) => (
                    <div className="text-neutral-600">{row.original.gender}</div>
                ),
            },
            {
                accessorKey: 'date_of_birth',
                header: 'Age',
                size: 80,
                cell: ({ row }) => {
                    const age = calculateAge(row.original.date_of_birth)
                    return <div className="text-neutral-600">{age ? `${age} yrs` : '-'}</div>
                },
            },
            {
                accessorKey: 'grade_level',
                header: ({ column }) => (
                    <button
                        onClick={() => column.toggleSorting()}
                        className="flex items-center space-x-1 hover:text-primary-600"
                    >
                        <span>Grade</span>
                        <ArrowUpDown className="h-4 w-4" />
                    </button>
                ),
                cell: ({ row }) => (
                    <Badge variant="secondary" className="font-medium">
                        {row.original.grade_level}
                    </Badge>
                ),
            },
            {
                accessorKey: 'government_school',
                header: ({ column }) => (
                    <button
                        onClick={() => column.toggleSorting()}
                        className="flex items-center space-x-1 hover:text-primary-600"
                    >
                        <span>School</span>
                        <ArrowUpDown className="h-4 w-4" />
                    </button>
                ),
                cell: ({ row }) => (
                    <div className="text-sm text-neutral-600 max-w-[200px] truncate">
                        {row.original.government_school || 'HOHA Only'}
                    </div>
                ),
            },
            {
                accessorKey: 'parent_name',
                header: 'Parent/Guardian',
                size: 180,
                cell: ({ row }) => (
                    <div className="text-sm text-neutral-600">
                        {row.original.parent_name || '-'}
                    </div>
                ),
            },
            {
                accessorKey: 'parent_phone',
                header: 'Phone',
                size: 140,
                cell: ({ row }) => (
                    <div className="text-sm text-neutral-600">
                        {row.original.parent_phone || '-'}
                    </div>
                ),
            },
            {
                accessorKey: 'current_status',
                header: 'Status',
                size: 100,
                cell: ({ row }) => {
                    const status = row.original.current_status
                    return (
                        <Badge
                            variant={status === 'Active' ? 'success' : 'secondary'}
                            className="font-medium"
                        >
                            {status}
                        </Badge>
                    )
                },
            },
        ],
        []
    )

    const table = useReactTable({
        data: data || [],
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onSortingChange: onSortingChange,
        onPaginationChange: setPagination,
        state: {
            sorting,
            pagination,
        },
        manualSorting: true, // Let the backend handle sorting
    })

    return (
        <div className="space-y-4">
            {/* Quick Edit Toggle */}
            <div className="flex justify-between items-center px-1">
                <div className="text-sm text-neutral-500">
                    {isQuickEdit ? (
                        <div className="flex items-center gap-2">
                            {hasUnsavedChanges ? (
                                <span className="text-red-600 font-semibold flex items-center">
                                    <AlertCircle className="h-4 w-4 mr-1" />
                                    {Object.keys(dirtyRows).length} unsaved changes
                                </span>
                            ) : (
                                <span className="text-amber-600 font-medium">Quick Edit Mode is ON - Edit fields directly</span>
                            )}
                        </div>
                    ) : (
                        <span>Click any row to view details, or enable Quick Edit to modify records</span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {isQuickEdit && hasUnsavedChanges && (
                        <Button
                            variant="default"
                            size="sm"
                            onClick={handleSaveAll}
                            disabled={isSavingAll}
                            className="bg-red-600 hover:bg-red-700 text-white shadow-lg animate-in fade-in zoom-in duration-200"
                        >
                            {isSavingAll ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                            )}
                            Save All Changes
                        </Button>
                    )}
                    <Button
                        variant={isQuickEdit ? "default" : "outline"}
                        size="sm"
                        onClick={handleToggleQuickEdit}
                        className={cn(
                            "transition-all duration-200",
                            isQuickEdit && "bg-amber-500 hover:bg-amber-600 text-white"
                        )}
                    >
                        <Edit2 className="mr-2 h-4 w-4" />
                        {isQuickEdit ? 'Exit Quick Edit' : 'Quick Edit Mode'}
                    </Button>
                </div>
            </div>

            {/* Exit Warning Dialog */}
            <Dialog open={showExitWarning} onOpenChange={setShowExitWarning}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-red-600 flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            Unsaved Changes
                        </DialogTitle>
                        <DialogDescription>
                            You have {Object.keys(dirtyRows).length} unsaved changes. Are you sure you want to exit Quick Edit mode? Your changes will be lost.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setShowExitWarning(false)}>
                            Keep Editing
                        </Button>
                        <Button
                            onClick={confirmExit}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Discard & Exit
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Table Container */}
            <div className={cn(
                "rounded-lg border bg-white overflow-hidden shadow-sm",
                isQuickEdit ? "border-amber-300" : "border-neutral-200"
            )}>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className={cn(
                            "border-b",
                            isQuickEdit ? "bg-amber-50 border-amber-200" : "bg-neutral-50 border-neutral-200"
                        )}>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            style={{ width: header.getSize() }}
                                            className="px-4 py-3 text-left text-sm font-semibold text-neutral-700"
                                        >
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(header.column.columnDef.header, header.getContext())}
                                        </th>
                                    ))}
                                    {isQuickEdit && <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">Actions</th>}
                                </tr>
                            ))}
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {isQuickEdit ? (
                                // Render editable rows when Quick Edit is ON
                                table.getRowModel().rows.map((row) => (
                                    <EditableRow
                                        key={row.original.id}
                                        row={row.original}
                                        onSave={handleSaveRow}
                                        onValuesChange={handleValuesChange}
                                        isSaving={savingRowId === row.original.id}
                                        schools={schools}
                                        parentOptions={parents}
                                    />
                                ))
                            ) : (
                                // Normal rows when Quick Edit is OFF
                                table.getRowModel().rows.map((row, index) => (
                                    <motion.tr
                                        key={row.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.2, delay: index * 0.02 }}
                                        onClick={() => onRowClick?.(row.original)}
                                        className="cursor-pointer hover:bg-neutral-50 transition-colors"
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <td key={cell.id} className="px-4 py-3 text-sm">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <div className="text-sm text-neutral-600">
                    Showing {table.getRowModel().rows.length} of {data?.length || 0} students
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.setPageIndex(0)}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-neutral-600">
                        Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                        disabled={!table.getCanNextPage()}
                    >
                        <ChevronsRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}

