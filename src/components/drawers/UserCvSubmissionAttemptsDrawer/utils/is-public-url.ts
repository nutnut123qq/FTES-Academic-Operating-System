/**
 * Whether a URL can be opened directly in a new tab (http/https/blob/data).
 *
 * @param value - The URL to test.
 * @returns True when the URL uses a directly-openable scheme.
 */
export const isPublicUrl = (value: string): boolean =>
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("blob:") ||
    value.startsWith("data:")
