"use client"

import {
    useCallback,
    useEffect,
    useState,
} from "react"
import {
    useProfileUsername,
} from "./useProfileUsername"
import { useMutateSetFollowSwr } from "@/hooks/swr/api/graphql/mutations/useMutateSetFollowSwr"
import { useQueryUserProfileSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserProfileSwr"

/** Shape returned by {@link useProfileFollow}. */
export interface UseProfileFollowResult {
    /** Local mirror of whether the viewer follows the target (instant toggles). */
    following: boolean
    /** Local mirror of the target's follower count (nudged on toggle). */
    followerCount: number
    /** True while the follow mutation is in flight. */
    isPending: boolean
    /** Run the follow toggle, then flip the flag + nudge the counter on success. */
    onToggle: () => Promise<void>
}

/**
 * Owns the follow state for a public profile: a local mirror of the follow flag
 * and follower count seeded from the fetched user, plus the optimistic toggle.
 * The mirrors make the action feel instant — the flag flips and the counter is
 * nudged by ±1 only once the server confirms the edge.
 *
 * Self-contained: resolves the target user from the route and reads the profile
 * via SWR (deduped with the rest of the page), so it takes no props. The follow
 * edge keys off the target entity id (`user.id`); the toggle bails until the
 * profile has resolved.
 *
 * @returns {@link UseProfileFollowResult}
 */
export const useProfileFollow = (): UseProfileFollowResult => {
    // target username: the `/profile/[username]` segment, or — on the bare
    // `/profile` — the signed-in user's own username (one layout for self + others)
    const username = useProfileUsername()
    const { data: user } = useQueryUserProfileSwr(username)
    // entity id resolved from the fetched user — what the follow edge keys off
    const targetUserId = user?.id ?? null

    // local mirror of the follow state + count so toggles feel instant
    const [following, setFollowing] = useState(false)
    const [followerCount, setFollowerCount] = useState(0)
    // owns the follow mutation; FollowButton is presentational
    const { trigger: triggerSetFollow } = useMutateSetFollowSwr()
    const [isPending, setPending] = useState(false)

    // seed the local mirror whenever the fetched profile changes
    useEffect(() => {
        if (user) {
            setFollowing(Boolean(user.isFollowedByMe))
            setFollowerCount(user.followerCount ?? 0)
        }
    }, [
        user,
    ])

    /** Run the follow toggle, then flip the flag + nudge the counter on success. */
    const onToggle = useCallback(
        async () => {
            // follow edges key off the entity id; bail until the profile resolved
            if (!targetUserId) {
                return
            }
            // optimistic target = the opposite of the current state
            const next = !following
            setPending(true)
            try {
                const result = await triggerSetFollow({
                    userId: targetUserId,
                    follow: next,
                })
                // only commit when the server confirms
                if (result?.data?.setFollow?.success) {
                    setFollowing(next)
                    setFollowerCount((current) => current + (next ? 1 : -1))
                }
            } finally {
                setPending(false)
            }
        },
        [
            following,
            targetUserId,
            triggerSetFollow,
        ],
    )

    return {
        following,
        followerCount,
        isPending,
        onToggle,
    }
}
