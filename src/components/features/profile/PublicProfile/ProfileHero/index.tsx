"use client"

import React from "react"
import {
    Button,
    Link,
    Typography,
    cn,
} from "@heroui/react"
import {
    useLocale,
    useTranslations,
} from "next-intl"
import {
    useRouter,
} from "next/navigation"
import {
    FaGithub,
    FaLinkedin,
} from "react-icons/fa6"
import {
    BriefcaseIcon,
    CalendarBlankIcon,
    GlobeIcon,
    MapPinIcon,
    PaperPlaneTiltIcon,
} from "@phosphor-icons/react"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import {
    useProfileUsername,
} from "../hooks/useProfileUsername"
import {
    useProfileFollow,
} from "../hooks/useProfileFollow"
import {
    ProfileRankAvatar,
} from "./ProfileRankAvatar"
import {
    ShareProfileButton,
} from "./ShareProfileButton"
import {
    ProfileFollowers,
} from "./ProfileFollowers"
import {
    ProfileBadges,
} from "./ProfileBadges"
import {
    ProfileHeroSkeleton,
} from "./ProfileHeroSkeleton"
import { WorkMode } from "@/modules/types/enums/work-mode"
import { useAppSelector } from "@/redux/hooks"
import { useQueryUserProfileSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserProfileSwr"
import { pathConfig } from "@/resources/path"
import { FollowButton } from "@/components/reuseable/FollowButton"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { StatusChip } from "@/components/blocks/chips/StatusChip"

/** Props for {@link ProfileHero}. */
export type ProfileHeroProps = WithClassNames<undefined>

/** Maps a {@link WorkMode} to its i18n label key (static keys keep next-intl typed). */
const WORK_MODE_LABEL_KEY = {
    [WorkMode.Remote]: "publicProfile.workMode.remote",
    [WorkMode.Hybrid]: "publicProfile.workMode.hybrid",
    [WorkMode.Onsite]: "publicProfile.workMode.onsite",
} as const

/**
 * Identity column of the public profile — the BARE left sidebar (no card, per
 * `starci-concept.md`: identity is the static ground, content cards sit on the
 * right). Stacks the rank-framed avatar, name + `@handle`, the open-to-work
 * badge, a short bio, the action cluster (one primary CTA — recruiter "Liên hệ
 * tuyển dụng" / Follow / owner edit+settings), share, and a meta block
 * (followers · following · joined · github).
 *
 * Self-contained: resolves the target user from the route, reads the profile via
 * SWR (deduped across the page), pulls the viewer + auth flag from redux, and
 * owns follow state via {@link useProfileFollow}. XP is intentionally omitted.
 *
 * @param props - optional className (placement only — the sidebar wrapper).
 */
export const ProfileHero = ({
    className,
}: ProfileHeroProps) => {
    const t = useTranslations()
    const router = useRouter()
    const locale = useLocale()
    const username = useProfileUsername()
    const viewer = useAppSelector((state) => state.user.user)
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const { data: user, isLoading } = useQueryUserProfileSwr(username)
    const targetUserId = user?.id ?? null
    const {
        following,
        isPending: isFollowPending,
        onToggle: onToggleFollow,
    } = useProfileFollow()

    const isSelf = !!viewer && !!targetUserId && viewer.id === targetUserId
    const hasDisplayName = Boolean(user?.displayName?.trim())
    const title = hasDisplayName ? user?.displayName : user?.username
    // recruiter CTA is the single primary action when the user opts in + exposes
    // a github channel; otherwise Follow takes the primary slot
    const canHire = !isSelf && Boolean(user?.openToWork) && Boolean(user?.githubUsername)
    // show the bare hostname for the website link (cleaner than the full URL)
    let websiteHost: string | null = null
    if (user?.websiteUrl?.trim()) {
        try {
            websiteHost = new URL(user.websiteUrl).host
        } catch {
            websiteHost = user.websiteUrl
        }
    }
    // show the LinkedIn handle (`/in/<handle>`) for parity with the website host;
    // fall back to a generic label when the URL has no recognizable handle
    let linkedinHandle = "LinkedIn"
    if (user?.linkedinUrl?.trim()) {
        try {
            const match = new URL(user.linkedinUrl).pathname.match(/\/in\/([^/]+)/)
            if (match?.[1]) {
                linkedinHandle = decodeURIComponent(match[1])
            }
        } catch {
            // keep the generic "LinkedIn" label on a malformed URL
        }
    }
    const joinedLabel = user?.createdAt
        ? t("profile.joined", {
            // full month name per the time-rendering rule ("Tháng 6 2026"), not "thg 6"
            date: new Date(user.createdAt).toLocaleDateString(locale, {
                month: "long",
                year: "numeric",
            }),
        })
        : null

    return (
        <AsyncContent
            isLoading={isLoading && !user}
            skeleton={<ProfileHeroSkeleton className={className} />}
        >
            {user ? (
                <div className={cn("flex flex-col gap-4", className)}>
                    {/* rank-framed avatar — the seniority flex */}
                    <ProfileRankAvatar />

                    {/* name + @handle (open-to-work is a LinkedIn-style badge on the avatar) */}
                    <div className="flex flex-col gap-0">
                        <Typography type="h3" weight="bold" truncate>
                            {title}
                        </Typography>
                        {user.roleTitle?.trim() ? (
                            <Typography type="body-sm" weight="medium">
                                {user.roleTitle}
                            </Typography>
                        ) : null}
                        {hasDisplayName ? (
                            <Typography type="body-sm" color="muted" truncate>
                        @{user.username}
                            </Typography>
                        ) : null}
                    </div>

                    {/* short bio (wraps in the sidebar) */}
                    {user.bio?.trim() ? (
                        <Typography type="body-sm" color="muted">
                            {user.bio}
                        </Typography>
                    ) : null}

                    {/* location · preferred work mode */}
                    {user.location?.trim() || user.workMode ? (
                        <div className="flex flex-wrap items-center gap-2">
                            {user.location?.trim() ? (
                                <span className="flex items-center gap-2">
                                    <MapPinIcon aria-hidden focusable="false" className="size-5 shrink-0 text-muted" />
                                    <Typography type="body-sm" color="muted" truncate>
                                        {user.location}
                                    </Typography>
                                </span>
                            ) : null}
                            {user.workMode ? (
                                <StatusChip
                                    tone="neutral"
                                    icon={<BriefcaseIcon aria-hidden focusable="false" className="size-3.5" />}
                                >
                                    {t(WORK_MODE_LABEL_KEY[user.workMode])}
                                </StatusChip>
                            ) : null}
                        </div>
                    ) : null}

                    {/* social proof — followers (avatar group, links to the follow modal) +
                earned-badge medal strip, moved high in the column */}
                    <ProfileFollowers />
                    <ProfileBadges />

                    {/* action cluster — exactly one primary CTA; full-width in the narrow column */}
                    <div className="flex flex-col gap-2">
                        {canHire ? (
                            <Button
                                variant="primary"
                                fullWidth
                                aria-label={t("publicProfile.contactForHiring")}
                                onPress={() => window.open(`https://github.com/${user.githubUsername}`, "_blank", "noopener,noreferrer")}
                            >
                                <PaperPlaneTiltIcon aria-hidden focusable="false" className="size-5" />
                                {t("publicProfile.contactForHiring")}
                            </Button>
                        ) : null}
                        {authenticated && !isSelf ? (
                            <FollowButton
                                following={following}
                                isPending={isFollowPending}
                                onToggle={onToggleFollow}
                                className="w-full"
                            />
                        ) : null}
                        {isSelf ? (
                            <>
                                {/* owner primary = edit; settings live in the navbar dropdown */}
                                <Button
                                    variant="primary"
                                    fullWidth
                                    onPress={() => router.push(pathConfig().locale(locale).profile().edit().build())}
                                >
                                    {t("profileEdit.title")}
                                </Button>
                                <ShareProfileButton title={title ?? user.username} />
                            </>
                        ) : (
                            <ShareProfileButton title={title ?? user.username} />
                        )}
                    </div>

                    {/* meta: github · linkedin · website · joined — tight rows, one
                        leading icon each (no 44px tap-targets; this is sidebar meta) */}
                    <div className="flex flex-col gap-2">
                        {user.githubUsername ? (
                            <Link
                                href={`https://github.com/${user.githubUsername}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`GitHub: ${user.githubUsername}`}
                                className="flex items-center gap-2 py-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                            >
                                <FaGithub aria-hidden className="size-5 shrink-0 text-muted" />
                                <Typography type="body-sm" color="muted" truncate>
                                    {user.githubUsername}
                                </Typography>
                            </Link>
                        ) : null}
                        {user.linkedinUrl ? (
                            <Link
                                href={user.linkedinUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`LinkedIn: ${linkedinHandle}`}
                                className="flex items-center gap-2 py-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                            >
                                <FaLinkedin aria-hidden className="size-5 shrink-0 text-muted" />
                                <Typography type="body-sm" color="muted" truncate>
                                    {linkedinHandle}
                                </Typography>
                            </Link>
                        ) : null}
                        {websiteHost ? (
                            <Link
                                href={user.websiteUrl ?? undefined}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`Website: ${websiteHost}`}
                                className="flex items-center gap-2 py-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                            >
                                <GlobeIcon aria-hidden focusable="false" className="size-5 shrink-0 text-muted" />
                                <Typography type="body-sm" color="muted" truncate>
                                    {websiteHost}
                                </Typography>
                            </Link>
                        ) : null}
                        {joinedLabel ? (
                            <div className="flex items-center gap-2 py-0.5">
                                <CalendarBlankIcon aria-hidden focusable="false" className="size-5 shrink-0 text-muted" />
                                <Typography type="body-sm" color="muted" truncate>
                                    {joinedLabel}
                                </Typography>
                            </div>
                        ) : null}
                    </div>
                </div>
            ) : null}
        </AsyncContent>
    )
}
