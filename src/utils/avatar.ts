/**
 * A bare uuid — a BE id that leaked into a NAME slot because the payload carried no
 * profile card. It is never a person's name, so the shared avatar must not turn it
 * into initials ("3f2a…" → "3F") and no surface may print it as a display name.
 */
const UUID_LIKE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Whether a "name" is really a raw user id. Several mappers degrade a missing profile
 * card to the author uuid (the owner gates compare against it), so the surfaces that
 * RENDER that value must swap in a generic member label instead of printing the id.
 *
 * @param value - the candidate display name.
 */
export const looksLikeUserId = (value: string | null | undefined): boolean =>
    UUID_LIKE.test((value ?? "").trim())

/**
 * Initials for the shared avatar fallback: first letter of the first + last word
 * ("Phan Hải" → "PH"), or the first two letters of a single word / handle
 * ("minhdev" → "MI").
 *
 * Returns `""` when there is nothing meaningful to show — empty input, or a raw uuid
 * (see {@link UUID_LIKE}). Callers render a neutral person glyph in that case, so an
 * id never surfaces as a name and the avatar stays a calm letter tile instead of a
 * generated face.
 *
 * @param name - display name or handle; may be null/empty/an id.
 * @returns 1–2 uppercase letters, or `""` when the input carries no name.
 */
export const avatarInitials = (name: string | null | undefined): string => {
    const trimmed = (name ?? "").trim()
    if (trimmed === "" || UUID_LIKE.test(trimmed)) {
        return ""
    }
    const words = trimmed.split(/\s+/)
    const letters =
        words.length > 1
            ? `${words[0].charAt(0)}${words[words.length - 1].charAt(0)}`
            : trimmed.slice(0, 2)
    return letters.toUpperCase()
}
