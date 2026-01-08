import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Package, Users, Calendar, Plus } from 'lucide-react'
import { useEmergencyDistributions } from '@/hooks/useEmergencyRelief'
import { EmergencyDistributionForm } from '@/components/emergency-relief/EmergencyDistributionForm'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

export default function EmergencyReliefOverview() {
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const { data: distributions, isLoading } = useEmergencyDistributions()

    const recentDistributions = distributions?.slice(0, 5) || []
    const totalDistributions = distributions?.length || 0
    const totalFamiliesHelped = distributions?.reduce((sum, d) => sum + (d.recipients?.length || 0), 0) || 0

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Emergency Relief</h1>
                    <p className="text-muted-foreground">
                        Manage emergency food hamper distributions for vulnerable families
                    </p>
                </div>
                <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Distribution
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Distributions</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalDistributions}</div>
                        <p className="text-xs text-muted-foreground">All-time emergency relief</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Families Helped</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalFamiliesHelped}</div>
                        <p className="text-xs text-muted-foreground">Unique families assisted</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">This Month</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {distributions?.filter(d => {
                                const date = new Date(d.distribution_date)
                                const now = new Date()
                                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
                            }).length || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Distributions this month</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Distributions */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Distributions</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <p className="text-muted-foreground">Loading...</p>
                    ) : recentDistributions.length === 0 ? (
                        <p className="text-muted-foreground">No distributions yet</p>
                    ) : (
                        <div className="space-y-3">
                            {recentDistributions.map((dist) => (
                                <div
                                    key={dist.id}
                                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div>
                                        <div className="font-medium">
                                            {new Date(dist.distribution_date).toLocaleDateString()}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {dist.reason || 'Emergency relief distribution'}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-medium">{dist.recipients?.length || 0} families</div>
                                        <div className="text-sm text-muted-foreground">
                                            {dist.recipients?.filter(r => r.collected).length || 0} collected
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create Distribution Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Create Emergency Distribution</DialogTitle>
                    </DialogHeader>
                    <EmergencyDistributionForm
                        onSuccess={() => setShowCreateDialog(false)}
                        onCancel={() => setShowCreateDialog(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}
