import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    useEmergencyDistribution,
    useMarkEmergencyCollected,
    useUpdateEmergencyDistribution,
    useDeleteEmergencyDistribution,
    useUpdateEmergencyRecipient,
    useRemoveEmergencyRecipient,
} from '@/hooks/useEmergencyRelief'
import { useAuth } from '@/hooks/useAuth'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { AddEmergencyRecipientDialog } from '@/components/emergency-relief/AddEmergencyRecipientDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ArrowLeft, Calendar, Package, Users, Printer, CheckCircle, Clock, Edit, Trash2, Pencil, Plus, X } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { PersonAvatar } from '@/components/shared/PersonAvatar'
import { toast } from 'sonner'

const escapeHtml = (value) =>
    String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

const getRecipientName = (recipient) => {
    const head = recipient.family_head
    if (head) return `${head.first_name || ''} ${head.last_name || ''}`.trim()
    return recipient.ad_hoc_name || 'Unknown'
}

export function EmergencyReliefDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { isAdmin } = useAuth()
    const { data: distribution, isLoading } = useEmergencyDistribution(id)

    const markCollected = useMarkEmergencyCollected()
    const updateDistribution = useUpdateEmergencyDistribution()
    const deleteDistribution = useDeleteEmergencyDistribution()
    const updateRecipient = useUpdateEmergencyRecipient()
    const removeRecipient = useRemoveEmergencyRecipient()

    const [showEdit, setShowEdit] = useState(false)
    const [editForm, setEditForm] = useState({ distribution_date: '', reason: '', notes: '' })
    const [showDelete, setShowDelete] = useState(false)
    const [showAddRecipient, setShowAddRecipient] = useState(false)
    const [recipientToEdit, setRecipientToEdit] = useState(null)
    const [itemsDraft, setItemsDraft] = useState('')
    const [recipientToRemove, setRecipientToRemove] = useState(null)

    if (isLoading) return <LoadingSpinner />

    if (!distribution) {
        return (
            <div className="p-6 text-center text-muted-foreground">
                Distribution not found.
            </div>
        )
    }

    const recipients = distribution.recipients || []
    const collectedCount = recipients.filter(r => r.collected || r.is_collected).length
    const total = recipients.length
    const existingPersonIds = recipients.map(r => r.family_head_id).filter(Boolean)

    const handleToggleCollected = async (recipient) => {
        const newState = !(recipient.collected || recipient.is_collected)
        try {
            await markCollected.mutateAsync({ recipientId: recipient.id, collected: newState })
            toast.success(newState ? 'Marked as collected' : 'Marked as pending')
        } catch (err) {
            toast.error('Failed to update: ' + err.message)
        }
    }

    const startEditing = () => {
        setEditForm({
            distribution_date: (distribution.distribution_date || '').split('T')[0],
            reason: distribution.reason || '',
            notes: distribution.notes || '',
        })
        setShowEdit(true)
    }

    const handleUpdateDistribution = async (e) => {
        e.preventDefault()
        if (editForm.reason.trim().length < 3) {
            toast.error('Please describe the reason (at least 3 characters)')
            return
        }
        try {
            await updateDistribution.mutateAsync({
                id,
                distribution_date: editForm.distribution_date,
                reason: editForm.reason.trim(),
                notes: editForm.notes.trim(),
            })
            toast.success('Distribution updated')
            setShowEdit(false)
        } catch (err) {
            toast.error('Failed to update distribution: ' + err.message)
        }
    }

    const handleDeleteDistribution = async () => {
        try {
            await deleteDistribution.mutateAsync(id)
            toast.success('Distribution deleted')
            navigate('/emergency-relief')
        } catch (err) {
            toast.error('Failed to delete distribution: ' + err.message)
            setShowDelete(false)
        }
    }

    const startEditingItems = (recipient) => {
        setItemsDraft(recipient.items_provided || '')
        setRecipientToEdit(recipient)
    }

    const handleSaveItems = async (e) => {
        e.preventDefault()
        try {
            await updateRecipient.mutateAsync({ recipientId: recipientToEdit.id, items_provided: itemsDraft.trim() })
            toast.success('Items updated')
            setRecipientToEdit(null)
        } catch (err) {
            toast.error('Failed to update items: ' + err.message)
        }
    }

    const handleRemoveRecipient = async () => {
        try {
            await removeRecipient.mutateAsync(recipientToRemove.id)
            toast.success('Recipient removed')
        } catch (err) {
            toast.error('Failed to remove recipient: ' + err.message)
        } finally {
            setRecipientToRemove(null)
        }
    }

    const handlePrint = () => {
        const rows = recipients.map((r, i) => {
            const head = r.family_head
            const isCollected = r.collected || r.is_collected
            return `<tr>
                <td>${i + 1}</td>
                <td>${escapeHtml(getRecipientName(r))}</td>
                <td>${escapeHtml(head?.phone_number || '-')}</td>
                <td>${escapeHtml(r.items_provided || '-')}</td>
                <td>${isCollected ? 'Collected' : 'Pending'}</td>
            </tr>`
        }).join('')

        const html = `<!doctype html><html><head><meta charset="utf-8"/>
            <title>Emergency Relief Distribution</title>
            <style>body{font-family:Arial,sans-serif;padding:20px;color:#111;}h1{margin-bottom:4px;}
            .meta{color:#555;font-size:13px;margin-bottom:16px;}
            table{width:100%;border-collapse:collapse;}
            th,td{border:1px solid #ddd;padding:8px;text-align:left;}
            th{background:#f5f5f5;}</style></head>
            <body><h1>Emergency Relief Distribution</h1>
            <div class="meta">
                <div><strong>Date:</strong> ${escapeHtml(formatDate(distribution.distribution_date))}</div>
                <div><strong>Reason:</strong> ${escapeHtml(distribution.reason || 'Emergency relief distribution')}</div>
                <div><strong>Collected:</strong> ${collectedCount}/${total}</div>
            </div>
            <table><thead><tr><th>#</th><th>Family Head</th><th>Phone</th><th>Items</th><th>Status</th></tr></thead>
            <tbody>${rows}</tbody></table></body></html>`

        const win = window.open('', '_blank')
        if (!win) return
        win.document.write(html)
        win.document.close()
        win.focus()
        win.print()
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => navigate(-1)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print List
                    </Button>
                    {isAdmin && (
                        <>
                            <Button variant="outline" onClick={startEditing}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                            <Button variant="outline" className="text-red-600 hover:text-red-700" onClick={() => setShowDelete(true)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Distribution Info */}
            <Card>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex items-start gap-3">
                            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-sm text-muted-foreground">Date</p>
                                <p className="font-semibold">{formatDate(distribution.distribution_date)}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-sm text-muted-foreground">Reason</p>
                                <p className="font-semibold">{distribution.reason || 'Emergency relief distribution'}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-sm text-muted-foreground">Collection Progress</p>
                                <p className="font-semibold">{collectedCount}/{total} collected</p>
                            </div>
                        </div>
                    </div>

                    {distribution.notes && (
                        <div className="mt-4 pt-4 border-t">
                            <p className="text-sm text-muted-foreground">Notes</p>
                            <p className="mt-1">{distribution.notes}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Recipients */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Recipients ({total})
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={() => setShowAddRecipient(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Recipient
                    </Button>
                </CardHeader>
                <CardContent>
                    {total === 0 ? (
                        <p className="text-muted-foreground text-center py-8">No recipients recorded for this distribution.</p>
                    ) : (
                        <div className="space-y-2">
                            {recipients.map((recipient) => {
                                const head = recipient.family_head
                                const name = getRecipientName(recipient)
                                const isCollected = recipient.collected || recipient.is_collected
                                return (
                                    <div
                                        key={recipient.id}
                                        className="flex items-center justify-between p-3 border rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <PersonAvatar
                                                firstName={head ? head.first_name : name}
                                                lastName={head?.last_name}
                                                gender={head?.gender}
                                                className="h-9 w-9"
                                            />
                                            <div>
                                                <p className="font-medium">
                                                    {name}
                                                    {!head && recipient.ad_hoc_name && (
                                                        <span className="ml-2 text-xs font-normal text-muted-foreground">Non-registered</span>
                                                    )}
                                                </p>
                                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                    {head?.phone_number && <span>{head.phone_number}</span>}
                                                    {recipient.items_provided && <span>Items: {recipient.items_provided}</span>}
                                                </div>
                                                {recipient.collected_by && (
                                                    <p className="text-xs text-muted-foreground">Collected by: {recipient.collected_by}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={isCollected ? 'success' : 'secondary'}>
                                                {isCollected ? 'Collected' : 'Pending'}
                                            </Badge>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                title={isCollected ? 'Mark as pending' : 'Mark as collected'}
                                                onClick={() => handleToggleCollected(recipient)}
                                                disabled={markCollected.isPending}
                                            >
                                                {isCollected ? (
                                                    <Clock className="h-4 w-4" />
                                                ) : (
                                                    <CheckCircle className="h-4 w-4" />
                                                )}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                title="Edit items provided"
                                                onClick={() => startEditingItems(recipient)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                title="Remove recipient"
                                                className="text-red-600 hover:text-red-700"
                                                onClick={() => setRecipientToRemove(recipient)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            <AddEmergencyRecipientDialog
                open={showAddRecipient}
                onOpenChange={setShowAddRecipient}
                distributionId={id}
                existingPersonIds={existingPersonIds}
            />

            {/* Edit Distribution Dialog */}
            <Dialog open={showEdit} onOpenChange={setShowEdit}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Distribution</DialogTitle>
                        <DialogDescription>Update the date, reason or notes.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateDistribution} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Date</Label>
                                <Input
                                    type="date"
                                    value={editForm.distribution_date}
                                    onChange={(e) => setEditForm({ ...editForm, distribution_date: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Reason/Crisis</Label>
                                <Input
                                    value={editForm.reason}
                                    onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Notes</Label>
                            <Textarea
                                value={editForm.notes}
                                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                rows={3}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
                            <Button type="submit" disabled={updateDistribution.isPending}>
                                {updateDistribution.isPending ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Items Dialog */}
            <Dialog open={!!recipientToEdit} onOpenChange={(open) => !open && setRecipientToEdit(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Items Provided</DialogTitle>
                        <DialogDescription>
                            {recipientToEdit ? getRecipientName(recipientToEdit) : ''}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveItems} className="space-y-4 py-4">
                        <Input
                            placeholder="e.g., 10kg mealie meal, 2L cooking oil"
                            value={itemsDraft}
                            onChange={(e) => setItemsDraft(e.target.value)}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setRecipientToEdit(null)}>Cancel</Button>
                            <Button type="submit" disabled={updateRecipient.isPending}>
                                {updateRecipient.isPending ? 'Saving...' : 'Save'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!recipientToRemove}
                onOpenChange={(open) => !open && setRecipientToRemove(null)}
                title="Remove recipient?"
                description={`Remove ${recipientToRemove ? getRecipientName(recipientToRemove) : 'this recipient'} from this distribution? This cannot be undone.`}
                confirmLabel="Remove"
                variant="destructive"
                onConfirm={handleRemoveRecipient}
                isPending={removeRecipient.isPending}
            />

            <ConfirmDialog
                open={showDelete}
                onOpenChange={setShowDelete}
                title="Delete distribution?"
                description="This permanently deletes the distribution and all of its recipients and collection records. This cannot be undone."
                confirmLabel="Delete Permanently"
                variant="destructive"
                onConfirm={handleDeleteDistribution}
                isPending={deleteDistribution.isPending}
            />
        </div>
    )
}
