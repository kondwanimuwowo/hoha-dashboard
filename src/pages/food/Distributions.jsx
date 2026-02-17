import { motion } from 'framer-motion'
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDistributions, useCreateDistribution } from '@/hooks/useFoodDistribution'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { SortableTable } from '@/components/shared/SortableTable'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Package, Plus, Calendar, MapPin, LayoutGrid, List } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { QUARTERS } from '@/lib/constants'

export function Distributions() {
    const navigate = useNavigate()
    const [showCreate, setShowCreate] = useState(false)
    const [viewMode, setViewMode] = useState('table') // 'grid' or 'table'
    const { data: distributions, isLoading } = useDistributions()

    const columns = useMemo(() => [
        {
            accessorKey: 'distribution_date',
            header: 'Date',
            cell: ({ row }) => (
                <div className="font-medium text-neutral-900">
                    {formatDate(row.original.distribution_date)}
                </div>
            ),
        },
        {
            accessorKey: 'quarter',
            header: 'Quarter',
            cell: ({ row }) => (
                <div>
                    {row.original.quarter} {new Date(row.original.distribution_date).getFullYear()}
                </div>
            ),
        },
        {
            accessorKey: 'distribution_location',
            header: 'Location',
            cell: ({ row }) => (
                <div className="flex items-center text-neutral-600">
                    <MapPin className="mr-2 h-4 w-4" />
                    {row.original.distribution_location}
                </div>
            ),
        },
        {
            id: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const isUpcoming = new Date(row.original.distribution_date) > new Date()
                return (
                    <Badge variant={isUpcoming ? 'secondary' : 'success'}>
                        {isUpcoming ? 'Upcoming' : 'Completed'}
                    </Badge>
                )
            },
        },
        {
            accessorKey: 'total_hampers_distributed',
            header: 'Hampers',
            cell: ({ row }) => (
                <div className="font-semibold text-neutral-900 text-right">
                    {row.original.total_hampers_distributed || 0}
                </div>
            ),
        },
    ], [])

    if (isLoading) return <LoadingSpinner />

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <PageHeader
                    title="Food Distributions"
                    description={`${distributions?.length || 0} distribution events`}
                    action={() => setShowCreate(true)}
                    actionLabel="Plan Distribution"
                    actionIcon={Plus}
                />
                <div className="flex items-center bg-white border border-neutral-200 rounded-lg p-1 shadow-sm mt-8">
                    <Button
                        variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                        className="h-8 px-3"
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('table')}
                        className="h-8 px-3"
                    >
                        <List className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {distributions && distributions.length > 0 ? (
                viewMode === 'grid' ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {distributions.map((dist, index) => (
                            <motion.div
                                key={dist.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card
                                    className="cursor-pointer hover:shadow-lg transition-shadow bg-white"
                                    onClick={() => navigate(`/food/distributions/${dist.id}`)}
                                >
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="p-3 rounded-lg bg-green-50 text-green-600">
                                                    <Package className="h-6 w-6" />
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
                                            <div className="flex items-center justify-between pt-2 border-t mt-2">
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
                    <SortableTable
                        columns={columns}
                        data={distributions}
                        onRowClick={(row) => navigate(`/food/distributions/${row.id}`)}
                        emptyMessage="No distributions listed yet"
                    />
                )
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
            console.error('Failed to create distribution:', err)
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

