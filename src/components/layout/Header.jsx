import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Menu, Bell, Search, LogOut, User as UserIcon } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { PersonAvatar } from '@/components/shared/PersonAvatar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/shared/ModeToggle'
import { GlobalSearchDialog } from '@/components/shared/GlobalSearchDialog'
import { NotificationsPopover } from '@/components/shared/NotificationsPopover'
import { useNotifications } from '@/hooks/useNotifications'

export function Header({ onMenuClick }) {
    const { unreadCount } = useNotifications()
    const { user, profile, signOut } = useAuth()
    const [showSearch, setShowSearch] = useState(false)

    useEffect(() => {
        const down = (e) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setShowSearch((open) => !open)
            }
        }
        document.addEventListener('keydown', down)
        return () => document.removeEventListener('keydown', down)
    }, [])

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-neutral-200 dark:border-border bg-card px-6 shadow-sm no-print">
            <div className="flex items-center space-x-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onMenuClick}
                    className="lg:hidden"
                    aria-label="Toggle menu"
                >
                    <Menu className="h-5 w-5" />
                </Button>

                <div className="hidden md:flex items-center">
                    <button
                        onClick={() => setShowSearch(true)}
                        className="group relative w-64 h-9 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-900/50 px-4 text-sm flex items-center text-neutral-500 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-white dark:hover:bg-neutral-900 transition-all shadow-sm hover:shadow-md"
                    >
                        <Search className="h-4 w-4 mr-2" />
                        <span className="flex-1 text-left">Search...</span>
                        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-1.5 font-sans text-[10px] font-medium text-neutral-500 dark:text-neutral-400 opacity-100 sm:flex group-hover:bg-white dark:group-hover:bg-neutral-900 transition-colors">
                            <span className="text-xs">⌘</span>K
                        </kbd>
                    </button>
                    <GlobalSearchDialog open={showSearch} onOpenChange={setShowSearch} />
                </div>
            </div>

            <div className="flex items-center space-x-3">
                <ModeToggle />

                <NotificationsPopover>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="relative"
                        aria-label="Notifications"
                    >
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
                        )}
                    </Button>
                </NotificationsPopover>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center space-x-3 rounded-lg px-3 py-2 hover:bg-neutral-100 dark:hover:bg-accent transition-colors">
                            <PersonAvatar
                                photoUrl={profile?.avatar_url}
                                firstName={profile?.full_name || user?.email}
                                lastName=""
                                className="h-8 w-8"
                            />
                            <div className="hidden md:block text-left">
                                <p className="text-sm font-medium text-neutral-900 dark:text-foreground">
                                    {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                                </p>
                                <p className="text-xs text-neutral-500 dark:text-muted-foreground">
                                    {profile?.role || 'User'}
                                </p>
                            </div>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium">My Account</p>
                                <p className="text-xs text-neutral-500 dark:text-muted-foreground">{user?.email}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link to="/settings" className="cursor-pointer">
                                <UserIcon className="mr-2 h-4 w-4" />
                                <span>Profile</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link to="/settings" className="cursor-pointer">
                                <Bell className="mr-2 h-4 w-4" />
                                <span>Notifications</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={signOut}
                            className="text-red-600 focus:text-red-600"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Sign out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
