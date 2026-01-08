import { useDashboardStats } from '@/hooks/useStats'
import { StatsCard } from '@/components/shared/StatsCard'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GraduationCap, Users, Heart, Calendar, UserPlus, ClipboardList, Plus } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { StudentForm } from '@/components/educare/StudentForm'
import { VisitForm } from '@/components/clinicare/VisitForm'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useCreateDistribution } from '@/hooks/useFoodDistribution'
import { QUARTERS } from '@/lib/constants'
import { useNavigate } from 'react-router-dom'

export function Dashboard() {
    const navigate = useNavigate()
    const [showAddStudent, setShowAddStudent] = useState(false)
    const [showAddVisit, setShowAddVisit] = useState(false)
    const [showCreateDist, setShowCreateDist] = useState(false)
    const { data: stats, isLoading } = useDashboardStats()

    if (isLoading) {
        return <LoadingSpinner />
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Dashboard"
                description="Welcome back! Here's an overview of your programs."
            />

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Active Students"
                    value={stats?.studentsCount || 0}
                    subtitle="Enrolled in Educare"
                    icon={GraduationCap}
                    colorClass="bg-blue-50 text-blue-600"
                />
                <StatsCard
                    title="Women in Legacy"
                    value={stats?.womenCount || 0}
                    subtitle="Active participants"
                    icon={Users}
                    colorClass="bg-purple-50 text-purple-600"
                />
                <StatsCard
                    title="Medical Visits"
                    value={stats?.visitsCount || 0}
                    subtitle="This month"
                    icon={Heart}
                    colorClass="bg-red-50 text-red-600"
                />
                <StatsCard
                    title="Next Distribution"
                    value={stats?.nextDistribution ? formatDate(stats.nextDistribution.distribution_date) : 'Not scheduled'}
                    subtitle="Food hampers"
                    icon={Calendar}
                    colorClass="bg-green-50 text-green-600"
                />
            </div>

            {/* Recent Activity & Quick Actions */}
            <div className="grid gap-6 lg:grid-cols-2">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                >
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="text-sm text-muted-foreground">
                                    Activity feed coming soon...
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                >
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Button
                                    variant="outline"
                                    className="h-auto py-4 flex-col gap-2 items-start justify-start border-blue-200 border-dashed bg-blue-50/30 hover:bg-blue-50 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                                    onClick={() => navigate('/educare/attendance')}
                                >
                                    <ClipboardList className="h-5 w-5 text-blue-600" />
                                    <div className="text-left font-semibold text-blue-900">Mark Attendance</div>
                                </Button>
                                <Button
                                    variant="outline"
                                    className="h-auto py-4 flex-col gap-2 items-start justify-start border-purple-200 border-dashed bg-purple-50/30 hover:bg-purple-50 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
                                    onClick={() => setShowAddStudent(true)}
                                >
                                    <UserPlus className="h-5 w-5 text-purple-600" />
                                    <div className="text-left font-semibold text-purple-900">Register Student</div>
                                </Button>
                                <Button
                                    variant="outline"
                                    className="h-auto py-4 flex-col gap-2 items-start justify-start border-red-200 border-dashed bg-red-50/30 hover:bg-red-50 hover:border-red-300 hover:shadow-md transition-all cursor-pointer"
                                    onClick={() => setShowAddVisit(true)}
                                >
                                    <Heart className="h-5 w-5 text-red-600" />
                                    <div className="text-left font-semibold text-red-900">Record Visit</div>
                                </Button>
                                <Button
                                    variant="outline"
                                    className="h-auto py-4 flex-col gap-2 items-start justify-start border-green-200 border-dashed bg-green-50/30 hover:bg-green-50 hover:border-green-300 hover:shadow-md transition-all cursor-pointer"
                                    onClick={() => setShowCreateDist(true)}
                                >
                                    <Plus className="h-5 w-5 text-green-600" />
                                    <div className="text-left font-semibold text-green-900">Add Distribution</div>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Dialogs */}
            <Dialog open={showAddStudent} onOpenChange={setShowAddStudent}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Register New Student</DialogTitle>
                    </DialogHeader>
                    <StudentForm
                        onSuccess={() => setShowAddStudent(false)}
                        onCancel={() => setShowAddStudent(false)}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={showAddVisit} onOpenChange={setShowAddVisit}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Record Medical Visit</DialogTitle>
                    </DialogHeader>
                    <VisitForm
                        onSuccess={() => setShowAddVisit(false)}
                        onCancel={() => setShowAddVisit(false)}
                    />
                </DialogContent>
            </Dialog>

            <CreateDistributionDialog
                open={showCreateDist}
                onOpenChange={setShowCreateDist}
            />
        </div>
    )
}

function CreateDistributionDialog({ open, onOpenChange }) {
    const [formData, setFormData] = useState({
        distribution_date: '',
        quarter: '',
        year: new Date().getFullYear(),
        distribution_location: 'HOHA Hub',
        notes: '',
    })
    const createDistribution = useCreateDistribution()

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            await createDistribution.mutateAsync(formData)
            onOpenChange(false)
        } catch (err) {
            console.error(err)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Plan Food Distribution</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Quarter</Label>
                            <Select
                                value={formData.quarter}
                                onValueChange={(value) => setFormData({ ...formData, quarter: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select quarter" />
                                </SelectTrigger>
                                <SelectContent>
                                    {QUARTERS.map((q) => (
                                        <SelectItem key={q} value={q}>{q}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Year</Label>
                            <Input
                                type="number"
                                value={formData.year}
                                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Distribution Date</Label>
                        <Input
                            type="date"
                            value={formData.distribution_date}
                            onChange={(e) => setFormData({ ...formData, distribution_date: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Location</Label>
                        <Input
                            value={formData.distribution_location}
                            onChange={(e) => setFormData({ ...formData, distribution_location: e.target.value })}
                            placeholder="HOHA Hub"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Special instructions, hamper contents..."
                            rows={3}
                        />
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={createDistribution.isPending}>
                            {createDistribution.isPending ? 'Creating...' : 'Create Distribution'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}