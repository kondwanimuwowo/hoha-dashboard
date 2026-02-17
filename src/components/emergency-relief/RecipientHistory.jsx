import { useRecipientHistory } from '@/hooks/useEmergencyRelief'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { PersonAvatar } from '@/components/shared/PersonAvatar'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Calendar, Package, Clock, Shield } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export function RecipientHistory({ recipient, open, onOpenChange }) {
    const { data: history, isLoading } = useRecipientHistory(recipient?.family_head?.id)

    // Sort history by distribution date descending
    const sortedHistory = history?.sort((a, b) => {
        const dateA = new Date(a.distribution?.distribution_date || 0)
        const dateB = new Date(b.distribution?.distribution_date || 0)
        return dateB - dateA
    }) || []

    const person = recipient?.family_head

    if (!person) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 pb-4 border-b">
                    <div className="flex items-start gap-4">
                        <PersonAvatar
                            firstName={person.first_name}
                            lastName={person.last_name}
                            photoUrl={person.photo_url}
                            gender={person.gender}
                            className="h-16 w-16"
                        />
                        <div className="flex-1">
                            <DialogTitle className="text-2xl mb-1">
                                {person.first_name} {person.last_name}
                            </DialogTitle>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {person.is_registered_member ? (
                                    <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
                                        <Shield className="w-3 h-3 mr-1" />
                                        HOHA Registered Member
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary">
                                        Non-Registered Member
                                    </Badge>
                                )}
                                <Badge variant="outline">
                                    {history?.length || 0} Distributions Received
                                </Badge>
                            </div>
                            <DialogDescription>
                                {person.phone_number && (
                                    <span className="mr-3">{person.phone_number}</span>
                                )}
                                {person.compound_area && (
                                    <span>{person.compound_area}</span>
                                )}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 p-6">
                    {isLoading ? (
                        <div className="py-12 flex justify-center">
                            <LoadingSpinner />
                        </div>
                    ) : sortedHistory.length > 0 ? (
                        <div className="relative border-l border-neutral-200 ml-3 space-y-8">
                            {sortedHistory.map((record, index) => (
                                <div key={record.id} className="relative pl-8">
                                    {/* Timeline dot */}
                                    <div className={`absolute left-[-5px] top-1 h-2.5 w-2.5 rounded-full border-2 ${index === 0 ? 'bg-green-600 border-green-600' : 'bg-white border-neutral-300'
                                        }`} />

                                    <div className="mb-1 flex items-center justify-between">
                                        <span className={`text-sm font-medium ${index === 0 ? 'text-green-700' : 'text-neutral-500'}`}>
                                            {formatDate(record.distribution?.distribution_date)}
                                        </span>
                                        {index === 0 && (
                                            <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200 text-[10px] h-5">
                                                Latest
                                            </Badge>
                                        )}
                                    </div>

                                    <Card className={index === 0 ? 'border-green-200 shadow-sm' : 'border-neutral-100 bg-neutral-50/50'}>
                                        <CardContent className="p-4 space-y-3">
                                            {/* Items */}
                                            {record.items_provided && (
                                                <div className="flex items-start gap-3">
                                                    <Package className="w-4 h-4 text-neutral-400 mt-1 shrink-0" />
                                                    <div>
                                                        <div className="font-medium text-sm text-neutral-900">Items Provided</div>
                                                        <div className="text-sm text-neutral-600">{record.items_provided}</div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Collection Details */}
                                            {record.collected && (
                                                <div className="flex items-start gap-3">
                                                    <Clock className="w-4 h-4 text-neutral-400 mt-1 shrink-0" />
                                                    <div>
                                                        <div className="font-medium text-sm text-neutral-900">Collection Details</div>
                                                        <div className="text-sm text-neutral-600">
                                                            Collected by {record.collected_by || 'Recipient'}
                                                            {record.collection_time && ` on ${formatDate(record.collection_time)}`}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Notes */}
                                            {record.notes && (
                                                <div className="text-sm text-neutral-600 bg-neutral-100/50 p-2 rounded mt-2 italic">
                                                    "{record.notes}"
                                                </div>
                                            )}

                                            {/* Distribution Reason (if available) */}
                                            {record.distribution?.reason && (
                                                <div className="text-xs text-neutral-500 mt-1">
                                                    Event: {record.distribution.reason}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-neutral-500">
                            No distribution history found for this person.
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}
