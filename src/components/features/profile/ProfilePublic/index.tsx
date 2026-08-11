"use client"

import React, { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage, Tabs, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { ExtendedTabs } from "@/components/blocks/navigation/ExtendedTabs"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useQueryPublicProfileSwr } from "../hooks/useQueryPublicProfileSwr"
import { ProfileActivityTab } from "./ProfileActivityTab"
import { ProfileCommunityTab } from "./ProfileCommunityTab"
import { ProfileInfoTab } from "./ProfileInfoTab"
import { ProfileOverviewTab } from "./ProfileOverviewTab"

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
 * Public (read-only) profile view (§2) for `/u/[username]` — an identity hero plus four
 * tabs: Overview · Profile · Activity · Community.
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
                        {/* identity header */}
                        <div className="overflow-hidden rounded-2xl border border-separator">
                            {profile.coverUrl ? (
                                <img
                                    src={profile.coverUrl}
                                    alt={t("profile.hero.coverAlt")}
                                    className="h-28 w-full object-cover sm:h-36"
                                />
                            ) : null}
                            <div className="flex items-center gap-4 p-6">
                                <Avatar className="size-16 shrink-0 rounded-full">
                                    {profile.avatarUrl ? (
                                        <AvatarImage src={profile.avatarUrl} alt={profile.name} />
                                    ) : null}
                                    <AvatarFallback className="bg-accent/10 text-xl font-bold text-accent">
                                        {profile.name.slice(0, 1).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                    <Typography type="h4" weight="bold" truncate>
                                        {profile.name}
                                    </Typography>
                                    <Typography type="body-sm" color="muted">
                                        @{profile.username}
                                        {profile.headline ? ` · ${profile.headline}` : ""}
                                    </Typography>
                                    <Typography type="body-xs" color="muted">
                                        {t("profile.public.followers", {
                                            count: profile.followers,
                                        })}
                                        {profile.campus ? ` · ${profile.campus}` : ""}
                                    </Typography>
                                </div>
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

                        {tab === "overview" ? (
                            <ProfileOverviewTab
                                profile={profile}
                                onSeeProjects={() => setTab("profile")}
                            />
                        ) : null}
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
