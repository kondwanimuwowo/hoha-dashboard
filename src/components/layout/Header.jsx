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

export function Header({ onMenuClick }) {
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
                        className="relative w-64 h-10 rounded-lg border border-neutral-200 dark:border-border bg-muted px-3 text-sm flex items-center text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
                    >
                        <Search className="h-4 w-4 mr-2" />
                        <span>Search...</span>
                        <kbd className="pointer-events-none absolute right-2 top-2 hidden h-6 select-none items-center rounded border bg-white px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 sm:flex">
                            Ctrl+K
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
                        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
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
