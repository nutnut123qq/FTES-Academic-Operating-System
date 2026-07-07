"use client"

import { useAppSelector } from "@/redux/hooks"

/** The viewer's identity shown in the dashboard identity anchor. */
export interface OverviewIdentity {
    username: string
    /** Display name shown next to the avatar. */
    name: string
    /** Uploaded avatar URL (null → generated fallback via UserAvatar). */
    avatar: string | null
}

/**
 * Reads the dashboard identity anchor straight from the resolved viewer in the
 * Redux `user` slice (populated by the app-shell `me` query) — no extra round-trip.
 * Returns `undefined` until the viewer resolves so the widget keeps its skeleton.
 */
export const useQueryOverviewIdentitySwr = () => {
    const user = useAppSelector((state) => state.user.user)
    const data: OverviewIdentity | undefined = user
        ? {
              username: user.username,
              name: user.displayName?.trim() || user.username,
              avatar: user.avatar ?? null,
          }
        : undefined
    return { data, isLoading: !user, error: undefined, mutate: () => {} }
}
