"use client"

import React, { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage, Tabs, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { ExtendedTabs } from "@/components/blocks/navigation/ExtendedTabs"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { StaffBadge } from "@/components/reuseable/StaffBadge"
import { useViewerStaffRole } from "@/hooks/useViewerStaffRole"
import { useAppSelector } from "@/redux/hooks"
import { useQueryPublicProfileSwr } from "../hooks/useQueryPublicProfileSwr"
import { ProfileActivityTab } from "./ProfileActivityTab"
import { ProfileCommunityTab } from "./ProfileCommunityTab"
import { ProfileInfoTab } from "./ProfileInfoTab"
import { ProfileOverviewTab } from "./ProfileOverviewTab"
import { ProfileStatsRow } from "./ProfileStatsRow"

/** The public profile's tabs. Kept local — this surface owns its own tab set. */
type PublicTab = "overview" | "profile" | "activity" | "community"

/** Skeleton mirroring the hero + tab strip + first panel. */
const PublicProfileSkeleton = () => (
    <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4 rounded-2xl border border-separator p-6">
            <Skeleton.Avatar size="lg" className="size-16" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Skeleton.Typography type="h4" width="1/2" />
                <Skeleton.Typography type="body-sm" width="2/3" />
                <Skeleton.Typography type="body-xs" width="1/3" />
            </div>
        </div>
        <Skeleton.Tabs />
        <div className="flex flex-col gap-3">
            <Skeleton.Typography type="h6" width="1/4" />
            <Skeleton.Card lines={3} />
        </div>
    </div>
)

/**
 * Public (read-only) profile view (§2) for `/u/[username]` — an identity hero (avatar,
 * name, handle, headline, followers AND the About text) plus four tabs:
 * Overview (counters + this profile's community posts) · Profile (academic, contact,
 * links, the full project + achievement lists) · Activity · Community (followers /
 * following).
 *
 * The tab set is deliberately narrower than a coding-portfolio site's: every tab is backed
 * by data FTES actually holds. Three blocks a richer profile would carry are NOT built
 * here because the backend cannot populate them — `progress` (xp/level/reputation/coin),
 * `certificates`, and the profile module's own timeline all come from
 * `@ConditionalOnMissingBean` stub ports (`profile/integration/stub/IntegrationStubConfig`)
 * that return `null` / `[]` unconditionally. Rendering them would be an empty shell, so
 * they are left out until a real adapter lands. The Activity tab instead reads the
 * activity module directly (`GET /activities?userId=`), which IS real.
 *
 * Standalone (not under the owner shell) so its nav never points at the viewer's own pages.
 */
export const ProfilePublic = () => {
    const t = useTranslations()
    const { username } = useParams<{ username: string }>()
    const { profile, isLoading, error, mutate } = useQueryPublicProfileSwr(username)
    const [tab, setTab] = useState<PublicTab>("overview")
    const viewer = useAppSelector((state) => state.user.user)
    const viewerStaffRole = useViewerStaffRole()
    /**
     * Staff role of the person this page is ABOUT.
     *
     * The backend public-profile read cannot supply it: `ProfileViews.PublicProfile`
     * (`GET /api/v1/profiles/{username}`) has no role field, and the batch resolver that
     * feeds every other surface (`AccessControl.publicStaffRoles`, used by
     * `PublicUserBatchLoader` / `FeedController`) is never called on this path. So the
     * only role this page can prove is the VIEWER'S OWN, from their hydrated grants —
     * which at least makes "my own profile, seen from /u/<me>" agree with the account
     * menu and with my posts in the feed.
     *
     * Viewing SOMEONE ELSE therefore still shows no badge until the backend adds
     * `staffRole` to `PublicProfile` (see the handoff note). It renders nothing rather
     * than guessing — a wrong seal on a stranger is worse than a missing one.
     */
    const staffRole =
        profile
            && ((viewer?.id && viewer.id === profile.userId)
                || (viewer?.username && viewer.username === profile.username))
            ? viewerStaffRole
            : null

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
            <AsyncContent
                isLoading={isLoading && !profile}
                skeleton={<PublicProfileSkeleton />}
                error={!profile ? error : undefined}
                errorContent={{
                    title: t("profile.loadingError"),
                    retryLabel: t("profile.retry"),
                    onRetry: () => void mutate(),
                }}
            >
                {profile ? (
                    <div className="flex flex-col gap-6">
                        {/* identity header — tên, @username, ngành, follower VÀ phần About
                            (About không còn là khối riêng dưới tab Tổng quan) */}
                        <div className="overflow-hidden rounded-2xl border border-separator">
                            <div className="flex flex-col gap-4 p-6">
                                <div className="flex items-center gap-4">
                                    <Avatar className="size-16 shrink-0 rounded-full">
                                        {profile.avatarUrl ? (
                                            <AvatarImage src={profile.avatarUrl} alt={profile.name} />
                                        ) : null}
                                        <AvatarFallback className="bg-accent/10 text-xl font-bold text-accent">
                                            {profile.name.slice(0, 1).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                        <div className="flex min-w-0 items-center gap-1">
                                            <Typography type="h4" weight="bold" truncate>
                                                {profile.name}
                                            </Typography>
                                            <StaffBadge role={staffRole} size="md" />
                                        </div>
                                        <Typography type="body-sm" color="muted">
                                            @{profile.username}
                                            {profile.headline ? ` · ${profile.headline}` : ""}
                                        </Typography>
                                        {profile.campus ? (
                                            <Typography type="body-xs" color="muted">
                                                {profile.campus}
                                            </Typography>
                                        ) : null}
                                    </div>
                                </div>
                                {profile.about ? (
                                    <Typography
                                        type="body-sm"
                                        color="muted"
                                        className="whitespace-pre-line"
                                    >
                                        {profile.about}
                                    </Typography>
                                ) : null}
                                <ProfileStatsRow profile={profile} />
                            </div>
                        </div>

                        <ExtendedTabs
                            selectedKey={tab}
                            onSelectionChange={(key) => setTab(key as PublicTab)}
                        >
                            <Tabs.ListContainer>
                                <Tabs.List aria-label={t("publicProfile.tabsAria")}>
                                    <Tabs.Tab key="overview" id="overview">
                                        {t("publicProfile.tabs.overview")}
                                    </Tabs.Tab>
                                    <Tabs.Tab key="profile" id="profile">
                                        {t("publicProfile.tabs.profile")}
                                    </Tabs.Tab>
                                    <Tabs.Tab key="activity" id="activity">
                                        {t("publicProfile.tabs.activity")}
                                    </Tabs.Tab>
                                    <Tabs.Tab key="community" id="community">
                                        {t("publicProfile.tabs.community")}
                                    </Tabs.Tab>
                                </Tabs.List>
                            </Tabs.ListContainer>
                        </ExtendedTabs>

                        {tab === "overview" ? <ProfileOverviewTab profile={profile} /> : null}
                        {tab === "profile" ? <ProfileInfoTab profile={profile} /> : null}
                        {tab === "activity" ? (
                            <ProfileActivityTab userId={profile.userId} />
                        ) : null}
                        {tab === "community" ? (
                            <ProfileCommunityTab
                                username={profile.username}
                                userId={profile.userId}
                                followers={profile.followers}
                                following={profile.following}
                            />
                        ) : null}
                    </div>
                ) : null}
            </AsyncContent>
        </div>
    )
}
