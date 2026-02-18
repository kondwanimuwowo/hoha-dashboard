import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const FILTER_OPTIONS = [
    { value: 'all', label: 'All Members' },
    { value: 'registered', label: 'HOHA Registered Members' },
    { value: 'non-registered', label: 'HOHA Non-Registered Members' },
]

export function RegistrationFilter({ value, onChange }) {
    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="w-full md:w-[250px]">
                <SelectValue placeholder="Filter by member type" />
            </SelectTrigger>
            <SelectContent>
                {FILTER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
