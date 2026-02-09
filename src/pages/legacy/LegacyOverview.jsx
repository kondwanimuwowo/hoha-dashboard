import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { useWomen } from '@/hooks/useWomen'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatsCard } from '@/components/shared/StatsCard'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, CheckCircle, Award, UserPlus, ClipboardList } from 'lucide-react'
import { LEGACY_STAGES } from '@/lib/constants'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { WomenForm } from '@/components/legacy/WomenForm'

export function LegacyOverview() {
    const navigate = useNavigate()
    const [showAddWoman, setShowAddWoman] = useState(false)
    const { data: women, isLoading } = useWomen()

    if (isLoading) return <LoadingSpinner />

    // Calculate stats
    const totalWomen = women?.length || 0
    const activeWomen = women?.filter(w => w.status === 'Active').length || 0
    const completedWomen = women?.filter(w => w.status === 'Completed').length || 0
    const completionRate = totalWomen > 0 ? ((completedWomen / totalWomen) * 100).toFixed(0) : 0

    // Group by stage
    const stageDistribution = LEGACY_STAGES.map(stage => ({
        stage,
        count: women?.filter(w => w.stage === stage && w.status === 'Active').length || 0
    }))

    return (
        <div className="space-y-6">
            <PageHeader
                title="Legacy Women's Program"
                description="Empowering women through skills training, counseling, and mentorship"
            />

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Total Enrolled"
                    value={totalWomen}
                    subtitle="All time"
                    icon={Users}
                    colorClass="bg-purple-50 text-purple-600"
                />
                <StatsCard
                    title="Active Participants"
                    value={activeWomen}
                    subtitle="Currently enrolled"
                    icon={CheckCircle}
                    colorClass="bg-green-50 text-green-600"
                />
                <StatsCard
                    title="Completed"
                    value={completedWomen}
                    subtitle="Graduated women"
                    icon={Award}
                    colorClass="bg-blue-50 text-blue-600"
                />
                <StatsCard
                    title="Completion Rate"
                    value={`${completionRate}%`}
                    subtitle="Success rate"
                    icon={Award}
                    colorClass="bg-orange-50 text-orange-600"
                />
            </div>

            {/* Quick Actions */}
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                    className="w-full"
                    onClick={() => navigate('/legacy/participants')}
                >
                    <Users className="mr-2 h-4 w-4" />
                    View Participants
                </Button>

                <Button
                    className="w-full"
                    onClick={() => navigate('/legacy/attendance')}
                >
                    <ClipboardList className="mr-2 h-4 w-4" />
                    Mark Attendance
                </Button>

                <Button
                    className="w-full"
                    onClick={() => setShowAddWoman(true)}
                >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Register Woman
                </Button>
            </div>

            {/* Add Woman Dialog */}
            <Dialog open={showAddWoman} onOpenChange={setShowAddWoman}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Register New Participant</DialogTitle>
                    </DialogHeader>
                    <WomenForm
                        onSuccess={() => setShowAddWoman(false)}
                        onCancel={() => setShowAddWoman(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Stage Distribution */}
            <Card>
                <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Active Participants by Stage</h3>
                    <div className="space-y-3">
                        {stageDistribution.map((item, index) => (
                            <motion.div
                                key={item.stage}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                                className="flex items-center justify-between"
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="w-24 text-sm font-medium text-muted-foreground">
                                        {item.stage}
                                    </div>
                                    <div className="flex-1">
                                        <div className="h-2 w-full max-w-xs rounded-full bg-muted overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(item.count / activeWomen) * 100}%` }}
                                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                                className="h-full bg-purple-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="ml-4 text-sm font-semibold text-foreground">
                                    {item.count} women
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Program Impact */}
            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Program Focus Areas</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex items-start">
                                <div className="mr-3 mt-0.5 h-2 w-2 rounded-full bg-purple-500"></div>
                                <div>
                                    <p className="font-medium text-foreground">Trauma Counseling</p>
                                    <p className="text-muted-foreground">Group and individual support sessions</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <div className="mr-3 mt-0.5 h-2 w-2 rounded-full bg-purple-500"></div>
                                <div>
                                    <p className="font-medium text-foreground">Life Skills Training</p>
                                    <p className="text-muted-foreground">Financial literacy, health, parenting</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <div className="mr-3 mt-0.5 h-2 w-2 rounded-full bg-purple-500"></div>
                                <div>
                                    <p className="font-medium text-foreground">English Language</p>
                                    <p className="text-muted-foreground">Communication and literacy development</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <div className="mr-3 mt-0.5 h-2 w-2 rounded-full bg-purple-500"></div>
                                <div>
                                    <p className="font-medium text-foreground">Vocational Skills</p>
                                    <p className="text-muted-foreground">Tailoring, crafts, business training</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Family Impact</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Women with children in Educare</span>
                                <span className="text-lg font-semibold text-foreground">
                                    {women?.filter(w => w.children?.length > 0).length || 0}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Total children supported</span>
                                <span className="text-lg font-semibold text-foreground">
                                    {women?.reduce((sum, w) => sum + (w.children?.length || 0), 0) || 0}
                                </span>
                            </div>
                            <div className="pt-3 border-t border-border">
                                <p className="text-sm text-muted-foreground">
                                    When mothers thrive, entire families are transformed. Our holistic approach
                                    ensures children benefit from their mothers' growth and new skills.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
