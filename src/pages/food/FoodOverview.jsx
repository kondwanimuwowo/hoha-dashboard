import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useDistributions } from '@/hooks/useFoodDistribution'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatsCard } from '@/components/shared/StatsCard'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Package, Calendar, Users, Plus, History } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useCreateDistribution } from '@/hooks/useFoodDistribution'
import { QUARTERS } from '@/lib/constants'

export function FoodOverview() {
    const navigate = useNavigate()
    const [showCreate, setShowCreate] = useState(false)
    const { data: distributions, isLoading } = useDistributions()

    if (isLoading) return <LoadingSpinner />

    const currentYear = new Date().getFullYear()
    const thisYearDistributions = distributions?.filter(d =>
        new Date(d.distribution_date).getFullYear() === currentYear
    ) || []

    const totalHampers = thisYearDistributions.reduce((sum, d) => sum + (d.total_hampers_distributed || 0), 0)
    const totalFamiliesServed = thisYearDistributions.reduce((sum, d) => sum + (d.families_served || 0), 0)
    const nextDistribution = distributions?.find(d =>
        new Date(d.distribution_date) >= new Date()
    )

    const quarterCounts = {
        Q1: thisYearDistributions.filter(d => d.quarter === 'Q1').length,
        Q2: thisYearDistributions.filter(d => d.quarter === 'Q2').length,
        Q3: thisYearDistributions.filter(d => d.quarter === 'Q3').length,
        Q4: thisYearDistributions.filter(d => d.quarter === 'Q4').length,
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <PageHeader
                    title="Food Distribution"
                    description="Quarterly food hamper distribution to families in need"
                />
                <Button variant="outline" onClick={() => navigate('/food/history')}>
                    <History className="mr-2 h-4 w-4" />
                    View History
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Total Distributions"
                    value={thisYearDistributions.length}
                    subtitle={`In ${currentYear}`}
                    icon={Calendar}
                    colorClass="bg-green-50 text-green-600"
                />
                <StatsCard
                    title="Hampers Distributed"
                    value={totalHampers}
                    subtitle="This year"
                    icon={Package}
                    colorClass="bg-blue-50 text-blue-600"
                />
                <StatsCard
                    title="Families Served"
                    value={totalFamiliesServed}
                    subtitle="Distinct households"
                    icon={Users}
                    colorClass="bg-purple-50 text-purple-600"
                />
                <StatsCard
                    title="Next Distribution"
                    value={nextDistribution ? formatDate(nextDistribution.distribution_date) : 'Not scheduled'}
                    subtitle={nextDistribution ? nextDistribution.quarter : 'Plan upcoming'}
                    icon={Calendar}
                    colorClass="bg-orange-50 text-orange-600"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                    className="w-full"
                    onClick={() => navigate('/food/distributions')}
                >
                    <Package className="mr-2 h-4 w-4" />
                    View Distributions
                </Button>

                <Button
                    className="w-full"
                    onClick={() => setShowCreate(true)}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Plan Distribution
                </Button>

            </div>

            <CreateDistributionDialog
                open={showCreate}
                onOpenChange={setShowCreate}
            />

            <Card>
                <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Distributions by Quarter ({currentYear})</h3>
                    <div className="grid grid-cols-4 gap-4">
                        {['Q1', 'Q2', 'Q3', 'Q4'].map((quarter, index) => (
                            <motion.div
                                key={quarter}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="text-center p-4 rounded-lg bg-muted"
                            >
                                <div className="text-2xl font-bold text-foreground">{quarterCounts[quarter]}</div>
                                <div className="text-sm text-muted-foreground">{quarter}</div>
                            </motion.div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Recent Distributions</h3>
                    <div className="space-y-3">
                        {distributions && distributions.slice(0, 5).map((dist, index) => (
                            <motion.div
                                key={dist.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent transition-colors cursor-pointer"
                                onClick={() => navigate(`/food/distributions/${dist.id}`)}
                            >
                                <div>
                                    <p className="font-medium text-foreground">
                                        {dist.quarter} {new Date(dist.distribution_date).getFullYear()} Distribution
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {formatDate(dist.distribution_date)} &bull; {dist.distribution_location}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-foreground">{dist.total_hampers_distributed || 0}</p>
                                    <p className="text-sm text-muted-foreground">hampers</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function CreateDistributionDialog({ open, onOpenChange }) {
    const navigate = useNavigate()
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
            const data = await createDistribution.mutateAsync(formData)
            onOpenChange(false)
            if (data?.id) {
                navigate(`/food/distributions/${data.id}`)
            }
        } catch (err) {
            console.error('Failed to create distribution from Overview:', err)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Plan Food Distribution</DialogTitle>
                    <div hidden>
                        <DialogDescription>
                            Enter details for the new food distribution
                        </DialogDescription>
                    </div>
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
