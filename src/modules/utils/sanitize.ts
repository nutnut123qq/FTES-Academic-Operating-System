export const sanitizeNumericInput = (input: string): string | null => {
    const regex = new RegExp(/^\d*[.,]?\d*$/)
    if (!regex.test(input)) {
        return null
    }
    const sanitizedValue = input.replace(/,/g, ".")
    return sanitizedValue
}