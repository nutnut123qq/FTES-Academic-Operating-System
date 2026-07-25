"use client"

import React, { useCallback, useMemo, useState } from "react"
import { Button, Skeleton, Spinner, Typography, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { useAppSelector } from "@/redux/hooks"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { useQueryUserHovercardSwr } from "@/hooks/swr/api/graphql/queries"
import { RestError } from "@/modules/api/rest/client"
import { UserAvatar } from "@/components/reuseable/UserAvatar"
import { UserHovercard } from "@/components/blocks/identity"
import { pathConfig } from "@/resources/path"
import { useMutateFollowUserSwr } from "./useMutateFollowUserSwr"

/**
 * Maps a failed hovercard load to its message key. A private profile (403) or a
 * deleted/unknown handle (404) is a terminal answer — retrying cannot help — so
 * the caller hides the retry button for those.
 *
 * @param error - the rejection thrown by the REST client.
 */
const hovercardErrorState = (error: unknown): { messageKey: string; retryable: boolean } => {
    const status = error instanceof RestError ? error.status : 0
    if (status === 403) {
        return { messageKey: "hovercard.private", retryable: false }
    }
    if (status === 404) {
        return { messageKey: "hovercard.notFound", retryable: false }
    }
    if (status === 429) {
        return { messageKey: "hovercard.rateLimited", retryable: true }
    }
    return { messageKey: "hovercard.error", retryable: true }
}

/** Props for {@link UserLink}. */
export interface UserLinkProps extends WithClassNames<{ avatar?: string; name?: string }> {
    /** URL-facing handle. Required for hovercard + profile link. */
    username?: string | null
    /** Preferred display name; falls back to username. */
    displayName?: string | null
    /** Uploaded avatar URL. */
    avatar?: string | null
    /** Seed for the generated default avatar fallback. */
    seed?: string | null
    /** HeroUI avatar size preset. */
    size?: "sm" | "md" | "lg"
    /** Whether to render the avatar before the name. */
    showAvatar?: boolean
    /** Whether to hide the name and render only the avatar. */
    hideName?: boolean
}

/**
 * Shared user identity link: avatar + display name, wrapped in a hovercard and
 * linking to the user's public profile. Data owner (SWR + Redux + i18n) that
 * delegates all presentation to {@link UserHovercard} and {@link UserAvatar}.
 *
 * The card is backed by the real public-profile REST read and the follow CTA by
 * the real community follow API (see {@link useMutateFollowUserSwr}). Because the
 * backend exposes no viewer-scoped "am I following this user" flag, the CTA
 * starts in its neutral "Follow" state and only shows "Following" once the viewer
 * toggles it here — the write is idempotent server-side, so a redundant follow is
 * harmless.
 *
 * @param props - {@link UserLinkProps}
 */
export const UserLink = ({
    username,
    displayName,
    avatar,
    seed,
    size = "sm",
    showAvatar = true,
    hideName = false,
    className,
    classNames,
}: UserLinkProps) => {
    const t = useTranslations()
    const currentUser = useAppSelector((state) => state.user.user)

    const [shouldFetch, setShouldFetch] = useState(false)
    const { data: profile, error, isLoading, mutate } = useQueryUserHovercardSwr(
        shouldFetch && username ? username : null,
    )
    const { toggleFollow, isPending: isFollowPending } = useMutateFollowUserSwr()

    const display = (displayName || username || "").trim()
    const href = username ? pathConfig().profile(username).build() : undefined
    const isOwnProfile =
        Boolean(username) &&
        (currentUser?.username === username || currentUser?.id === profile?.id)
    const isFollowing = profile?.isFollowedByMe === true
    const showFollowButton = Boolean(profile) && !isOwnProfile

    const handleOpenHovercard = useCallback(() => {
        if (!shouldFetch) {
            setShouldFetch(true)
        }
    }, [shouldFetch])

    // Guests get the AuthenticationModal instead of a 401; the optimistic write +
    // rollback lives in the mutation hook, keyed by username so all links sync.
    const handleFollowToggle = useCallback(() => {
        if (!profile) return
        void toggleFollow(profile)
    }, [profile, toggleFollow])

    const nameNode = useMemo(
        () => (
            <span
                className={cn(
                    "truncate text-sm font-semibold text-foreground transition-opacity hover:opacity-80",
                    classNames?.name,
                )}
            >
                {display || "—"}
            </span>
        ),
        [display, classNames?.name],
    )

    const identity = (
        <>
            {showAvatar ? (
                <UserAvatar
                    username={username}
                    avatar={avatar}
                    seed={seed ?? username}
                    size={size}
                    className={cn("shrink-0", size === "sm" && "size-8", classNames?.avatar)}
                />
            ) : null}
            {hideName ? null : nameNode}
        </>
    )

    const trigger = href ? (
        <Link
            href={href}
            className={cn(
                "inline-flex min-w-0 items-center gap-2 no-underline",
                className,
            )}
        >
            {identity}
        </Link>
    ) : (
        <span className={cn("inline-flex min-w-0 items-center gap-2", className)}>
            {identity}
        </span>
    )

    const errorState = hovercardErrorState(error)

    const hovercardContent = isLoading ? (
        <div className="flex flex-col gap-3 p-4">
            <div className="flex items-center gap-3">
                <Skeleton className="size-14 rounded-full" />
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-32 rounded" />
                    <Skeleton className="h-3 w-20 rounded" />
                </div>
            </div>
            <Skeleton className="h-3 w-full rounded" />
            <Skeleton className="h-3 w-2/3 rounded" />
        </div>
    ) : error || !profile ? (
        <div className="flex flex-col gap-3 p-4">
            <Typography type="body-sm" color="muted">
                {t(errorState.messageKey)}
            </Typography>
            {errorState.retryable ? (
                <Button size="sm" variant="secondary" onPress={() => void mutate()}>
                    {t("hovercard.errorRetry")}
                </Button>
            ) : null}
        </div>
    ) : (
        <div className="flex flex-col gap-3 p-4">
            <div className="flex items-center gap-3">
                <UserAvatar
                    username={profile.username}
                    avatar={profile.avatar}
                    seed={profile.username}
                    size="lg"
                    className="size-14"
                />
                <div className="flex min-w-0 flex-col">
                    <Typography type="body-sm" weight="semibold" truncate>
                        {profile.displayName || profile.username}
                    </Typography>
                    <Typography type="body-xs" color="muted" truncate>
                        {`@${profile.username}`}
                    </Typography>
                </div>
            </div>
            {profile.bio ? (
                <Typography type="body-xs" color="muted" className="line-clamp-3">
                    {profile.bio}
                </Typography>
            ) : null}
            <div className="flex items-center gap-4">
                <Typography type="body-xs" color="muted">
                    {t("hovercard.followers", { count: profile.followerCount ?? 0 })}
                </Typography>
                <Typography type="body-xs" color="muted">
                    {t("hovercard.following", { count: profile.followingCount ?? 0 })}
                </Typography>
            </div>
            {showFollowButton ? (
                <Button
                    size="sm"
                    variant={isFollowing ? "secondary" : "primary"}
                    isPending={isFollowPending}
                    isDisabled={isFollowPending}
                    onPress={handleFollowToggle}
                    fullWidth
                >
                    {({ isPending }) => (
                        <>
                            {isPending ? <Spinner color="current" size="sm" /> : null}
                            {t(isFollowing ? "hovercard.unfollow" : "hovercard.follow")}
                        </>
                    )}
                </Button>
            ) : null}
        </div>
    )

    return username ? (
        <UserHovercard content={hovercardContent} onOpen={handleOpenHovercard} className={className}>
            {trigger}
        </UserHovercard>
    ) : (
        trigger
    )
}
