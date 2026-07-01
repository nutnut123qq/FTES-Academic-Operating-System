/**
 * Build a deterministic DiceBear "thumbs" avatar URL from a seed. Same seed →
 * same avatar, so a user without an uploaded photo still gets a stable, unique
 * default (seeded by their email/username).
 *
 * @param seed - stable identity string (email preferred, else username/name)
 * @returns the DiceBear SVG avatar URL
 */
export const dicebearAvatarUrl = (seed: string): string =>
    `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(seed || "anonymous")}`

/**
 * Resolve a user's avatar: their uploaded one when present, otherwise a
 * deterministic DiceBear default seeded by `seed`.
 *
 * @param avatar - the user's uploaded avatar URL (may be null/empty)
 * @param seed - stable identity string used as the default seed
 * @returns a usable avatar URL (never empty)
 */
export const resolveUserAvatarUrl = (
    avatar: string | null | undefined,
    seed: string,
): string => {
    const trimmed = avatar?.trim()
    return trimmed || dicebearAvatarUrl(seed)
}
