import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useCreateAward } from '@/hooks/useAwards'
import { useStudentRankings } from '@/hooks/useAwards'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Search } from 'lucide-react'

const awardSchema = z.object({
    award_date: z.string().min(1, 'Date is required'),
    term: z.string().min(1, 'Term is required'),
    academic_year: z.number().min(2020).max(2100),
    notes: z.string().optional(),
})

const TERMS = ['Term 1', 'Term 2', 'Term 3', 'Year-End']

export function AwardForm({ onSuccess, onCancel }) {
    const [error, setError] = useState('')
    const [selectedStudents, setSelectedStudents] = useState([])
    const [searchQuery, setSearchQuery] = useState('')

    const createAward = useCreateAward()
    const { data: rankings } = useStudentRankings()

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
        resolver: zodResolver(awardSchema),
        defaultValues: {
            award_date: new Date().toISOString().split('T')[0],
            academic_year: new Date().getFullYear(),
        },
    })

    const selectedTerm = watch('term')

    // Filter students by search
    const filteredRankings = rankings?.filter(student => {
        if (!searchQuery) return true
        const fullName = `${student.first_name} ${student.last_name}`.toLowerCase()
        return fullName.includes(searchQuery.toLowerCase()) ||
            student.grade_level.toLowerCase().includes(searchQuery.toLowerCase())
    }) || []

    // Toggle student selection
    const toggleStudent = (student) => {
        const isSelected = selectedStudents.some(s => s.student_id === student.student_id)
        if (isSelected) {
            setSelectedStudents(selectedStudents.filter(s => s.student_id !== student.student_id))
        } else {
            setSelectedStudents([...selectedStudents, {
                student_id: student.student_id,
                attendance_percentage: student.attendance_percentage,
                grade_level: student.grade_level,
                first_name: student.first_name,
                last_name: student.last_name,
                notes: '',
            }])
        }
    }

    // Update student notes
    const updateStudentNotes = (studentId, notes) => {
        setSelectedStudents(selectedStudents.map(s =>
            s.student_id === studentId ? { ...s, notes } : s
        ))
    }

    const onSubmit = async (data) => {
        setError('')

        if (selectedStudents.length === 0) {
            setError('Please select at least one student')
            return
        }

        try {
            await createAward.mutateAsync({
                award: data,
                recipients: selectedStudents,
            })
            onSuccess?.()
        } catch (err) {
            setError(err.message || 'Failed to record award')
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Award Details */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="term">Term *</Label>
                    <Select
                        value={selectedTerm}
                        onValueChange={(value) => setValue('term', value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select term" />
                        </SelectTrigger>
                        <SelectContent>
                            {TERMS.map((term) => (
                                <SelectItem key={term} value={term}>
                                    {term}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.term && (
                        <p className="text-sm text-red-600">{errors.term.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="award_date">Date *</Label>
                    <Input
                        id="award_date"
                        type="date"
                        {...register('award_date')}
                    />
                    {errors.award_date && (
                        <p className="text-sm text-red-600">{errors.award_date.message}</p>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="academic_year">Academic Year *</Label>
                <Input
                    id="academic_year"
                    type="number"
                    {...register('academic_year', { valueAsNumber: true })}
                />
                {errors.academic_year && (
                    <p className="text-sm text-red-600">{errors.academic_year.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="notes">General Notes</Label>
                <Textarea
                    id="notes"
                    {...register('notes')}
                    placeholder="Notes about this award distribution event..."
                    rows={2}
                />
            </div>

            {/* Student Selection */}
            <Card>
                <CardContent className="p-4 space-y-4">
                    <div>
                        <Label>Select Students</Label>
                        <p className="text-sm text-muted-foreground mb-3">
                            Students are ranked by attendance percentage. Select recipients for this award.
                        </p>

                        {/* Search */}
                        <div className="relative mb-3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or grade..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    {/* Student List */}
                    <div className="max-h-96 overflow-y-auto space-y-2 border rounded-lg p-3">
                        {filteredRankings.length > 0 ? (
                            filteredRankings.map((student, index) => {
                                const isSelected = selectedStudents.some(s => s.student_id === student.student_id)
                                return (
                                    <div
                                        key={student.student_id}
                                        className={`p-3 border rounded-lg transition-colors ${isSelected ? 'bg-primary/5 border-primary' : 'hover:bg-muted'
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={() => toggleStudent(student)}
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">
                                                        {student.first_name} {student.last_name}
                                                    </span>
                                                    <Badge variant="outline" className="text-xs">
                                                        {student.grade_level}
                                                    </Badge>
                                                    <span className="text-sm font-semibold text-green-600">
                                                        {student.attendance_percentage.toFixed(1)}%
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {student.total_present}/{student.total_sessions} sessions -
                                                    Rank #{index + 1} overall
                                                    {student.total_awards_received > 0 &&
                                                        ` - ${student.total_awards_received} previous award${student.total_awards_received !== 1 ? 's' : ''}`
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        ) : (
                            <p className="text-muted-foreground text-center py-4">
                                No students found
                            </p>
                        )}
                    </div>

                    {/* Selected Students Summary */}
                    {selectedStudents.length > 0 && (
                        <div className="border-t pt-4">
                            <Label className="mb-2 block">
                                Selected Students ({selectedStudents.length})
                            </Label>
                            <div className="space-y-2">
                                {selectedStudents.map((student) => (
                                    <div key={student.student_id} className="flex items-center gap-2">
                                        <span className="text-sm flex-1">
                                            {student.first_name} {student.last_name} ({student.attendance_percentage.toFixed(1)}%)
                                        </span>
                                        <Input
                                            placeholder="Individual notes (optional)"
                                            value={student.notes}
                                            onChange={(e) => updateStudentNotes(student.student_id, e.target.value)}
                                            className="flex-1 text-sm"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={createAward.isPending}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={createAward.isPending}>
                    {createAward.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Record Award Distribution
                </Button>
            </div>
        </form>
    )
}

