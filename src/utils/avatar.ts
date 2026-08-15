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
 * Deterministic generated-avatar URL (DiceBear "thumbs") for a user with no uploaded
 * photo. The same seed always yields the same face, so one person keeps ONE identity
 * across the feed, the leaderboard and their profile.
 *
 * Returns `null` when there is no seed to hash — the caller must then fall back to the
 * initials tile rather than invent a face for "" (every seedless user would otherwise
 * share the exact same generated face and read as the same person).
 *
 * @param seed - a stable identity string: username preferred, else the user id.
 * @returns the DiceBear SVG url, or `null` when `seed` is empty/whitespace.
 */
export const dicebearAvatarUrl = (seed: string | null | undefined): string | null => {
    const trimmed = (seed ?? "").trim()
    if (trimmed === "") {
        return null
    }
    return `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(trimmed)}`
}

/**
 * The image URL the shared avatar should try, in order: the user's UPLOADED photo when
 * present, otherwise a seeded generated face, otherwise nothing (initials tile).
 *
 * The uploaded photo always wins — a generated face must never be preferred over a real
 * one, because that is how a mapper dropping `avatarUrl` stays invisible (see the
 * warning on {@link import("@/components/reuseable/UserAvatar").UserAvatar}).
 *
 * @param avatar - the uploaded avatar URL; may be null/empty.
 * @param seed - stable identity string for the generated default.
 * @returns a url to render, or `null` when neither source can produce one.
 */
export const resolveAvatarSrc = (
    avatar: string | null | undefined,
    seed: string | null | undefined,
): string | null => (avatar ?? "").trim() || dicebearAvatarUrl(seed)

/**
 * Initials for the shared avatar fallback: first letter of the first + last word
 * ("Phan Hải" → "PH"), or the first two letters of a single word / handle
 * ("minhdev" → "MI").
 *
 * Returns `""` when there is nothing meaningful to show — empty input, or a raw uuid
 * (see {@link UUID_LIKE}), so an id never surfaces as a name ("3f2a…" → "3F"). Callers
 * render the last-resort person glyph in that case. A uuid is still fine as a
 * {@link dicebearAvatarUrl} SEED (nothing of it is displayed) — it just must not be
 * shown as letters.
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
