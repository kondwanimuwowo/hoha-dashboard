import { motion } from 'framer-motion'
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDistribution, useMarkCollected, useRemoveRecipient, useDeleteDistribution, useUpdateDistribution } from '@/hooks/useFoodDistribution'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { RecipientsList } from '@/components/food/RecipientsList'
import { AddRecipientDialog } from '@/components/food/AddRecipientDialog'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar, MapPin, Package, Plus, CheckCircle, ArrowLeft, Trash2, Edit } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'

export function DistributionDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { profile } = useAuth()
    const isAdmin = profile?.role === 'Admin'

    const [showAddRecipient, setShowAddRecipient] = useState(false)
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [viewMode, setViewMode] = useState('detail') // 'detail' or 'checkin'
    const [success, setSuccess] = useState('')

    const { data: distribution, isLoading, error: queryError } = useDistribution(id)
    const markCollected = useMarkCollected()
    const removeRecipient = useRemoveRecipient()
    const deleteDistribution = useDeleteDistribution()
    const updateDistribution = useUpdateDistribution()

    const [editForm, setEditForm] = useState({
        distribution_date: '',
        distribution_location: '',
        notes: '',
        quarter: '',
        status: ''
    })

    if (queryError) {
        console.error('Query error in DistributionDetail:', queryError)
    }

    const handleMarkCollected = async (recipientId) => {
        try {
            await markCollected.mutateAsync({
                recipientId,
                collectionTime: new Date().toISOString(),
            })
            setSuccess('Hamper marked as collected!')
            setTimeout(() => setSuccess(''), 3000)
        } catch (err) {
            console.error('Failed to mark collected:', err)
            toast.error('Failed to mark as collected')
        }
    }

    const handleRemoveRecipient = async (recipientId) => {
        if (!confirm('Are you sure you want to remove this recipient?')) return

        try {
            await removeRecipient.mutateAsync(recipientId)
            toast.success('Recipient removed')
        } catch (err) {
            console.error('Failed to remove recipient:', err)
            toast.error('Failed to remove recipient')
        }
    }

    const handleDeleteDistribution = async () => {
        try {
            await deleteDistribution.mutateAsync(id)
            toast.success('Distribution deleted successfully')
            navigate('/food/distributions')
        } catch (err) {
            console.error('Failed to delete distribution:', err)
            toast.error('Failed to delete distribution: ' + err.message)
        }
    }

    const handleUpdateDistribution = async (e) => {
        e.preventDefault()
        try {
            await updateDistribution.mutateAsync({
                id,
                ...editForm
            })
            toast.success('Distribution updated')
            setShowEditDialog(false)
        } catch (err) {
            console.error('Failed to update distribution:', err)
            toast.error('Failed to update distribution')
        }
    }

    const startEditing = () => {
        setEditForm({
            distribution_date: distribution.distribution_date.split('T')[0],
            distribution_location: distribution.distribution_location,
            notes: distribution.notes || '',
            quarter: distribution.quarter,
            status: distribution.status
        })
        setShowEditDialog(true)
    }

    if (isLoading) return <LoadingSpinner />

    if (!distribution) {
        return (
            <div className="p-6">
                <Alert variant="destructive">
                    <AlertDescription>Distribution not found</AlertDescription>
                </Alert>
            </div>
        )
    }

    const recipients = distribution.recipients || []
    const collected = recipients.filter(r => r.collection_time).length
    const total = recipients.length
    const progress = total > 0 ? (collected / total) * 100 : 0

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/food/distributions')}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <PageHeader
                        title={`${distribution.quarter} ${new Date(distribution.distribution_date).getFullYear()} Distribution`}
                        description={`${collected}/${total} hampers collected`}
                    />
                </div>
                <div className="flex items-center space-x-2">
                    <div className="flex bg-neutral-100 p-1 rounded-lg mr-2">
                        <Button
                            variant={viewMode === 'detail' ? 'white' : 'ghost'}
                            size="sm"
                            className={viewMode === 'detail' ? 'bg-white shadow-sm' : ''}
                            onClick={() => setViewMode('detail')}
                        >
                            Detail View
                        </Button>
                        <Button
                            variant={viewMode === 'checkin' ? 'white' : 'ghost'}
                            size="sm"
                            className={viewMode === 'checkin' ? 'bg-white shadow-sm' : ''}
                            onClick={() => setViewMode('checkin')}
                        >
                            Check-in Mode
                        </Button>
                    </div>

                    {isAdmin && (
                        <div className="flex items-center gap-2 border-l pl-2">
                            <Button variant="outline" size="sm" onClick={startEditing}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                            </Button>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => setShowDeleteConfirm(true)}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {success && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Alert className="border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">{success}</AlertDescription>
                    </Alert>
                </motion.div>
            )}

            {/* Distribution Info */}
            <Card>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex items-start space-x-3">
                            <Calendar className="h-5 w-5 text-neutral-400 mt-0.5" />
                            <div>
                                <div className="text-sm text-neutral-600">Date</div>
                                <div className="font-semibold">{formatDate(distribution.distribution_date)}</div>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <MapPin className="h-5 w-5 text-neutral-400 mt-0.5" />
                            <div>
                                <div className="text-sm text-neutral-600">Location</div>
                                <div className="font-semibold">{distribution.distribution_location}</div>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <Package className="h-5 w-5 text-neutral-400 mt-0.5" />
                            <div>
                                <div className="text-sm text-neutral-600">Progress</div>
                                <div className="font-semibold">{collected}/{total} collected</div>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-neutral-600">Collection Progress</span>
                            <span className="font-semibold">{progress.toFixed(0)}%</span>
                        </div>
                        <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-green-600"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>
                    </div>

                    {distribution.notes && (
                        <div className="mt-4 pt-4 border-t">
                            <div className="text-sm text-neutral-600">Notes</div>
                            <div className="text-neutral-900 mt-1">{distribution.notes}</div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Recipients List */}
            <RecipientsList
                recipients={recipients}
                viewMode={viewMode}
                onMarkCollected={handleMarkCollected}
                onRemoveRecipient={handleRemoveRecipient}
                onAddRecipient={() => setShowAddRecipient(true)}
            />

            {/* Add Recipient Dialog */}
            <AddRecipientDialog
                open={showAddRecipient}
                onOpenChange={setShowAddRecipient}
                distributionId={id}
            />

            {/* Edit Distribution Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Distribution</DialogTitle>
                        <DialogDescription>Update distribution details or status.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateDistribution} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Quarter</Label>
                                <Input
                                    value={editForm.quarter}
                                    onChange={e => setEditForm({ ...editForm, quarter: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Date</Label>
                                <Input
                                    type="date"
                                    value={editForm.distribution_date}
                                    onChange={e => setEditForm({ ...editForm, distribution_date: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Location</Label>
                            <Input
                                value={editForm.distribution_location}
                                onChange={e => setEditForm({ ...editForm, distribution_location: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Notes</Label>
                            <Textarea
                                value={editForm.notes}
                                onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                                rows={3}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
                            <Button type="submit" disabled={updateDistribution.isPending}>
                                {updateDistribution.isPending ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-red-600">Delete Distribution?</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this distribution? This will also remove all recorded collections for this event. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteDistribution} disabled={deleteDistribution.isPending}>
                            {deleteDistribution.isPending ? 'Deleting...' : 'Delete Permanently'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

