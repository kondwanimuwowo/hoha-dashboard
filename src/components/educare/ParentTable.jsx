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
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ArrowUpDown,
    Eye,
    Phone,
    Users
} from 'lucide-react'

export function ParentTable({ data, onRowClick, sorting, onSortingChange }) {
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
                    <div className="text-neutral-600">{row.original.last_name}</div>
                ),
            },
            {
                accessorKey: 'phone_number',
                header: 'Phone Number',
                size: 150,
                cell: ({ row }) => (
                    <div className="flex items-center text-sm text-neutral-600">
                        <Phone className="h-3 w-3 mr-2 opacity-50" />
                        {row.original.phone_number || '-'}
                    </div>
                ),
            },
            {
                accessorKey: 'children_count',
                header: 'Children in Educare',
                size: 180,
                cell: ({ row }) => (
                    <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {row.original.children_count}
                        </Badge>
                        <div className="text-xs text-neutral-400 truncate max-w-[120px]">
                            {row.original.educare_children?.map(c => c.first_name).join(', ')}
                        </div>
                    </div>
                ),
            },
            {
                id: 'actions',
                size: 80,
                cell: ({ row }) => (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation()
                            onRowClick?.(row.original)
                        }}
                    >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                    </Button>
                ),
            },
        ],
        [onRowClick]
    )

    // eslint-disable-next-line react-hooks/incompatible-library
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
    })

    return (
        <div className="space-y-4">
            <div className="rounded-lg border bg-white overflow-hidden shadow-sm border-neutral-200">
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
                    Showing {table.getRowModel().rows.length} of {data?.length || 0} parents
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
                        Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
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

