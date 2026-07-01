"use client"

import React from "react"
import {
    Card,
    CardContent,
    cn,
    Typography,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import {
    Lock as LockIcon,
} from "@gravity-ui/icons"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import {
    useProfileUsername,
} from "../useProfileUsername"
import {
    useProfileFollow,
} from "../useProfileFollow"
import { EmptyState } from "@/components/blocks/feedback/EmptyState"
import { useAppSelector } from "@/redux/hooks"
import { useQueryUserProfileSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserProfileSwr"
import { FollowButton } from "@/components/reuseable/FollowButton"
import { UserAvatar } from "@/components/reuseable/UserAvatar"

/** Props for {@link ProfileLockedState}. */
export type ProfileLockedStateProps = WithClassNames<undefined>

/**
 * Locked-profile view: a slim public aside (avatar + name + @handle + a follow
 * action) beside a "this profile is private" notice. Shown when a locked profile
 * is viewed by anyone other than its owner; the tab content is withheld (also
 * enforced server-side, so the tabs would come back empty anyway).
 *
 * Self-fetches the target user from the route, the viewer's auth state, and the
 * follow state — the follow flag is seeded from the server then nudged locally on
 * toggle so the action feels instant.
 *
 * @param props - {@link ProfileLockedStateProps}
 */
export const ProfileLockedState = ({
    className,
}: ProfileLockedStateProps) => {
    const t = useTranslations()
    // target username: the `/profile/[username]` segment, or — on the bare
    // `/profile` — the signed-in user's own username (one layout for self + others)
    const username = useProfileUsername()
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const {
        data: user,
    } = useQueryUserProfileSwr(username)
    // follow state mirror + toggle (owns the setFollow mutation)
    const {
        following,
        isPending: isFollowPending,
        onToggle: onToggleFollow,
    } = useProfileFollow()

    // the index renders this only once `user` resolved; guard for type-safety
    if (!user) {
        return null
    }

    // prefer the chosen display name; fall back to the username as the title
    const hasDisplayName = Boolean(user.displayName?.trim())
    const title = hasDisplayName ? user.displayName : user.username

    return (
        <div className={cn("mx-auto flex max-w-6xl flex-col gap-8 px-6 py-6 md:flex-row md:items-start", className)}>
            <aside className="flex w-full flex-col gap-6 md:w-64 md:shrink-0">
                <Card>
                    <CardContent className="flex flex-col gap-3">
                        <UserAvatar
                            username={user.displayName ?? user.username}
                            avatar={user.avatar}
                            seed={user.username}
                            size="lg"
                            className="size-32"
                        />
                        <div className="flex flex-col gap-0">
                            <Typography type="h4" weight="semibold" truncate>
                                {title}
                            </Typography>
                            {hasDisplayName ? (
                                <Typography type="body-sm" color="muted" truncate>
                                    @{user.username}
                                </Typography>
                            ) : null}
                        </div>
                        {/* you can still follow a locked profile */}
                        {authenticated ? (
                            <FollowButton
                                following={following}
                                isPending={isFollowPending}
                                onToggle={onToggleFollow}
                                className="w-full"
                            />
                        ) : null}
                    </CardContent>
                </Card>
            </aside>
            <main className="flex min-w-0 flex-1">
                <Card className="w-full">
                    <CardContent>
                        <EmptyState
                            icon={<LockIcon aria-hidden focusable="false" />}
                            title={t("publicProfile.locked.title")}
                            description={t("publicProfile.locked.description")}
                        />
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
