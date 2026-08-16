import { useMemo } from "react"
import { useAppSelector } from "@/redux/hooks"

/**
 * The viewer's OWN identity, in the same shape a comment's author card arrives in from the
 * BE (`ChallengeViews.ChallengeAuthorView`: id + handle + name + photo).
 *
 * It exists so an optimistic comment can be signed by the person who just wrote it. Every
 * field is the one the server would resolve for that same account, so a row built from this
 * card and the row the POST answers with render identically.
 */
export interface ViewerAuthorCard {
    /** The viewer's user id (BE `users.id`) — always present when the card exists. */
    userId: string
    /** URL-facing handle, for the profile link + hovercard; `null` when the account has none. */
    username: string | null
    /** Preferred display name; `null` when the account never set one. */
    displayName: string | null
    /** Uploaded avatar URL; `null` → the shared avatar's generated tile, exactly as elsewhere. */
    avatarUrl: string | null
}

/**
 * The signed-in viewer as an author card, read from the session the app shell already
 * hydrated — `state.user.user`, written once per session by `useQueryUserSwr` from
 * `me` + `GET /profiles/me`. Reading it here costs NO request: the store is warm on every
 * authenticated surface (it is what the navbar renders from), and the comment threads that
 * consume this already select `state.user.user.id` out of the very same slice.
 *
 * WHY IT IS SAFE TO PAINT THIS ON AN UNSAVED COMMENT. The usual rule — do not invent server
 * facts client-side — is about an ARBITRARY author, whose card only the server can resolve.
 * Here the author IS the viewer: the server is going to echo back this exact person, from
 * the same profile row these fields were loaded from. There is no version of the response
 * that disagrees in a way a reader could notice, while the alternative (an anonymous row for
 * the length of a round-trip) is a regression everybody sees on every comment they write.
 *
 * DEGRADES TO `null` — never to a half-filled identity — when there is no viewer id yet
 * (guest, or the session has not hydrated), and also when the account has NEITHER a display
 * name NOR a username, because a card that cannot name anybody would only replace the
 * caller's own honest fallback with an emptier one. Callers must treat `null` as "keep doing
 * what you did before".
 *
 * @returns The viewer's author card, or `null` when it cannot be filled honestly.
 */
export const useViewerAuthorCard = (): ViewerAuthorCard | null => {
    const viewer = useAppSelector((state) => state.user.user)
    return useMemo(() => {
        const userId = viewer?.id
        if (!userId) {
            return null
        }
        const username = viewer?.username?.trim() || null
        const displayName = viewer?.displayName?.trim() || null
        if (!username && !displayName) {
            return null
        }
        return {
            userId,
            username,
            displayName,
            avatarUrl: viewer?.avatar?.trim() || null,
        }
    }, [viewer])
}

/**
 * The name to PRINT for a viewer author card, with the caller's own fallback for the
 * degraded case — `displayName` first, then the handle, exactly the order every BE-backed
 * mapper uses (`author?.displayName ?? author?.username ?? ""`), so the optimistic row and
 * the stored row resolve the same string.
 *
 * @param card - The viewer's card, or `null` when it could not be filled.
 * @param fallback - What to show instead (a localized "you", typically).
 * @returns The display name, or `fallback`.
 */
export const viewerAuthorName = (card: ViewerAuthorCard | null, fallback: string): string =>
    card?.displayName ?? card?.username ?? fallback

/**
 * The viewer's card when THIS row was written by them, `null` otherwise — the one rule the
 * threads whose BE contract ships NO author card (resource Q&A, FE album) use to name their
 * reader's own comments.
 *
 * It is deliberately keyed on `userId` alone, because that is the field an optimistic
 * placeholder and the stored row it becomes BOTH carry, and carry identically: apply this
 * at render time and the comment's identity is the same before and after the swap. A
 * tombstoned row is never "mine" — a deleted comment stops naming who wrote it, and its
 * `userId` is nulled server-side anyway.
 *
 * @param viewer - The reader's card, or `null` (guest / unhydrated session → no row is named).
 * @param rowUserId - The comment's `userId` as the BE sent it.
 * @param isDeleted - Whether the row is a tombstone.
 * @returns The viewer's card for their own live row, else `null`.
 */
export const viewerOwnRowCard = (
    viewer: ViewerAuthorCard | null,
    rowUserId: string | null | undefined,
    isDeleted: boolean,
): ViewerAuthorCard | null =>
    !isDeleted && viewer && rowUserId === viewer.userId ? viewer : null
