import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, FileText, User, ChevronRight, Loader2 } from 'lucide-react'
import { usePeople } from '@/hooks/usePeople'

// Navigation items to search through
const NAV_ITEMS = [
    { title: 'Dashboard', path: '/', description: 'Overview and quick actions' },
    { title: 'Educare Overview', path: '/educare', description: 'Student management dashboard' },
    { title: 'Student List', path: '/educare/students', description: 'View and manage students' },
    { title: 'Mark Attendance (Educare)', path: '/educare/attendance', description: 'Daily tuition attendance' },
    { title: 'Legacy Overview', path: '/legacy', description: 'Women\'s empowerment program' },
    { title: 'Participant List', path: '/legacy/participants', description: 'View and manage women' },
    { title: 'Mark Attendance (Legacy)', path: '/legacy/attendance', description: 'Session attendance' },
    { title: 'Clinicare Services', path: '/clinicare', description: 'Medical services overview' },
    { title: 'Medical Visits', path: '/clinicare/visits', description: 'Record and view visits' },
    { title: 'Food Distribution', path: '/food', description: 'Hamper distribution management' },
    { title: 'Distributions', path: '/food/distributions', description: 'View distribution events' },
]

export function GlobalSearchDialog({ open, onOpenChange }) {
    const navigate = useNavigate()
    const [searchQuery, setSearchQuery] = useState('')
    const [debouncedQuery, setDebouncedQuery] = useState('')

    // Debounce effect
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300)
        return () => clearTimeout(timer)
    }, [searchQuery])

    // Search people
    const { data: people, isLoading } = usePeople(debouncedQuery)

    // Filter pages
    const filteredPages = NAV_ITEMS.filter(item =>
        item.title.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(debouncedQuery.toLowerCase())
    )

    const handleSelect = (path) => {
        navigate(path)
        onOpenChange(false)
        setSearchQuery('')
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-4 border-b border-neutral-100 pb-4">
                    <DialogTitle className="sr-only">Global Search</DialogTitle>
                    <DialogDescription className="sr-only">
                        Search for pages, people, or records in the dashboard.
                    </DialogDescription>
                    <div className="flex items-center gap-3">
                        <Search className="w-5 h-5 text-neutral-400" />
                        <input
                            className="flex-1 text-lg outline-none bg-transparent placeholder:text-neutral-400"
                            placeholder="Search pages, people, or records..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus
                        />
                        {isLoading && <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />}
                    </div>
                </DialogHeader>

                <div className="max-h-[60vh] overflow-y-auto p-2">
                    {/* Empty State */}
                    {!searchQuery && (
                        <div className="p-8 text-center text-neutral-500 text-sm">
                            <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>Type to search across HOHA Dashboard</p>
                        </div>
                    )}

                    {searchQuery && (
                        <div className="space-y-4">
                            {/* Pages Section */}
                            {filteredPages.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider px-3 mb-2 mt-2">
                                        Pages
                                    </h4>
                                    <div className="space-y-1">
                                        {filteredPages.map((page) => (
                                            <button
                                                key={page.path}
                                                onClick={() => handleSelect(page.path)}
                                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-100 transition-colors group text-left"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center group-hover:bg-white border border-transparent group-hover:border-neutral-200 transaction-all">
                                                    <FileText className="w-4 h-4 text-neutral-500" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-medium text-neutral-900">{page.title}</div>
                                                    <div className="text-xs text-neutral-500">{page.description}</div>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-neutral-500" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* People Section */}
                            {people && people.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider px-3 mb-2 mt-4">
                                        People
                                    </h4>
                                    <div className="space-y-1">
                                        {people.map((person) => (
                                            <button
                                                key={person.id}
                                                onClick={() => handleSelect(`/clinicare/patients/${person.id}`)}
                                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-100 transition-colors group text-left"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center border border-primary-100 group-hover:border-primary-200">
                                                    {person.photo_url ? (
                                                        <img src={person.photo_url} alt="" className="w-full h-full rounded-full object-cover" />
                                                    ) : (
                                                        <span className="text-xs font-semibold text-primary-700">
                                                            {person.first_name?.[0]}{person.last_name?.[0]}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-medium text-neutral-900">
                                                        {person.first_name} {person.last_name}
                                                    </div>
                                                    <div className="text-xs text-neutral-500 flex gap-2">
                                                        <span>{person.gender}</span>
                                                        <span>•</span>
                                                        <span>{person.phone_number || 'No phone'}</span>
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-neutral-500" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* No Results */}
                            {filteredPages.length === 0 && (!people || people.length === 0) && !isLoading && (
                                <div className="p-8 text-center text-neutral-500 text-sm">
                                    <p>No results found for "{searchQuery}"</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="bg-neutral-50 p-2 text-center text-xs text-neutral-400 border-t border-neutral-100">
                    Press <kbd className="font-sans px-1 py-0.5 bg-white border border-neutral-200 rounded text-neutral-500 mx-1">Esc</kbd> to close
                </div>
            </DialogContent>
        </Dialog>
    )
}
