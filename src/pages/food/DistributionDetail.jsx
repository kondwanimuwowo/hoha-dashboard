import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDistribution, useMarkCollected, useRemoveRecipient } from '@/hooks/useFoodDistribution'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { RecipientsList } from '@/components/food/RecipientsList'
import { AddRecipientDialog } from '@/components/food/AddRecipientDialog'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar, MapPin, Package, Plus, CheckCircle, ArrowLeft } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { motion } from 'framer-motion'

export function DistributionDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [showAddRecipient, setShowAddRecipient] = useState(false)
    const [viewMode, setViewMode] = useState('detail') // 'detail' or 'checkin'
    const [success, setSuccess] = useState('')

    console.log('Fetching distribution for ID:', id)
    const { data: distribution, isLoading, error: queryError } = useDistribution(id)
    const markCollected = useMarkCollected()
    const removeRecipient = useRemoveRecipient()

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
        }
    }

    const handleRemoveRecipient = async (recipientId) => {
        if (!confirm('Are you sure you want to remove this recipient?')) return

        try {
            await removeRecipient.mutateAsync(recipientId)
        } catch (err) {
            console.error('Failed to remove recipient:', err)
        }
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
            <div className="flex items-center justify-between">
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
                    <Button
                        variant={viewMode === 'detail' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('detail')}
                    >
                        Detail View
                    </Button>
                    <Button
                        variant={viewMode === 'checkin' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('checkin')}
                    >
                        Check-in Mode
                    </Button>
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
        </div>
    )
}
