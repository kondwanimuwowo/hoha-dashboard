import { forwardRef } from 'react'
import { Input } from '@/components/ui/input'

// NRC Format: XXXXXX/XX/X
const NRCInput = forwardRef(({ value, onChange, ...props }, ref) => {
    const formatNRC = (input) => {
        // Remove all non-digit characters
        const digits = input.replace(/\D/g, '')

        // Apply format: XXXXXX/XX/X
        let formatted = ''
        if (digits.length > 0) {
            formatted = digits.substring(0, 6)
            if (digits.length > 6) {
                formatted += '/' + digits.substring(6, 8)
                if (digits.length > 8) {
                    formatted += '/' + digits.substring(8, 9)
                }
            }
        }

        return formatted
    }

    const handleChange = (e) => {
        const formatted = formatNRC(e.target.value)
        onChange?.(formatted)
    }

    return (
        <Input
            ref={ref}
            type="text"
            value={value || ''}
            onChange={handleChange}
            placeholder="XXXXXX/XX/X"
            maxLength={11} // 6 + 1 + 2 + 1 + 1
            {...props}
        />
    )
})

NRCInput.displayName = 'NRCInput'

export { NRCInput }
