"use client"

import { useCallback, useState } from "react"
import { useSWRConfig } from "swr"
import { useTranslations } from "next-intl"
import { toast } from "@heroui/react"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { followUser, unfollowUser } from "@/modules/api/rest/community"
import { RestError } from "@/modules/api/rest/client"
import type { UserHovercardData } from "@/modules/types/user-hovercard"
import { userHovercardKey } from "@/hooks/swr/api/graphql/queries/useQueryUserHovercardSwr"
import {
    isPublicProfileKeyFor,
    type PublicProfile,
} from "@/components/features/profile/hooks/useQueryPublicProfileSwr"
import { isFollowedUserIdsKeyFor } from "./useQueryFollowedUserIdsSwr"

/**
 * Maps a failed follow write to the i18n key of the message shown to the user.
 * 401 (session gone) and 429 (too many follows) get their own copy; 403/404 mean
 * the target is not followable (moderated / deleted / privacy-restricted).
 *
 * @param error - the rejection thrown by the REST client.
 */
export const followErrorMessageKey = (error: unknown): string => {
    const status = error instanceof RestError ? error.status : 0
    if (status === 401) {
        return "hovercard.followSessionExpired"
    }
    if (status === 403) {
        return "hovercard.followForbidden"
    }
    if (status === 404) {
        return "hovercard.followNotFound"
    }
    if (status === 429) {
        return "hovercard.followRateLimited"
    }
    return "hovercard.followFailed"
}

/** Applies the follow toggle to a hovercard payload (counter clamped at 0). */
const applyFollow = (
    current: UserHovercardData,
    nextFollow: boolean,
): UserHovercardData => ({
    ...current,
    isFollowedByMe: nextFollow,
    followerCount: Math.max(0, (current.followerCount ?? 0) + (nextFollow ? 1 : -1)),
})

/** Adds/removes `userId` in one batch follow-state lot (see {@link isFollowedUserIdsKeyFor}). */
const applyBatchFollow = (
    current: Array<string> | undefined,
    userId: string,
    nextFollow: boolean,
): Array<string> => {
    const ids = current ?? []
    if (!nextFollow) {
        return ids.filter((id) => id !== userId)
    }
    return ids.includes(userId) ? ids : [...ids, userId]
}

/**
 * Toggles the viewer's follow on another user through the REAL community REST API
 * (`PUT` / `DELETE /api/v1/community/follows/{userId}`, both idempotent), with an
 * optimistic write into the hovercard cache keyed by USERNAME
 * ({@link userHovercardKey}) so every `<UserLink>` for that user flips at once, plus
 * the same flip into every BATCH follow-state lot that covers the user
 * ({@link isFollowedUserIdsKeyFor}) and into the public-profile lot
 * ({@link isPublicProfileKeyFor}) so list rows and `/u/{username}` agree with the card.
 *
 * Guests never reach the network: {@link useRequireAuth} opens the
 * `AuthenticationModal` with the `auth.context.follow` message and the toggle
 * aborts. Any failure — transport reject or a non-2xx envelope (`RestError`) —
 * restores the exact pre-toggle snapshot and surfaces a status-specific toast.
 *
 * @returns `toggleFollow(target)` and the in-flight `isPending` flag.
 */
export const useMutateFollowUserSwr = () => {
    const t = useTranslations()
    const { mutate } = useSWRConfig()
    const { requireAuth } = useRequireAuth()
    const [isPending, setIsPending] = useState(false)

    const toggleFollow = useCallback(
        async (target: UserHovercardData) => {
            if (!requireAuth("auth.context.follow")) {
                return
            }
            if (!target.id || !target.username) {
                return
            }

            const nextFollow = !target.isFollowedByMe
            const key = userHovercardKey(target.username)
            const userId = target.id
            const username = target.username
            let snapshot: UserHovercardData | undefined

            // Every batch lot that ASKED about this user (a feed / member list read
            // `GET /community/follows/me` in chunks) has to flip too — otherwise the
            // hovercard says "Đang theo dõi" while the rows keep the old label for the
            // whole `dedupingInterval`.
            const patchBatches = (follow: boolean) =>
                mutate<Array<string>>(
                    (cacheKey) => isFollowedUserIdsKeyFor(cacheKey, userId),
                    (current) => applyBatchFollow(current, userId, follow),
                    { revalidate: false },
                )

            // The public profile (`/u/{username}`) reads its own flag out of a THIRD lot
            // (`["public-profile", …]`, one entry per locale), so its button has to flip in
            // the same breath — otherwise following from the hovercard and then opening the
            // profile still says "Theo dõi" until the next revalidate.
            // Only the FLAG moves: the hero's follower count is `profile.follows` while this
            // write lands in `community.follows`, so a bumped number would be pulled back.
            const patchPublicProfile = (follow: boolean) =>
                mutate<PublicProfile>(
                    (cacheKey) => isPublicProfileKeyFor(cacheKey, username),
                    (current) => (current ? { ...current, isFollowedByMe: follow } : current),
                    { revalidate: false },
                )

            setIsPending(true)
            await mutate<UserHovercardData>(
                key,
                (current) => {
                    snapshot = current
                    return applyFollow(current ?? target, nextFollow)
                },
                { revalidate: false },
            )
            await patchBatches(nextFollow)
            await patchPublicProfile(nextFollow)

            try {
                if (nextFollow) {
                    await followUser(target.id)
                } else {
                    await unfollowUser(target.id)
                }
            } catch (error) {
                // Only a failed WRITE rolls back — restore the pre-toggle snapshot.
                await mutate<UserHovercardData>(key, snapshot, { revalidate: false })
                await patchBatches(!nextFollow)
                await patchPublicProfile(!nextFollow)
                toast.danger(t(followErrorMessageKey(error)))
            } finally {
                setIsPending(false)
            }
        },
        [mutate, requireAuth, t],
    )

    return { toggleFollow, isPending }
}
