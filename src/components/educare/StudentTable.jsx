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
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown } from 'lucide-react'
import { calculateAge } from '@/lib/utils'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export function StudentTable({ data, onRowClick }) {
    const [sorting, setSorting] = useState([])
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 })

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
                    <div className="font-medium text-neutral-900">{row.original.last_name}</div>
                ),
            },
            {
                accessorKey: 'gender',
                header: 'Gender',
                size: 100,
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
            {/* Table Container */}
            <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-neutral-50 border-b border-neutral-200">
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
                                </tr>
                            ))}
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {table.getRowModel().rows.map((row, index) => (
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
                            ))}
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