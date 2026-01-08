import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDistributions, useCreateDistribution } from '@/hooks/useFoodDistribution'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Package, Plus, Calendar, MapPin } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { QUARTERS } from '@/lib/constants'
import { motion } from 'framer-motion'

export function Distributions() {
    const navigate = useNavigate()
    const [showCreate, setShowCreate] = useState(false)
    const { data: distributions, isLoading } = useDistributions()

    if (isLoading) return <LoadingSpinner />

    return (
        <div className="space-y-6">
            <PageHeader
                title="Food Distributions"
                description={`${distributions?.length || 0} distribution events`}
                action={() => setShowCreate(true)}
                actionLabel="Plan Distribution"
                actionIcon={Plus}
            />

            {distributions && distributions.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {distributions.map((dist, index) => (
                        <motion.div
                            key={dist.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card
                                className="cursor-pointer hover:shadow-lg transition-shadow"
                                onClick={() => navigate(`/food/distributions/${dist.id}`)}
                            >
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-3 rounded-lg bg-green-50">
                                                <Package className="h-6 w-6 text-green-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-neutral-900">
                                                    {dist.quarter} {new Date(dist.distribution_date).getFullYear()}
                                                </h3>
                                                <Badge variant={new Date(dist.distribution_date) > new Date() ? 'secondary' : 'success'}>
                                                    {new Date(dist.distribution_date) > new Date() ? 'Upcoming' : 'Completed'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center text-neutral-600">
                                            <Calendar className="mr-2 h-4 w-4" />
                                            {formatDate(dist.distribution_date)}
                                        </div>
                                        <div className="flex items-center text-neutral-600">
                                            <MapPin className="mr-2 h-4 w-4" />
                                            {dist.distribution_location}
                                        </div>
                                        <div className="flex items-center justify-between pt-2 border-t">
                                            <span className="text-neutral-600">Hampers Distributed</span>
                                            <span className="font-semibold text-neutral-900">
                                                {dist.total_hampers_distributed || 0}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon={Package}
                    title="No distributions yet"
                    description="Plan your first food distribution event"
                    action={() => setShowCreate(true)}
                    actionLabel="Plan Distribution"
                />
            )}

            <CreateDistributionDialog
                open={showCreate}
                onOpenChange={setShowCreate}
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
            <DialogContent>
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
                    <div className="flex justify-end space-x-3">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={createDistribution.isPending}>
                            Create Distribution
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}