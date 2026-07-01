/**
 * Derives a display filename from an HTTP(S) or blob URL path segment.
 */
export const getFileNameFromUrl = (url: string) => {
    /**
     * Try to derive the filename from the URL.
     */
    try {
        const pathname = new URL(url).pathname
        const lastPart = pathname.split("/").filter(Boolean).at(-1)
        return lastPart ? decodeURIComponent(lastPart) : url
    } catch {
        /**
         * If the URL is not a valid URL, try to derive the filename from the URL string.
         */
        const lastPart = url.split("/").filter(Boolean).at(-1)
        return lastPart ? decodeURIComponent(lastPart) : url
    }
}