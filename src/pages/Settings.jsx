import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PersonAvatar } from '@/components/shared/PersonAvatar'
import { User, Bell, Shield, Palette, Mail, School, AlertTriangle, Lock } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/components/shared/ThemeProvider'
import { useState } from 'react'
import { usePromoteStudents } from '@/hooks/useStudents'
import { useUserPreferences, useUpsertUserPreferences } from '@/hooks/useUserPreferences'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'

export function Settings() {
    const { user, profile, updatePassword } = useAuth()
    const { theme, setTheme } = useTheme()
    const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false)
    const [isChangingPassword, setIsChangingPassword] = useState(false)
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    })
    const promoteStudents = usePromoteStudents()
    const { data: preferences } = useUserPreferences(user?.id)
    const upsertPreferences = useUpsertUserPreferences()

    const updatePreferences = async (updates) => {
        if (!user?.id) return

        try {
            await upsertPreferences.mutateAsync({ userId: user.id, updates })
        } catch (error) {
            toast.error('Failed to save settings: ' + error.message)
        }
    }

    const handlePromote = async () => {
        try {
            const results = await promoteStudents.mutateAsync()
            const result = results[0]
            toast.success(`Success! ${result.students_promoted} students promoted and ${result.students_graduated} graduated.`)
            setIsPromoteDialogOpen(false)
        } catch (error) {
            toast.error('Failed to promote students: ' + error.message)
        }
    }

    const handleChangePassword = async () => {
        const { currentPassword, newPassword, confirmPassword } = passwordForm

        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.error('Please fill in all password fields.')
            return
        }
        if (newPassword.length < 8) {
            toast.error('New password must be at least 8 characters.')
            return
        }
        if (newPassword !== confirmPassword) {
            toast.error('New password and confirmation do not match.')
            return
        }
        setIsChangingPassword(true)
        try {
            const { error: updateError } = await updatePassword(newPassword)
            if (updateError) {
                toast.error(updateError.message || 'Failed to update password.')
                return
            }

            setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            })
            toast.success('Password updated successfully.')
        } finally {
            setIsChangingPassword(false)
        }
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Settings"
                description="Manage your account preferences and application settings"
            />

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <User className="w-5 h-5 text-primary-600" />
                            <CardTitle>Profile Information</CardTitle>
                        </div>
                        <CardDescription>View your personal account details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-start gap-6">
                            <PersonAvatar
                                photoUrl={profile?.avatar_url || user?.user_metadata?.avatar_url}
                                firstName={profile?.full_name || user?.email}
                                lastName=""
                                className="w-20 h-20 border-4 border-neutral-100"
                            />
                            <div className="space-y-1">
                                <h3 className="font-medium text-lg text-neutral-900">
                                    {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                                </h3>
                                <p className="text-sm text-neutral-500">{user?.email}</p>
                                <div className="pt-2">
                                    <Button variant="outline" size="sm" disabled>Change Avatar</Button>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                                    <Input id="email" value={user?.email || ''} disabled className="pl-9" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <div className="relative">
                                    <Shield className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                                    <Input id="role" value={profile?.role || 'Data Entry'} disabled className="pl-9" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Palette className="w-5 h-5 text-primary-600" />
                            <CardTitle>Appearance</CardTitle>
                        </div>
                        <CardDescription>Customize the look and feel of the dashboard</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Dark Mode</Label>
                                <p className="text-sm text-neutral-500">
                                    Switch between light and dark themes
                                </p>
                            </div>
                            <Switch
                                checked={theme === 'dark'}
                                onCheckedChange={async (checked) => {
                                    const nextTheme = checked ? 'dark' : 'light'
                                    setTheme(nextTheme)
                                    await updatePreferences({ theme_preference: nextTheme })
                                }}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Compact Mode</Label>
                                <p className="text-sm text-neutral-500">
                                    Reduce spacing in lists and tables
                                </p>
                            </div>
                            <Switch
                                checked={preferences?.compact_mode ?? false}
                                onCheckedChange={(checked) => updatePreferences({ compact_mode: checked })}
                                disabled={upsertPreferences.isPending}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <School className="w-5 h-5 text-primary-600" />
                            <CardTitle>Academic Year Management</CardTitle>
                        </div>
                        <CardDescription>Administrative tools for the end of the school year</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <h4 className="font-semibold text-primary-900">Promote All Students</h4>
                                <p className="text-sm text-primary-700 max-w-xl">
                                    Automatically progress all active students to the next grade level.
                                    Students in Grade 12 will be marked as Graduated. <strong>This action cannot be easily undone.</strong>
                                </p>
                            </div>
                            <Button
                                className="bg-primary-600 hover:bg-primary-700 whitespace-nowrap"
                                onClick={() => setIsPromoteDialogOpen(true)}
                                disabled={promoteStudents.isPending}
                            >
                                Start Progression
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Bell className="w-5 h-5 text-primary-600" />
                            <CardTitle>Notifications</CardTitle>
                        </div>
                        <CardDescription>Configure how you receive alerts</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Email Notifications</Label>
                                <p className="text-sm text-neutral-500">
                                    Receive daily summaries via email
                                </p>
                            </div>
                            <Switch
                                checked={preferences?.email_notifications ?? true}
                                onCheckedChange={(checked) => updatePreferences({ email_notifications: checked })}
                                disabled={upsertPreferences.isPending}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Push Notifications</Label>
                                <p className="text-sm text-neutral-500">
                                    Receive alerts on your device
                                </p>
                            </div>
                            <Switch
                                checked={preferences?.push_notifications ?? true}
                                onCheckedChange={(checked) => updatePreferences({ push_notifications: checked })}
                                disabled={upsertPreferences.isPending}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">System Updates</Label>
                                <p className="text-sm text-neutral-500">
                                    Get notified about platform changes
                                </p>
                            </div>
                            <Switch
                                checked={preferences?.system_updates ?? false}
                                onCheckedChange={(checked) => updatePreferences({ system_updates: checked })}
                                disabled={upsertPreferences.isPending}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Lock className="w-5 h-5 text-primary-600" />
                            <CardTitle>Security</CardTitle>
                        </div>
                        <CardDescription>Change your account password</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="current-password">Current Password</Label>
                            <Input
                                id="current-password"
                                type="password"
                                value={passwordForm.currentPassword}
                                onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                                autoComplete="current-password"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <Input
                                id="new-password"
                                type="password"
                                value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                                autoComplete="new-password"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm New Password</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                value={passwordForm.confirmPassword}
                                onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                                autoComplete="new-password"
                            />
                        </div>
                        <Button
                            onClick={handleChangePassword}
                            disabled={isChangingPassword}
                            className="w-full"
                        >
                            {isChangingPassword ? 'Updating Password...' : 'Update Password'}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isPromoteDialogOpen} onOpenChange={setIsPromoteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Confirm Grade Progression
                        </DialogTitle>
                        <DialogDescription className="pt-2 text-foreground">
                            You are about to move all active students to their next grade levels for the new academic year.
                        </DialogDescription>
                        <CardDescription className="pt-2 text-foreground">
                            You are about to move <strong>all active students</strong> to their next grade levels for the new academic year.
                        </CardDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <ul className="text-sm space-y-2 text-muted-foreground list-disc pl-4">
                            <li>Early Childhood -&gt; Preparatory</li>
                            <li>Grade 1-11 -&gt; Next Grade</li>
                            <li>Grade 12 -&gt; Graduated</li>
                            <li>Status remains "Active" (except graduates)</li>
                        </ul>
                        <p className="text-sm font-medium text-destructive">
                            Please ensure you have a backup or have verified all current grades before proceeding.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPromoteDialogOpen(false)}>Cancel</Button>
                        <Button
                            className="bg-primary-600"
                            onClick={handlePromote}
                            disabled={promoteStudents.isPending}
                        >
                            {promoteStudents.isPending ? 'Processing...' : 'Confirm & Promote'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
