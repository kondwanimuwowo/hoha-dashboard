import { useState } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog' // Added DialogDescription import
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Search, Filter, Edit, Shield, CheckCircle, XCircle, Plus, Loader2 } from 'lucide-react'
import { useUsers, useUpdateUser, useCreateUser } from '@/hooks/useUsers'
import { useAuth } from '@/hooks/useAuth'
import { formatDate } from '@/lib/utils'

const USER_ROLES = ['Admin', 'Program Manager', 'Data Entry', 'Read-Only']


export function UserManagement() {
    const { isAdmin, user: currentUser } = useAuth()
    const { data: users, isLoading } = useUsers()
    const updateUser = useUpdateUser()
    const createUser = useCreateUser()

    const [searchTerm, setSearchTerm] = useState('')
    const [roleFilter, setRoleFilter] = useState('All')
    const [editingUser, setEditingUser] = useState(null)
    const [selectedRole, setSelectedRole] = useState('')
    const [selectedStatus, setSelectedStatus] = useState(true)
    const [selectedName, setSelectedName] = useState('')

    // Create User State
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [newUserData, setNewUserData] = useState({
        email: '',
        password: '',
        fullName: '',
        role: 'Data Entry'
    })

    const handleCreateUser = async () => {
        try {
            await createUser.mutateAsync(newUserData)
            setIsCreateDialogOpen(false)
            setNewUserData({ email: '', password: '', fullName: '', role: 'Data Entry' })
        } catch (error) {
            console.error('Failed to create user', error)
            // Ideally show toast error here
        }
    }

    const handleDeactivate = async (user) => {
        if (!confirm('Are you sure you want to deactivate this user?')) return
        try {
            await updateUser.mutateAsync({
                id: user.id,
                updates: { is_active: false }
            })
        } catch (error) {
            console.error('Failed to deactivate user', error)
        }
    }

    if (!isAdmin) {
        return (
            <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
                <Shield className="h-16 w-16 text-muted-foreground/50" />
                <h2 className="text-2xl font-bold text-muted-foreground">Access Denied</h2>
                <p>You do not have permission to view this page.</p>
            </div>
        )
    }

    if (isLoading) return <LoadingSpinner />

    const filteredUsers = users?.filter(user => {
        const matchesSearch =
            user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesRole = roleFilter === 'All' || user.role === roleFilter

        return matchesSearch && matchesRole
    })

    const handleEditClick = (user) => {
        setEditingUser(user)
        setSelectedRole(user.role)
        setSelectedStatus(user.is_active)
        setSelectedName(user.full_name || '')
    }

    const handleSave = async () => {
        if (!editingUser) return

        try {
            await updateUser.mutateAsync({
                id: editingUser.id,
                id: editingUser.id,
                updates: {
                    role: selectedRole,
                    is_active: selectedStatus,
                    full_name: selectedName
                }
            })
            setEditingUser(null)
        } catch (error) {
            console.error('Failed to update user', error)
        }
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="User Management"
                description="Manage user access and roles"
            />

            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle>Registered Users</CardTitle>
                            <CardDescription>View and manage all system users</CardDescription>
                        </div>
                        <Button onClick={() => setIsCreateDialogOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add User
                        </Button>
                    </div>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between mt-4">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search users..."
                                className="pl-8 w-full sm:w-[250px]"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="w-full sm:w-[150px]">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="All Roles" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All Roles</SelectItem>
                                {USER_ROLES.map(role => (
                                    <SelectItem key={role} value={role}>{role}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            No users found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredUsers?.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarImage src={user.avatar_url} />
                                                        <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{user.full_name || 'N/A'}</span>
                                                        <span className="text-xs text-muted-foreground">{user.email}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{user.role}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                {user.is_active ? (
                                                    <div className="flex items-center text-green-600 text-sm">
                                                        <CheckCircle className="h-4 w-4 mr-1.5" />
                                                        Active
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center text-red-600 text-sm">
                                                        <XCircle className="h-4 w-4 mr-1.5" />
                                                        Inactive
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {formatDate(user.created_at)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEditClick(user)}
                                                    >
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Edit
                                                    </Button>
                                                    {user.is_active && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => handleDeactivate(user)}
                                                            disabled={currentUser?.id === user.id}
                                                            title={currentUser?.id === user.id ? "You cannot deactivate your own account" : "Deactivate User"}
                                                        >
                                                            <XCircle className="h-4 w-4 mr-2" />
                                                            Deactivate
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>Update user role and status</DialogDescription>
                    </DialogHeader>

                    {editingUser && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Full Name</Label>
                                <Input
                                    value={selectedName}
                                    onChange={(e) => setSelectedName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Role</Label>
                                <Select value={selectedRole} onValueChange={setSelectedRole}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {USER_ROLES.map(role => (
                                            <SelectItem key={role} value={role}>{role}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select
                                    value={selectedStatus ? 'active' : 'inactive'}
                                    onValueChange={(val) => setSelectedStatus(val === 'active')}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={updateUser.isPending}>
                            {updateUser.isPending && <LoadingSpinner className="mr-2 h-4 w-4" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New User</DialogTitle>
                        <DialogDescription>Create a new user account directly.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input
                                value={newUserData.fullName}
                                onChange={(e) => setNewUserData({ ...newUserData, fullName: e.target.value })}
                                placeholder="John Doe"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                                type="email"
                                value={newUserData.email}
                                onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                                placeholder="john@example.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Password</Label>
                            <Input
                                type="password"
                                value={newUserData.password}
                                onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                                placeholder="••••••••"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Role</Label>
                            <Select
                                value={newUserData.role}
                                onValueChange={(val) => setNewUserData({ ...newUserData, role: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {USER_ROLES.map(role => (
                                        <SelectItem key={role} value={role}>{role}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateUser} disabled={createUser.isPending}>
                            {createUser.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create User
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    )
}
