"use client"

import React from "react"
import {
    Link,
    cn,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import type {
    FollowListTab,
} from "@/hooks/zustand/overlay/store"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import {
    useProfileUsername,
} from "../../hooks/useProfileUsername"
import { useFollowListOverlayState } from "@/hooks/zustand/overlay/hooks"
import { useQueryUserProfileSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserProfileSwr"

/** Props for {@link ProfileFollowers}. */
export type ProfileFollowersProps = WithClassNames<undefined>

/**
 * Followers / following counts in the identity column — each a HeroUI
 * {@link Link} (text-with-action) that opens the global follow-list modal on its
 * tab. The avatar group is intentionally omitted (most followers have no real
 * avatar, so the placeholder faces add noise). Self-contained — reads the
 * username from the route and the counts from the deduped profile query.
 *
 * @param props - optional className (placement only).
 */
export const ProfileFollowers = ({ className }: ProfileFollowersProps) => {
    const t = useTranslations()
    const username = useProfileUsername()
    const { data: user } = useQueryUserProfileSwr(username)
    const { open } = useFollowListOverlayState()

    const followerCount = user?.followerCount ?? 0
    const followingCount = user?.followingCount ?? 0

    /** Open the follow-list modal on the given tab. */
    const openList = (tab: FollowListTab) => {
        if (username) {
            open({ username, tab })
        }
    }

    return (
        <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-2", className)}>
            <Link onPress={() => openList("followers")}>
                {followerCount} {t("profile.followers")}
            </Link>
            <Link onPress={() => openList("following")}>
                {followingCount} {t("profile.following")}
            </Link>
        </div>
    )
}
