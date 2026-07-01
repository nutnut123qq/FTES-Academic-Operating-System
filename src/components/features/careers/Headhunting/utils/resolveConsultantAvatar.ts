/** Fallback avatar when `avatarUrl` is missing or fails to load. */
export const DEFAULT_CONSULTANT_AVATAR_URL =
    "https://starci.org/headhunters/default-avatar.jpg"

/**
 * Resolves consultant avatar URL with default fallback.
 * @param avatarUrl - Optional avatar URL from the API.
 * @returns The trimmed URL, or the default fallback when missing.
 */
export const resolveConsultantAvatarUrl = (
    avatarUrl?: string | null,
): string => {
    const trimmed = avatarUrl?.trim()
    return trimmed || DEFAULT_CONSULTANT_AVATAR_URL
}
