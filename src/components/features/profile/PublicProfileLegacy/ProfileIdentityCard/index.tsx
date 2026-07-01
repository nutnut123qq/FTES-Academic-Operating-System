"use client"

import React from "react"
import {
    Button,
    Typography,
} from "@heroui/react"
import {
    useLocale,
    useTranslations,
} from "next-intl"
import {
    SiGithub,
} from "@icons-pack/react-simple-icons"
import {
    Gear as SettingsIcon,
    PaperPlane as PaperPlaneIcon,
} from "@gravity-ui/icons"
import {
    useRouter,
} from "next/navigation"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import {
    useProfileUsername,
} from "../useProfileUsername"
import {
    useProfileFollow,
} from "../useProfileFollow"
import {
    ProfileRankAvatar,
} from "../ProfileRankAvatar"
import {
    ShareProfileButton,
} from "../ShareProfileButton"
import { useAppSelector } from "@/redux/hooks"
import { useQueryUserProfileSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserProfileSwr"
import { useQueryUserWeeklyStatsSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserWeeklyStatsSwr"
import { pathConfig } from "@/resources/path"
import { FollowButton } from "@/components/reuseable/FollowButton"
import { SectionCard } from "@/components/reuseable/SectionCard"
import { StatusChip } from "@/components/blocks/chips/StatusChip"
import { StatPair } from "@/components/blocks/stats/StatPair"

/** Props for {@link ProfileIdentityCard}. */
export type ProfileIdentityCardProps = WithClassNames<undefined>

/**
 * The persistent identity card in the profile sidebar: rank-framed avatar, name
 * + @handle, the open-to-work badge with optional hire CTA (GitHub link, non-self
 * viewers only), the primary action cluster (follow / edit + settings), a share
 * button, follower/following counts, and a meta block (streak, GitHub link,
 * joined date). XP is intentionally omitted (vanity — spec §3).
 *
 * Self-contained container: resolves the target user from the route, reads the
 * profile + weekly stats via SWR (deduped with the rest of the page), pulls the
 * viewer + auth flag from redux, and owns the follow state via
 * {@link useProfileFollow}. Threads only `className` into the card root — no
 * data or callback props — so both the open and locked branches can reuse the
 * same identity primitives.
 *
 * @param props - optional className for the {@link SectionCard} root.
 */
export const ProfileIdentityCard = ({
    className,
}: ProfileIdentityCardProps) => {
    const t = useTranslations()
    const router = useRouter()
    const locale = useLocale()
    const username = useProfileUsername()
    const viewer = useAppSelector((state) => state.user.user)
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const { data: user } = useQueryUserProfileSwr(username)
    // entity id resolved from the username — what follow + isSelf key off
    const targetUserId = user?.id ?? null
    // streak for the sidebar stat strip (Duolingo-style); fires once the id resolves
    const { data: weeklyStats } = useQueryUserWeeklyStatsSwr(targetUserId)
    // follow state + count mirror + toggle (owns the setFollow mutation)
    const {
        following,
        isPending: isFollowPending,
        onToggle: onToggleFollow,
        followerCount,
    } = useProfileFollow()

    if (!user) {
        return null
    }

    // viewing your own public profile → no follow button (link to edit instead)
    const isSelf = !!viewer && !!targetUserId && viewer.id === targetUserId
    // prefer the chosen display name; fall back to the username as the title
    const hasDisplayName = Boolean(user.displayName?.trim())
    const title = hasDisplayName ? user.displayName : user.username

    return (
        <SectionCard
            contentClassName="gap-3"
            className={className}
        >
            {/* avatar framed by the user's seniority rank (rank-coloured ring + pill) */}
            <ProfileRankAvatar />
            <div className="flex flex-col gap-0">
                <Typography type="h4" weight="semibold" truncate>
                    {title}
                </Typography>
                {/* show the @handle only when it differs from the title */}
                {hasDisplayName ? (
                    <Typography type="body-sm" color="muted" truncate>
                        @{user.username}
                    </Typography>
                ) : null}
            </div>
            {/* open-to-work hiring badge (public, user opted in) */}
            {user.openToWork ? (
                <div className="flex flex-col gap-2">
                    <StatusChip tone="success">
                        {t("publicProfile.openToWork")}
                    </StatusChip>
                    {/* hire CTA: visible to non-self viewers only; requires a github channel */}
                    {!isSelf && user.githubUsername ? (
                        <Button
                            variant="primary"
                            className="w-full"
                            aria-label={t("publicProfile.contactForHiring")}
                            onPress={() => window.open(`https://github.com/${user.githubUsername}`, "_blank", "noopener,noreferrer")}
                        >
                            <PaperPlaneIcon aria-hidden className="size-5" />
                            {t("publicProfile.contactForHiring")}
                        </Button>
                    ) : null}
                </div>
            ) : null}
            {/* action (full-width under the identity): follow others, edit self */}
            {authenticated && !isSelf ? (
                <FollowButton
                    following={following}
                    isPending={isFollowPending}
                    onToggle={onToggleFollow}
                    className="w-full"
                />
            ) : null}
            {isSelf ? (
                <div className="flex items-center gap-2">
                    <Button
                        variant="secondary"
                        className="flex-1"
                        onPress={() => router.push(pathConfig().locale(locale).profile().edit().build())}
                    >
                        {t("profileEdit.title")}
                    </Button>
                    {/* gear → the private settings hub (AI, sessions, membership…) */}
                    <Button
                        isIconOnly
                        variant="secondary"
                        size="md"
                        aria-label={t("profileSettings.title")}
                        onPress={() => router.push(pathConfig().locale(locale).profile().settings().build())}
                    >
                        <SettingsIcon aria-hidden className="size-5" />
                    </Button>
                </div>
            ) : null}
            {/* share this profile — the flex / growth loop */}
            <ShareProfileButton title={title ?? user.username} />
            {/* follower / following stat strip — XP removed (vanity, per spec §3) */}
            <div className="flex items-start gap-3">
                <StatPair
                    value={followerCount}
                    label={t("profile.followers")}
                />
                <StatPair
                    value={user.followingCount ?? 0}
                    label={t("profile.following")}
                />
            </div>
            {/* meta: streak + github link + joined date */}
            <div className="flex flex-col gap-2">
                {weeklyStats && weeklyStats.streak > 0 ? (
                    <Typography type="body-xs" color="muted">
                        {t("profile.streakLine", {
                            streak: weeklyStats.streak,
                            longest: weeklyStats.longestStreak,
                        })}
                    </Typography>
                ) : null}
                {user.githubUsername ? (
                    <a
                        href={`https://github.com/${user.githubUsername}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`GitHub: ${user.githubUsername}`}
                        className="flex min-h-11 items-center gap-2 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                        <SiGithub aria-hidden className="size-5 shrink-0 text-muted" />
                        <Typography type="body-xs" color="muted" truncate>
                            {user.githubUsername}
                        </Typography>
                    </a>
                ) : null}
                {user.createdAt ? (
                    <Typography type="body-xs" color="muted">
                        {t("profile.joined", {
                            date: new Date(user.createdAt).toLocaleDateString(locale, {
                                month: "short",
                                year: "numeric",
                            }),
                        })}
                    </Typography>
                ) : null}
            </div>
        </SectionCard>
    )
}
