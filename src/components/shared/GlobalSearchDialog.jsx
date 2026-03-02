import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Search, FileText, ChevronRight, Loader2, GraduationCap, Leaf, HeartPulse, User, Clock, X } from 'lucide-react'
import { usePeople } from '@/hooks/usePeople'
import { useStudents } from '@/hooks/useStudents'
import { useWomen } from '@/hooks/useWomen'

const ICON_BY_TYPE = {
    page: FileText,
    student: GraduationCap,
    woman: Leaf,
    patient: HeartPulse,
}

const NAV_ITEMS = [
    { title: 'Dashboard', path: '/', description: 'Overview and quick actions', icon: FileText },
    { title: 'Educare Overview', path: '/educare', description: 'Student management dashboard', icon: GraduationCap },
    { title: 'Student List', path: '/educare/students', description: 'View and manage students', icon: GraduationCap },
    { title: 'Mark Attendance (Educare)', path: '/educare/attendance', description: 'Daily tuition attendance', icon: GraduationCap },
    { title: 'Legacy Overview', path: '/legacy', description: "Women's empowerment program", icon: Leaf },
    { title: 'Participant List', path: '/legacy/participants', description: 'View and manage women', icon: Leaf },
    { title: 'Mark Attendance (Legacy)', path: '/legacy/attendance', description: 'Session attendance', icon: Leaf },
    { title: 'Clinicare Services', path: '/clinicare', description: 'Medical services overview', icon: HeartPulse },
    { title: 'Medical Visits', path: '/clinicare/visits', description: 'Record and view visits', icon: HeartPulse },
    { title: 'Food Distribution', path: '/food', description: 'Hamper distribution management', icon: HeartPulse },
    { title: 'Distributions', path: '/food/distributions', description: 'View distribution events', icon: HeartPulse },
]

export function GlobalSearchDialog({ open, onOpenChange }) {
    const navigate = useNavigate()
    const [searchQuery, setSearchQuery] = useState('')
    const [debouncedQuery, setDebouncedQuery] = useState('')
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [recentSearches, setRecentSearches] = useState([])
    const scrollRef = useRef(null)

    useEffect(() => {
        const saved = localStorage.getItem('hoha_recent_searches')
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                // Icons are functions and cannot survive JSON serialisation — resolve from type
                setRecentSearches(parsed.map(item => ({
                    ...item,
                    icon: ICON_BY_TYPE[item.type] || Clock,
                })))
            } catch (e) {
                // Ignore parse errors
            }
        }
    }, [])

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300)
        return () => clearTimeout(timer)
    }, [searchQuery])

    useEffect(() => {
        setSelectedIndex(0) // Reset selection when query changes
    }, [debouncedQuery])

    const { data: people, isLoading: loadingPeople } = usePeople(debouncedQuery)
    const { data: students, isLoading: loadingStudents } = useStudents({ search: debouncedQuery })
    const { data: women, isLoading: loadingWomen } = useWomen({ search: debouncedQuery })

    const isLoading = loadingPeople || loadingStudents || loadingWomen

    let results = []

    if (!debouncedQuery) {
        // Show recent searches if no query
        results = recentSearches.map(item => ({ ...item, isRecent: true }))
    } else {
        const filteredPages = NAV_ITEMS.filter(item =>
            item.title.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(debouncedQuery.toLowerCase())
        ).map(page => ({
            id: `page-${page.path}`,
            type: 'page',
            title: page.title,
            subtitle: page.description,
            icon: page.icon,
            path: page.path
        }))

        const studentList = (students || []).map(student => ({
            id: `student-${student.person_id}`,
            type: 'student',
            title: `${student.first_name} ${student.last_name}`,
            subtitle: `${student.grade_level || 'Unknown Grade'} • ${student.government_school || 'On Site'}`,
            icon: GraduationCap,
            path: `/educare/students/${student.person_id}`
        }))

        const womenList = (women || []).map(woman => ({
            id: `woman-${woman.woman_id}`,
            type: 'woman',
            title: `${woman.woman?.first_name} ${woman.woman?.last_name}`,
            subtitle: `Stage ${woman.stage || 'Unknown'} • Legacy`,
            icon: Leaf,
            path: `/legacy/participants/${woman.woman_id}`
        }))

        // Patients are anyone not explicitly found above, to avoid duplication
        const studentIds = new Set(studentList.map(s => s.id.replace('student-', '')))
        const womenIds = new Set(womenList.map(w => w.id.replace('woman-', '')))

        const patientList = (people || [])
            .filter(person => !studentIds.has(person.id) && !womenIds.has(person.id))
            .map(person => ({
                id: `patient-${person.id}`,
                type: 'patient',
                title: `${person.first_name} ${person.last_name}`,
                subtitle: `${person.phone_number || 'No phone'} • ClinicaCare`,
                icon: HeartPulse,
                path: `/clinicare/patients/${person.id}`
            }))

        results = [
            ...(filteredPages.length > 0 ? [{ isHeader: true, title: 'Pages' }, ...filteredPages] : []),
            ...(studentList.length > 0 ? [{ isHeader: true, title: 'Educare Students' }, ...studentList] : []),
            ...(womenList.length > 0 ? [{ isHeader: true, title: 'Legacy Women' }, ...womenList] : []),
            ...(patientList.length > 0 ? [{ isHeader: true, title: 'Patients (ClinicaCare)' }, ...patientList] : []),
        ]
    }

    const selectableItems = results.filter(r => !r.isHeader)

    const handleSelect = (item) => {
        if (!item) return

        if (!item.isRecent) {
            const newRecent = [item, ...recentSearches.filter(r => r.id !== item.id)].slice(0, 5)
            setRecentSearches(newRecent)
            // Strip icon (a function) before serialising — it's resolved from type on load
            const serialisable = newRecent.map(({ icon: _, ...rest }) => rest)
            localStorage.setItem('hoha_recent_searches', JSON.stringify(serialisable))
        }

        navigate(item.path)
        onOpenChange(false)
        setSearchQuery('')
    }

    const removeRecent = (e, id) => {
        e.stopPropagation()
        const newRecent = recentSearches.filter(r => r.id !== id)
        setRecentSearches(newRecent)
        localStorage.setItem('hoha_recent_searches', JSON.stringify(newRecent))
    }

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!open) return
            if (e.key === 'ArrowDown') {
                e.preventDefault()
                setSelectedIndex(prev => (prev < selectableItems.length - 1 ? prev + 1 : prev))
            } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev))
            } else if (e.key === 'Enter' && selectableItems.length > 0) {
                e.preventDefault()
                handleSelect(selectableItems[selectedIndex])
            }
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [open, selectableItems, selectedIndex])

    // Auto-scroll to selected item
    useEffect(() => {
        if (scrollRef.current) {
            const selectedEl = scrollRef.current.querySelector('[data-selected="true"]')
            if (selectedEl) {
                selectedEl.scrollIntoView({ block: 'nearest' })
            }
        }
    }, [selectedIndex])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden bg-background/95 backdrop-blur-xl border-neutral-200 dark:border-neutral-800 shadow-2xl">
                <DialogTitle className="sr-only">Global Search</DialogTitle>
                <DialogDescription className="sr-only">Search across the dashboard</DialogDescription>

                <div className="flex items-center gap-3 p-4 border-b border-neutral-100 dark:border-neutral-800">
                    <Search className="w-5 h-5 text-neutral-400" />
                    <input
                        className="flex-1 text-lg outline-none bg-transparent placeholder:text-neutral-400 text-foreground"
                        placeholder="Search students, women, patients, or pages..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                    />
                    {isLoading && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
                </div>

                <div
                    ref={scrollRef}
                    className="max-h-[60vh] overflow-y-auto p-2"
                >
                    {!debouncedQuery && recentSearches.length > 0 && (
                        <div className="space-y-1">
                            <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider px-3 py-2">
                                Recent Searches
                            </h4>
                            {results.map((item, index) => {
                                const Icon = item.icon || Clock
                                const isSelected = index === selectedIndex
                                return (
                                    <button
                                        key={item.id}
                                        data-selected={isSelected}
                                        onClick={() => handleSelect(item)}
                                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors group text-left
                                            ${isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}
                                        `}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex flex-shrink-0 items-center justify-center border transition-all
                                            ${isSelected ? 'bg-background border-primary/20 text-primary' : 'bg-neutral-100 dark:bg-neutral-800 border-transparent text-neutral-500'}
                                        `}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium truncate text-foreground">{item.title}</div>
                                            <div className="text-xs text-neutral-500 truncate">{item.subtitle}</div>
                                        </div>
                                        <button
                                            onClick={(e) => removeRecent(e, item.id)}
                                            className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md transition-all text-neutral-400 hover:text-foreground"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </button>
                                )
                            })}
                        </div>
                    )}

                    {!debouncedQuery && recentSearches.length === 0 && (
                        <div className="p-12 text-center text-neutral-500 flex flex-col items-center justify-center">
                            <Search className="w-12 h-12 mb-4 opacity-20" />
                            <p className="text-sm font-medium text-foreground">What are you looking for?</p>
                            <p className="text-sm text-muted-foreground mt-1">Search across Educare, Legacy, and ClinicaCare</p>
                        </div>
                    )}

                    {debouncedQuery && selectableItems.length === 0 && !isLoading && (
                        <div className="p-12 text-center text-neutral-500">
                            <p className="text-sm">No results found for "{debouncedQuery}"</p>
                        </div>
                    )}

                    {debouncedQuery && results.length > 0 && (
                        <div className="space-y-1">
                            {results.map((item, i) => {
                                if (item.isHeader) {
                                    return (
                                        <h4 key={`header-${i}`} className="text-xs font-semibold text-neutral-500 uppercase tracking-wider px-3 pb-2 pt-4 first:pt-2">
                                            {item.title}
                                        </h4>
                                    )
                                }

                                const selectableIndex = selectableItems.indexOf(item)
                                const isSelected = selectableIndex === selectedIndex
                                const Icon = item.icon || User

                                return (
                                    <button
                                        key={item.id}
                                        data-selected={isSelected}
                                        onClick={() => handleSelect(item)}
                                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors group text-left
                                            ${isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}
                                        `}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex flex-shrink-0 items-center justify-center border transition-all
                                            ${isSelected ? 'bg-background border-primary/20 text-primary' : 'bg-neutral-100 dark:bg-neutral-800 border-transparent text-neutral-500 group-hover:bg-background group-hover:border-neutral-200 dark:group-hover:border-neutral-700'}
                                        `}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium truncate text-foreground">{item.title}</div>
                                            <div className="text-xs text-neutral-500 truncate">{item.subtitle}</div>
                                        </div>
                                        <ChevronRight className={`w-4 h-4 transition-colors ${isSelected ? 'text-primary' : 'text-neutral-300 group-hover:text-neutral-500 dark:text-neutral-600 dark:group-hover:text-neutral-400'}`} />
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-500">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5"><kbd className="font-sans px-1.5 py-0.5 bg-background border border-neutral-200 dark:border-neutral-700 rounded shadow-sm">↑</kbd> <kbd className="font-sans px-1.5 py-0.5 bg-background border border-neutral-200 dark:border-neutral-700 rounded shadow-sm">↓</kbd> to navigate</span>
                        <span className="flex items-center gap-1.5"><kbd className="font-sans px-1.5 py-0.5 bg-background border border-neutral-200 dark:border-neutral-700 rounded shadow-sm">Enter</kbd> to select</span>
                    </div>
                    <span className="flex items-center gap-1.5"><kbd className="font-sans px-1.5 py-0.5 bg-background border border-neutral-200 dark:border-neutral-700 rounded shadow-sm">Esc</kbd> to close</span>
                </div>
            </DialogContent>
        </Dialog>
    )
}

