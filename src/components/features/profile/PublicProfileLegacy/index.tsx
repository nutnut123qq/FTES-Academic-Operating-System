"use client"

import React from "react"
import {
    cn,
    Tabs,
    Typography,
} from "@heroui/react"
import {
    House as OverviewIcon,
    Rocket as ProjectsIcon,
    Code as SkillsIcon,
    Pulse as ActivityIcon,
} from "@gravity-ui/icons"
import {
    useTranslations,
} from "next-intl"
import {
    useProfileUsername,
} from "./useProfileUsername"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import {
    PROFILE_TABS,
} from "./types"
import type {
    ProfileTab,
} from "./types"
import {
    ProfileIdentityCard,
} from "./ProfileIdentityCard"
import {
    ProfileLoadingState,
} from "./ProfileLoadingState"
import {
    ProfileNotFoundState,
} from "./ProfileNotFoundState"
import {
    ProfileLockedState,
} from "./ProfileLockedState"
import {
    ProfileOverviewTab,
} from "./ProfileOverviewTab"
import {
    ProfileAchievements,
} from "./ProfileAchievements"
import {
    ProfileActivity,
} from "./ProfileActivity"
import {
    ProfileCourses,
} from "./ProfileCourses"
import {
    ProfileCoding,
} from "./ProfileCoding"
import {
    ProfileCapstone,
} from "./ProfileCapstone"
import {
    ProfileSkills,
} from "./ProfileSkills"
import {
    ProfileSolvedChallenges,
} from "./ProfileSolvedChallenges"
import { useAppSelector } from "@/redux/hooks"
import { useProfileTabStore } from "@/hooks/zustand/profileTab/store"
import { useQueryUserProfileSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserProfileSwr"

/** Leading icon shown on each profile tab, keyed by tab id. */
const TAB_ICONS: Record<ProfileTab, typeof OverviewIcon> = {
    overview: OverviewIcon,
    projects: ProjectsIcon,
    skills: SkillsIcon,
    activity: ActivityIcon,
}

/** Props for {@link PublicProfile}. */
export type PublicProfileProps = WithClassNames<undefined>

/**
 * GitHub-style public profile of any user — viewable by anyone, signed in or not.
 * An identity card (avatar + name + follow counts + primary action) sits in a
 * left sidebar beside the selected tab's content; a full-width tab strip on top
 * switches between Overview (bio + flex), Projects, Skills, and Activity. Each
 * tab is its own self-fetching container, so a tab only queries when first opened.
 *
 * A thin orchestrator: it owns only the loading / not-found / locked / main branch
 * decision; the identity card, each state view, and every tab self-fetch the
 * viewed user (SWR-deduped) so they take no data props, and the open tab lives in
 * a shared store so the jump-to-tab buttons need no callbacks. Mounted by
 * `/profile/[username]`; the target username is read from the route (or the
 * signed-in user on the bare `/profile`).
 *
 * @param props - {@link PublicProfileProps}
 */
export const PublicProfile = ({
    className,
}: PublicProfileProps) => {
    const t = useTranslations()
    // target username: the `/profile/[username]` segment, or — on the bare
    // `/profile` — the signed-in user's own username (one layout for self + others)
    const username = useProfileUsername()
    const viewer = useAppSelector((state) => state.user.user)
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const {
        data: user,
        isLoading,
        error,
    } = useQueryUserProfileSwr(username)
    // which tab is open (Overview by default); panels mount lazily on select
    const { tab, setTab } = useProfileTabStore()

    // first load → centered spinner so the column never jumps. On the bare
    // `/profile` the username is null until the signed-in user hydrates — treat
    // that as loading too (avoids a not-found flash before redux settles)
    if (isLoading || (authenticated && !username)) {
        return <ProfileLoadingState className={className} />
    }

    // not found / soft-deleted / failed read → a proper 404-style page
    if (!user || error) {
        return <ProfileNotFoundState className={className} />
    }

    // viewing your own public profile → no follow button (link to edit instead)
    const isSelf = !!viewer && !!user.id && viewer.id === user.id
    // locked profile viewed by someone other than the owner → show only the
    // public header + a "private" notice; the tab content is withheld (also
    // enforced server-side, so the tabs would come back empty anyway)
    const isLocked = Boolean(user.profileLocked) && !isSelf

    if (isLocked) {
        return <ProfileLockedState className={className} />
    }

    return (
        <div className={cn("mx-auto flex max-w-6xl flex-col", className)}>
            {/* tab strip — wrapper border-b acts as the baseline; the list itself
                suppresses its own border so the selected tab's accent underline
                overlays it cleanly (same pattern as ProgrammingLanguageTabs).
                rounded-none on each tab keeps the strip flush; the HeroUI
                data-focus-visible ring is preserved — we do NOT add outline:none. */}
            <div className="mt-3 w-full border-b border-separator" role="tablist">
                <Tabs
                    className="w-full"
                    selectedKey={tab}
                    variant="secondary"
                    onSelectionChange={(key) => setTab(String(key) as typeof tab)}
                >
                    <Tabs.ListContainer className="w-full">
                        <Tabs.List
                            aria-label={t("publicProfile.title")}
                            className="w-full border-b-0!"
                        >
                            {PROFILE_TABS.map((tabId) => {
                                // leading icon for this tab (House / Rocket / Code / Pulse)
                                const TabIcon = TAB_ICONS[tabId]
                                return (
                                    <Tabs.Tab
                                        key={tabId}
                                        id={tabId}
                                        // aria-controls links each tab button to its panel region
                                        aria-controls={`profile-panel-${tabId}`}
                                        // rounded-none keeps strip flush; active underline via border-b-2
                                        // data-focus-visible ring from HeroUI is preserved (no outline: none)
                                        className="rounded-none data-[selected=true]:border-b-2 data-[selected=true]:border-accent data-[selected=true]:text-accent"
                                    >
                                        <span className="flex items-center gap-2">
                                            <TabIcon
                                                aria-hidden
                                                focusable="false"
                                                className="size-5 shrink-0"
                                            />
                                            {t(`publicProfile.tabs.${tabId}`)}
                                        </span>
                                    </Tabs.Tab>
                                )
                            })}
                        </Tabs.List>
                    </Tabs.ListContainer>
                </Tabs>
            </div>

            {/* below the tabs: identity sidebar (left) + tab content (right). Owns
                the column padding the outer container no longer applies. */}
            <div className="flex flex-col gap-8 px-6 py-6 md:flex-row md:items-start">
                {/* sidebar — persistent identity card + primary action (sticky on desktop) */}
                <aside className="flex w-full flex-col gap-6 md:sticky md:top-6 md:w-64 md:shrink-0">
                    <ProfileIdentityCard />
                </aside>

                {/* main — selected tab content (only the open tab mounts → lazy fetch).
                    Each panel carries role="tabpanel" + id + aria-labelledby so screen
                    readers correctly announce "Overview tab panel" etc. on focus/route. */}
                <main className="flex min-w-0 flex-1 flex-col gap-6">
                    {/* Overview: bio README + the recruiter-first flex */}
                    {tab === "overview" ? (
                        <div
                            id="profile-panel-overview"
                            role="tabpanel"
                            aria-labelledby="overview"
                            className="flex flex-col gap-6"
                        >
                            <ProfileOverviewTab />
                        </div>
                    ) : null}
                    {/* Projects: verified capstone tasks + submitted challenge repos */}
                    {tab === "projects" ? (
                        <div
                            id="profile-panel-projects"
                            role="tabpanel"
                            aria-labelledby="projects"
                            className="flex flex-col gap-6"
                        >
                            <ProfileCapstone />
                        </div>
                    ) : null}
                    {/* Skills & Coding: coding-practice stats + solved breakdown + challenge signal */}
                    {tab === "skills" ? (
                        <div
                            id="profile-panel-skills"
                            role="tabpanel"
                            aria-labelledby="skills"
                            className="flex flex-col gap-6"
                        >
                            <ProfileCoding />
                            <ProfileSkills />
                            <ProfileSolvedChallenges />
                        </div>
                    ) : null}
                    {/* Activity: achievements wall + joined courses + activity timeline */}
                    {tab === "activity" ? (
                        <div
                            id="profile-panel-activity"
                            role="tabpanel"
                            aria-labelledby="activity"
                            className="flex flex-col gap-6"
                        >
                            {/* section headings use Typography.Heading for correct DOM hierarchy */}
                            <div className="flex flex-col gap-3">
                                <Typography.Heading level={3} weight="semibold">
                                    {t("publicProfile.tabs.achievements")}
                                </Typography.Heading>
                                <ProfileAchievements />
                            </div>
                            <div className="flex flex-col gap-3">
                                <Typography.Heading level={3} weight="semibold">
                                    {t("publicProfile.tabs.courses")}
                                </Typography.Heading>
                                <ProfileCourses />
                            </div>
                            <div className="flex flex-col gap-3">
                                <Typography.Heading level={3} weight="semibold">
                                    {t("publicProfile.recentActivity")}
                                </Typography.Heading>
                                <ProfileActivity />
                            </div>
                        </div>
                    ) : null}
                </main>
            </div>
        </div>
    )
}
