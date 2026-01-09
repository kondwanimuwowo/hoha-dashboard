import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PersonAvatar } from '@/components/shared/PersonAvatar'
import { User, Bell, Shield, Palette, Smartphone, Mail, School, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/components/shared/ThemeProvider'
import { useState } from 'react'
import { usePromoteStudents } from '@/hooks/useStudents'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'

export function Settings() {
    const { user } = useAuth()
    const { theme, setTheme } = useTheme()
    const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false)
    const promoteStudents = usePromoteStudents()

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

    return (
        <div className="space-y-6">
            <PageHeader
                title="Settings"
                description="Manage your account preferences and application settings"
            />

            <div className="grid gap-6 md:grid-cols-2">
                {/* Profile Settings */}
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
                                photoUrl={user?.user_metadata?.avatar_url}
                                firstName={user?.email}
                                lastName=""
                                className="w-20 h-20 border-4 border-neutral-100"
                            />
                            <div className="space-y-1">
                                <h3 className="font-medium text-lg text-neutral-900">Administrator</h3>
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
                                    <Input id="role" value="Super Admin" disabled className="pl-9" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Appearance */}
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
                                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Compact Mode</Label>
                                <p className="text-sm text-neutral-500">
                                    Reduce spacing in lists and tables
                                </p>
                            </div>
                            <Switch disabled />
                        </div>
                    </CardContent>
                </Card>

                {/* Academic Year Management */}
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

                {/* Notifications */}
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
                            <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Push Notifications</Label>
                                <p className="text-sm text-neutral-500">
                                    Receive alerts on your device
                                </p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">System Updates</Label>
                                <p className="text-sm text-neutral-500">
                                    Get notified about platform changes
                                </p>
                            </div>
                            <Switch />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Promote Dialog */}
            <Dialog open={isPromoteDialogOpen} onOpenChange={setIsPromoteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Confirm Grade Progression
                        </DialogTitle>
                        <CardDescription className="pt-2 text-foreground">
                            You are about to move <strong>all active students</strong> to their next grade levels for the new academic year.
                        </CardDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <ul className="text-sm space-y-2 text-muted-foreground list-disc pl-4">
                            <li>Early Childhood → Preparatory</li>
                            <li>Grade 1-11 → Next Grade</li>
                            <li>Grade 12 → Graduated</li>
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
