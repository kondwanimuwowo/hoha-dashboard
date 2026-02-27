import { useMemo, useState, useEffect } from 'react'
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    flexRender,
} from '@tanstack/react-table'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

export function SortableTable({
    columns,
    data,
    pageSize = 10,
    className,
    emptyMessage = "No data found",
    onRowClick
}) {
    const [sorting, setSorting] = useState([])
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize })

    // If pageSize prop changes, update pagination state
    useEffect(() => {
        setPagination(prev => ({ ...prev, pageSize }))
    }, [pageSize])

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
        <div className={cn("space-y-4", className)}>
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-card shadow-sm overflow-hidden transition-colors">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-neutral-50/50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-800 transition-colors">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            className="group px-4 py-3 text-sm font-semibold text-neutral-600 dark:text-neutral-400 select-none"
                                            style={{ width: header.getSize() }}
                                        >
                                            {header.isPlaceholder ? null : (
                                                <div
                                                    className={cn(
                                                        "flex items-center gap-2",
                                                        header.column.getCanSort() ? "cursor-pointer" : ""
                                                    )}
                                                    onClick={header.column.getToggleSortingHandler()}
                                                >
                                                    {flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                                    {header.column.getCanSort() && (
                                                        <div className="w-4 h-4 flex items-center justify-center">
                                                            {{
                                                                asc: <ChevronUp className="h-3 w-3 text-primary-600 dark:text-primary-500" />,
                                                                desc: <ChevronDown className="h-3 w-3 text-primary-600 dark:text-primary-500" />,
                                                            }[header.column.getIsSorted()] ?? (
                                                                    <ArrowUpDown className="h-3 w-3 text-neutral-300 dark:text-neutral-600 group-hover:text-neutral-400 dark:group-hover:text-neutral-400 transition-colors" />
                                                                )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 transition-colors">
                            <AnimatePresence mode="wait">
                                {table.getRowModel().rows.length > 0 ? (
                                    table.getRowModel().rows.map((row, index) => (
                                        <motion.tr
                                            key={row.id}
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -5 }}
                                            transition={{ duration: 0.15, delay: Math.min(index * 0.02, 0.2) }}
                                            onClick={() => onRowClick?.(row.original)}
                                            className={cn(
                                                "hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors group",
                                                onRowClick ? "cursor-pointer" : ""
                                            )}
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <td key={cell.id} className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-300">
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </td>
                                            ))}
                                        </motion.tr>
                                    ))
                                ) : (
                                    <motion.tr
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="bg-white dark:bg-card"
                                    >
                                        <td colSpan={columns.length} className="px-4 py-12 text-center text-neutral-500 dark:text-neutral-400 italic">
                                            {emptyMessage}
                                        </td>
                                    </motion.tr>
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Controls */}
            {table.getFilteredRowModel().rows.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 pt-2">
                    <div className="flex items-center gap-4 text-sm text-neutral-500 dark:text-neutral-400">
                        <div className="flex items-center gap-2">
                            <span>Rows per page</span>
                            <Select
                                value={`${table.getState().pagination.pageSize}`}
                                onValueChange={(value) => {
                                    table.setPageSize(Number(value))
                                }}
                            >
                                <SelectTrigger className="h-8 w-[70px] bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
                                    <SelectValue placeholder={table.getState().pagination.pageSize} />
                                </SelectTrigger>
                                <SelectContent>
                                    {[10, 20, 50, 100].map((size) => (
                                        <SelectItem key={size} value={`${size}`}>
                                            {size}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            Showing <span className="font-medium text-neutral-900 dark:text-foreground">{table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}</span> to <span className="font-medium text-neutral-900 dark:text-foreground">{Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)}</span> of <span className="font-medium text-neutral-900 dark:text-foreground">{table.getFilteredRowModel().rows.length}</span> results
                        </div>
                    </div>

                    {table.getPageCount() > 1 && (
                        <div className="flex items-center space-x-1.5">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                onClick={() => table.setPageIndex(0)}
                                disabled={!table.getCanPreviousPage()}
                            >
                                <ChevronsLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="flex items-center px-4 py-1.5 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                                disabled={!table.getCanNextPage()}
                            >
                                <ChevronsRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
