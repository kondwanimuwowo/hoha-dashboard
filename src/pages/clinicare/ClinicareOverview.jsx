import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useClinicareStats } from '@/hooks/useClinicareStats'
import { useFollowUps } from '@/hooks/useVisits'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatsCard } from '@/components/shared/StatsCard'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { VisitForm } from '@/components/clinicare/VisitForm'
import { Button } from '@/components/ui/button'
import { Heart, DollarSign, Ambulance, Users, Plus, AlertCircle, Building2 } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { motion } from 'framer-motion'

export function ClinicareOverview() {
    const navigate = useNavigate()
    const [showAddVisit, setShowAddVisit] = useState(false)
    // Get stats for current month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    const { data: stats, isLoading } = useClinicareStats(
        startOfMonth.toISOString().split('T')[0],
        new Date().toISOString().split('T')[0]
    )

    const { data: followUps } = useFollowUps()

    if (isLoading) return <LoadingSpinner />

    return (
        <div className="space-y-6">
            <PageHeader
                title="Clinicare Africa"
                description="Medical support and healthcare services for the community"
            />

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Total Visits"
                    value={stats?.totalVisits || 0}
                    subtitle="This month"
                    icon={Heart}
                    colorClass="bg-red-50 text-red-600"
                />
                <StatsCard
                    title="Emergency Cases"
                    value={stats?.emergencyVisits || 0}
                    subtitle="Urgent care"
                    icon={Ambulance}
                    colorClass="bg-orange-50 text-orange-600"
                />
                <StatsCard
                    title="HOHA Contribution"
                    value={formatCurrency(stats?.totalHohaContribution || 0)}
                    subtitle="Medical support"
                    icon={DollarSign}
                    colorClass="bg-green-50 text-green-600"
                />
                <StatsCard
                    title="Community Support"
                    value={stats?.communityVisits || 0}
                    subtitle="Non-program members"
                    icon={Users}
                    colorClass="bg-blue-50 text-blue-600"
                />
            </div>

            {/* Quick Actions */}
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button
                    className="w-full"
                    onClick={() => navigate('/clinicare/visits')}
                >
                    <Heart className="mr-2 h-4 w-4" />
                    View All Visits
                </Button>

                <Button
                    className="w-full"
                    onClick={() => setShowAddVisit(true)}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Record Visit
                </Button>

                <Button
                    className="w-full"
                    onClick={() => navigate('/clinicare/visits?filter=follow-ups')}
                >
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Follow-Ups
                </Button>

                <Button
                    className="w-full"
                    onClick={() => navigate('/clinicare/facilities')}
                >
                    <Building2 className="mr-2 h-4 w-4" />
                    Facilities
                </Button>
            </div>

            {/* Add Visit Dialog */}
            <Dialog open={showAddVisit} onOpenChange={setShowAddVisit}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Record Medical Visit</DialogTitle>
                        <DialogDescription>
                            Enter the details of the medical visit, including patient information, diagnosis, and costs.
                        </DialogDescription>
                    </DialogHeader>
                    <VisitForm
                        onSuccess={() => setShowAddVisit(false)}
                        onCancel={() => setShowAddVisit(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Follow-Up Alerts */}
            {followUps && (followUps.overdue.length > 0 || followUps.upcoming.length > 0) && (
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Overdue Follow-Ups */}
                    {followUps.overdue.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center text-red-700 dark:text-red-400">
                                        <AlertCircle className="mr-2 h-5 w-5" />
                                        Overdue Follow-Ups ({followUps.overdue.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {followUps.overdue.slice(0, 5).map((visit) => (
                                            <div key={visit.id} className="flex items-center justify-between bg-card rounded-lg p-3 border border-border">
                                                <div>
                                                    <p className="font-medium text-foreground">
                                                        {visit.patient?.first_name} {visit.patient?.last_name}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Due: {formatDate(visit.follow_up_date)}
                                                    </p>
                                                </div>
                                                <Badge variant="destructive">Overdue</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {/* Upcoming Follow-Ups */}
                    {followUps.upcoming.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center text-blue-700 dark:text-blue-400">
                                        <AlertCircle className="mr-2 h-5 w-5" />
                                        Upcoming Follow-Ups ({followUps.upcoming.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {followUps.upcoming.slice(0, 5).map((visit) => (
                                            <div key={visit.id} className="flex items-center justify-between bg-card rounded-lg p-3 border border-border">
                                                <div>
                                                    <p className="font-medium text-foreground">
                                                        {visit.patient?.first_name} {visit.patient?.last_name}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Due: {formatDate(visit.follow_up_date)}
                                                    </p>
                                                </div>
                                                <Badge variant="secondary">Scheduled</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </div>
            )}

            {/* Stats Details */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Top Facilities */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Top Facilities (This Month)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {stats?.topFacilities && stats.topFacilities.length > 0 ? (
                                stats.topFacilities.map((facility, index) => (
                                    <motion.div
                                        key={facility.name}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="flex items-center justify-between"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-sm font-semibold text-red-600 dark:text-red-400">
                                                {index + 1}
                                            </div>
                                            <span className="text-sm font-medium text-muted-foreground">{facility.name}</span>
                                        </div>
                                        <span className="text-sm font-semibold text-foreground">{facility.count} visits</span>
                                    </motion.div>
                                ))
                            ) : (
                                <p className="text-sm text-neutral-500">No visits recorded this month</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Top Diagnoses */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Common Diagnoses (This Month)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {stats?.topDiagnoses && stats.topDiagnoses.length > 0 ? (
                                stats.topDiagnoses.map((diagnosis, index) => (
                                    <motion.div
                                        key={diagnosis.name}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="flex items-center justify-between"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-sm font-semibold text-blue-600 dark:text-blue-400">
                                                {index + 1}
                                            </div>
                                            <span className="text-sm font-medium text-muted-foreground">{diagnosis.name}</span>
                                        </div>
                                        <span className="text-sm font-semibold text-foreground">{diagnosis.count} cases</span>
                                    </motion.div>
                                ))
                            ) : (
                                <p className="text-sm text-neutral-500">No diagnoses recorded</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Cost Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Cost Breakdown (This Month)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">Total Cost</p>
                            <p className="text-2xl font-bold text-foreground">
                                {formatCurrency(stats?.totalCost || 0)}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-neutral-500">HOHA Paid</p>
                            <p className="text-2xl font-bold text-green-600">
                                {formatCurrency(stats?.totalHohaContribution || 0)}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-neutral-500">Patient Paid</p>
                            <p className="text-2xl font-bold text-blue-600">
                                {formatCurrency(stats?.totalPatientContribution || 0)}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">Transport</p>
                            <p className="text-2xl font-bold text-orange-600">
                                {formatCurrency(stats?.totalTransportCost || 0)}
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Average Cost per Visit</span>
                            <span className="font-semibold text-foreground">
                                {formatCurrency(stats?.averageCostPerVisit || 0)}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm mt-2">
                            <span className="text-muted-foreground">Visits with Transport</span>
                            <span className="font-semibold text-foreground">
                                {stats?.visitsWithTransport || 0} ({stats?.totalVisits > 0 ? Math.round((stats.visitsWithTransport / stats.totalVisits) * 100) : 0}%)
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}