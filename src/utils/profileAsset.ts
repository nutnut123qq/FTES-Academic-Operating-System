/**
 * Local gamification art is intentionally high-resolution, and several SVGs embed 1–2 MB PNGs.
 * Small identity surfaces must use the generated WebP derivative instead of downloading originals.
 */
export const profileAssetThumbnailUrl = (url: string | null | undefined): string | null => {
    const value = url?.trim()
    if (!value) {
        return null
    }
    const match = value.match(
        /^\/gamification\/(avatars|frames|achievements)\/([^/?#]+)\.(?:svg|png|jpe?g|webp)(?:[?#].*)?$/i,
    )
    if (!match) {
        return value
    }
    return `/gamification/profile-thumbnails/${match[1].toLowerCase()}-${match[2]}.webp`
}
