import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    flexRender,
} from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, Ambulance, AlertCircle } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import { motion } from 'framer-motion'

export function VisitsTable({ data }) {
    const [sorting, setSorting] = useState([])
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 })

    const columns = useMemo(
        () => [
            {
                accessorKey: 'visit_date',
                header: ({ column }) => (
                    <button
                        onClick={() => column.toggleSorting()}
                        className="flex items-center space-x-1 hover:text-primary-600"
                    >
                        <span>Date</span>
                        <ArrowUpDown className="h-4 w-4" />
                    </button>
                ),
                cell: ({ row }) => (
                    <div className="font-medium text-neutral-900">
                        {formatDate(row.original.visit_date)}
                    </div>
                ),
            },
            {
                accessorKey: 'patient.first_name',
                header: 'Patient',
                cell: ({ row }) => (
                    <div>
                        <Link
                            to={`/clinicare/patients/${row.original.patient_id}`}
                            className="font-medium text-neutral-900 hover:text-blue-600 hover:underline"
                        >
                            {row.original.patient?.first_name} {row.original.patient?.last_name}
                        </Link>
                        {!row.original.in_hoha_program && (
                            <Badge variant="secondary" className="mt-1 text-xs">Community</Badge>
                        )}
                    </div>
                ),
            },
            {
                accessorKey: 'facility_name',
                header: 'Facility',
                cell: ({ row }) => (
                    <div className="text-sm text-neutral-600 max-w-[200px] truncate">
                        {row.original.facility_name || '-'}
                    </div>
                ),
            },
            {
                accessorKey: 'diagnosis',
                header: 'Diagnosis',
                cell: ({ row }) => (
                    <div className="text-sm text-neutral-600 max-w-[200px] truncate">
                        {row.original.diagnosis || row.original.reason_for_visit || '-'}
                    </div>
                ),
            },
            {
                accessorKey: 'cost_amount',
                header: 'Cost',
                cell: ({ row }) => (
                    <div className="font-medium text-neutral-900">
                        {formatCurrency(row.original.cost_amount || 0)}
                    </div>
                ),
            },
            {
                accessorKey: 'hoha_contribution',
                header: 'HOHA Paid',
                cell: ({ row }) => (
                    <div className="font-medium text-green-600">
                        {formatCurrency(row.original.hoha_contribution || 0)}
                    </div>
                ),
            },
            {
                accessorKey: 'is_emergency',
                header: 'Type',
                size: 100,
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        {row.original.is_emergency && (
                            <Badge variant="destructive" className="flex items-center gap-1">
                                <Ambulance className="h-3 w-3" />
                                Emergency
                            </Badge>
                        )}
                        {row.original.follow_up_required && (
                            <AlertCircle className="h-4 w-4 text-orange-500" title="Follow-up required" />
                        )}
                    </div>
                ),
            },
        ],
        []
    )

    const table = useReactTable({
        data: data || [],
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        onPaginationChange: setPagination,
        state: {
            sorting,
            pagination,
        },
    })

    return (
        <div className="space-y-4">
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
                                            {flexRender(header.column.columnDef.header, header.getContext())}
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
                                    className="hover:bg-neutral-50 transition-colors"
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
                    Showing {table.getRowModel().rows.length} of {data?.length || 0} visits
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