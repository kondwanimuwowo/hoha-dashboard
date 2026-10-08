import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PersonAvatar } from '@/components/shared/PersonAvatar'
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { motion } from 'framer-motion'

const PAGE_SIZE = 20

function getDewormingStatus(lastDewormingDate) {
    if (!lastDewormingDate) return { label: 'Never', variant: 'destructive' }
    const last = new Date(lastDewormingDate)
    const now = new Date()
    const monthsDiff = (now.getFullYear() - last.getFullYear()) * 12 + (now.getMonth() - last.getMonth())
    if (monthsDiff < 6) return { label: 'Up to date', variant: 'default' }
    return { label: 'Due', variant: 'secondary' }
}

export function HealthTable({ students, onRowClick }) {
    const [searchQuery, setSearchQuery] = useState('')
    const [pageIndex, setPageIndex] = useState(0)

    const filtered = useMemo(() => {
        if (!students) return []
        return students.filter((s) => {
            if (!searchQuery) return true
            const name = `${s.first_name} ${s.last_name}`.toLowerCase()
            return name.includes(searchQuery.toLowerCase())
        })
    }, [students, searchQuery])

    const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
    const currentPage = Math.min(pageIndex, pageCount - 1)
    const pageRows = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setPageIndex(0)
                    }}
                    className="pl-9"
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">
                        {filtered.length} Student{filtered.length !== 1 ? 's' : ''}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {/* Table header */}
                    <div className="hidden md:grid md:grid-cols-[1fr_100px_100px_100px_140px_100px] gap-3 px-4 py-2 border-b bg-neutral-50 text-sm font-medium text-neutral-600">
                        <div>Student</div>
                        <div>Grade</div>
                        <div>Weight</div>
                        <div>Height</div>
                        <div>Last Deworming</div>
                        <div>Status</div>
                    </div>

                    <div className="divide-y divide-neutral-100">
                        {pageRows.map((student, index) => {
                            const status = getDewormingStatus(student.last_deworming_date)

                            return (
                                <motion.div
                                    key={student.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.5) }}
                                    className={`p-4 transition-colors ${onRowClick ? 'cursor-pointer hover:bg-neutral-100' : 'hover:bg-neutral-50'}`}
                                    onClick={() => onRowClick?.(student)}
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-[1fr_100px_100px_100px_140px_100px] gap-3 items-center">
                                        <div className="flex items-center gap-3">
                                            <PersonAvatar
                                                photoUrl={student.photo_url}
                                                gender={student.gender}
                                                firstName={student.first_name}
                                                lastName={student.last_name}
                                                className="h-10 w-10"
                                            />
                                            <div className="font-semibold text-neutral-900">
                                                {student.first_name} {student.last_name}
                                            </div>
                                        </div>

                                        <div className="text-sm text-neutral-600">
                                            <span className="md:hidden font-medium text-neutral-500">Grade: </span>
                                            {student.grade_level || '—'}
                                        </div>

                                        <div className="text-sm text-neutral-600">
                                            <span className="md:hidden font-medium text-neutral-500">Weight: </span>
                                            {student.weight_kg ? `${student.weight_kg} kg` : '—'}
                                        </div>

                                        <div className="text-sm text-neutral-600">
                                            <span className="md:hidden font-medium text-neutral-500">Height: </span>
                                            {student.height_cm ? `${student.height_cm} cm` : '—'}
                                        </div>

                                        <div className="text-sm text-neutral-600">
                                            <span className="md:hidden font-medium text-neutral-500">Last Deworming: </span>
                                            {student.last_deworming_date
                                                ? new Date(student.last_deworming_date).toLocaleDateString()
                                                : '—'}
                                        </div>

                                        <div>
                                            <Badge variant={status.variant}>{status.label}</Badge>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}

                        {filtered.length === 0 && (
                            <div className="p-12 text-center text-neutral-500">
                                {searchQuery ? 'No students match your search' : 'No students found'}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {filtered.length > PAGE_SIZE && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">
                        Showing {pageRows.length} of {filtered.length} students
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => setPageIndex(0)} disabled={currentPage === 0}>
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setPageIndex(currentPage - 1)} disabled={currentPage === 0}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-neutral-600 dark:text-neutral-400">
                            Page {currentPage + 1} of {pageCount}
                        </span>
                        <Button variant="outline" size="sm" onClick={() => setPageIndex(currentPage + 1)} disabled={currentPage >= pageCount - 1}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setPageIndex(pageCount - 1)} disabled={currentPage >= pageCount - 1}>
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
