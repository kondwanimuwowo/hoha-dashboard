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
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ArrowUpDown,
    Edit2,
    Save,
    Loader2,
    AlertCircle,
    CheckCircle2
} from 'lucide-react'
import { calculateAge } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useUpdateStudent } from '@/hooks/useStudents'
import { useUpdatePerson } from '@/hooks/usePeople'
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
function EditableRow({ row, onSave, onValuesChange, isSaving }) {
    const [values, setValues] = useState({
        first_name: row.first_name || '',
        last_name: row.last_name || '',
        date_of_birth: row.date_of_birth || '',
        grade_level: row.grade_level || '',
        emergency_contact_phone: row.emergency_contact_phone || '',
        parent_name: row.parent_name || '',
    })

    // Check if any value has changed from original
    const hasChanges =
        values.first_name !== (row.first_name || '') ||
        values.last_name !== (row.last_name || '') ||
        values.date_of_birth !== (row.date_of_birth || '') ||
        values.grade_level !== (row.grade_level || '') ||
        values.emergency_contact_phone !== (row.emergency_contact_phone || '') ||
        values.parent_name !== (row.parent_name || '')

    const handleChange = (field, value) => {
        const newValues = { ...values, [field]: value }
        setValues(newValues)
        onValuesChange?.(row.id, newValues, row.parent_id, hasChanges || field !== values[field])
    }

    const handleSave = () => {
        onSave(row.id, values, row.parent_id)
    }

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
                <div className="text-sm text-neutral-500 truncate max-w-[150px]">
                    {row.government_school || 'HOHA Only'}
                </div>
            </td>
            <td className="px-2 py-2">
                <Input
                    value={values.emergency_contact_phone}
                    onChange={(e) => handleChange('emergency_contact_phone', e.target.value)}
                    className={cn("h-8 text-sm", hasChanges && "border-red-300 focus:border-red-500")}
                    placeholder="Phone"
                />
            </td>
            <td className="px-2 py-2">
                <Input
                    value={values.parent_name}
                    onChange={(e) => handleChange('parent_name', e.target.value)}
                    className={cn("h-8 text-sm", hasChanges && "border-red-300 focus:border-red-500")}
                    placeholder="Parent Name"
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

export function StudentTable({ data, onRowClick }) {
    const [sorting, setSorting] = useState([])
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 })
    const [isQuickEdit, setIsQuickEdit] = useState(false)
    const [savingRowId, setSavingRowId] = useState(null)
    const [isSavingAll, setIsSavingAll] = useState(false)
    const [dirtyRows, setDirtyRows] = useState({}) // { [id]: { values, parentId } }
    const [showExitWarning, setShowExitWarning] = useState(false)

    const updateStudent = useUpdateStudent()
    const updatePerson = useUpdatePerson()

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

    const saveSingleStudent = async (studentId, values, parentId) => {
        await updateStudent.mutateAsync({
            id: studentId,
            first_name: values.first_name,
            last_name: values.last_name,
            date_of_birth: values.date_of_birth,
            grade_level: values.grade_level,
            emergency_contact_phone: values.emergency_contact_phone
        })

        if (parentId && values.parent_name) {
            const [firstName, ...lastNameParts] = values.parent_name.split(' ')
            await updatePerson.mutateAsync({
                id: parentId,
                first_name: firstName,
                last_name: lastNameParts.join(' ')
            })
        }
    }

    const handleSaveRow = async (studentId, values, parentId) => {
        setSavingRowId(studentId)
        try {
            await saveSingleStudent(studentId, values, parentId)
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
        } catch (err) {
            toast.error('An error occurred while saving all changes')
        } finally {
            setIsSavingAll(false)
        }
    }

    const handleToggleQuickEdit = () => {
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
                header: 'School',
                cell: ({ row }) => (
                    <div className="text-sm text-neutral-600 max-w-[200px] truncate">
                        {row.original.government_school || 'HOHA Only'}
                    </div>
                ),
            },
            {
                accessorKey: 'emergency_contact_phone',
                header: 'Phone',
                size: 140,
                cell: ({ row }) => (
                    <div className="text-sm text-neutral-600">
                        {row.original.emergency_contact_phone || '-'}
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
        onSortingChange: setSorting,
        onPaginationChange: setPagination,
        state: {
            sorting,
            pagination,
        },
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
                                <span className="text-amber-600 font-medium">✏️ Quick Edit Mode is ON - Edit fields directly</span>
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