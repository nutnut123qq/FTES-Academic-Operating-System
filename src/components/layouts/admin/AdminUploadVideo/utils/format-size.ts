/**
 * Format a byte count into a human-readable size string.
 *
 * Picks the largest unit (B, KB, MB, GB) under which the value is < 1024 and
 * rounds to a sensible number of decimals per unit.
 * @param bytes - raw size in bytes
 * @returns formatted size string (e.g. "1.5 MB")
 */
export const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024)
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}
