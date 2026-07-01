"use client"

import React, {
    useEffect,
    useMemo,
} from "react"
import {
    cn,
} from "@heroui/react"
import {
    useLocale,
} from "next-intl"
import {
    useParams,
    useRouter,
    useSearchParams,
} from "next/navigation"
import {
    pathConfig,
} from "@/resources/path"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import {
    useProfileUsername,
} from "./hooks/useProfileUsername"
import {
    useProfileTabUrlSync,
} from "./hooks/useProfileTabUrlSync"
import {
    ProfileHero,
} from "./ProfileHero"
import {
    ProfileTabsBar,
} from "./ProfileTabsBar"
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
    ProfileChallengesTab,
} from "./ProfileChallengesTab"
import {
    ProfileProjectsTab,
} from "./ProfileProjectsTab"
import {
    ProfileSkillsTab,
} from "./ProfileSkillsTab"
import {
    ProfileActivityTab,
} from "./ProfileActivityTab"
import { useAppSelector } from "@/redux/hooks"
import { useProfileTabStore } from "@/hooks/zustand/profileTab/store"
import { useQueryUserProfileSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserProfileSwr"
import { useRegisterNavbarBottomLayer } from "@/hooks/zustand/navbarBottomLayer/store"

/** Props for {@link PublicProfile}. */
export type PublicProfileProps = WithClassNames<undefined>

/**
 * Public profile of any user — viewable by anyone, signed in or not. Editorial
 * layout: a full-width tab strip pinned under the app navbar, then the identity
 * hero and a single centered content column. Each tab is its own self-fetching
 * container, so a tab only queries when first opened.
 *
 * A thin orchestrator: it owns only the loading / not-found / locked / main
 * branch decision; the hero, the tabs bar, each state view, and every tab
 * self-fetch the viewed user (SWR-deduped) so they take no data props, and the
 * open tab lives in a shared store. Mounted by `/profile/[username]`; the target
 * username is read from the route (or the signed-in user on the bare `/profile`).
 *
 * @param props - {@link PublicProfileProps}
 */
export const PublicProfile = ({
    className,
}: PublicProfileProps) => {
    const username = useProfileUsername()
    const viewer = useAppSelector((state) => state.user.user)
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const {
        data: user,
        isLoading,
        error,
    } = useQueryUserProfileSwr(username)
    const { tab } = useProfileTabStore()
    // keep the open tab in the URL query (`?tab=`) — shareable + back/forward
    useProfileTabUrlSync()

    // canonicalize the URL to `/profile/<username>` — a legacy/email-addressed
    // link (e.g. `/profile/<email>`) still resolves on the backend, but once the
    // user loads we replace the URL with their real username (GitHub-style), so
    // the address bar never lingers on an email or any non-canonical handle.
    const router = useRouter()
    const locale = useLocale()
    const routeUsername = useParams().username
    const searchParams = useSearchParams()
    useEffect(() => {
        const segment = routeUsername ? String(routeUsername) : null
        if (!segment || !user?.username || segment === user.username) {
            return
        }
        const query = searchParams.toString()
        const target = pathConfig().locale(locale).profile(user.username).build()
        router.replace(query ? `${target}?${query}` : target)
    }, [routeUsername, user?.username, locale, searchParams, router])

    const isSelf = !!viewer && !!user?.id && viewer.id === user.id
    // locked profile viewed by a non-owner → hero + "private" notice, tabs withheld
    const isLocked = Boolean(user?.profileLocked) && !isSelf
    // the profile tab strip renders as the global Navbar's bottom layer, but only
    // when the main profile actually shows (not on loading / not-found / locked).
    const showTabs = !isLoading && !(authenticated && !username) && Boolean(user) && !error && !isLocked
    const tabsNode = useMemo(() => <ProfileTabsBar />, [])
    useRegisterNavbarBottomLayer(showTabs ? tabsNode : null)

    // first load → skeleton so the column never jumps. On the bare `/profile` the
    // username is null until the signed-in user hydrates — treat that as loading.
    if (isLoading || (authenticated && !username)) {
        return <ProfileLoadingState className={className} />
    }

    // not found / soft-deleted / failed read → a proper 404-style page
    if (!user || error) {
        return <ProfileNotFoundState className={className} />
    }

    if (isLocked) {
        return <ProfileLockedState className={className} />
    }

    return (
        <div className={cn("flex w-full flex-col", className)}>
            {/* the profile tab strip is registered as the Navbar's bottom layer
                above (useRegisterNavbarBottomLayer), so it is NOT rendered here. */}

            {/* starci-concept: flex 2-col — left identity BARE, right content cards */}
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-6 md:flex-row md:items-start">
                {/* left: identity column, bare (no card) — scrolls with the page (not sticky) */}
                <aside className="flex w-full flex-col gap-4 md:w-72 md:shrink-0">
                    <ProfileHero />
                </aside>

                {/* right: selected tab content (only the open tab mounts → lazy fetch) */}
                <main className="flex min-w-0 flex-1 flex-col gap-6">
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
                    {tab === "challenges" ? (
                        <div
                            id="profile-panel-challenges"
                            role="tabpanel"
                            aria-labelledby="challenges"
                            className="flex flex-col gap-6"
                        >
                            <ProfileChallengesTab />
                        </div>
                    ) : null}
                    {tab === "projects" ? (
                        <div
                            id="profile-panel-projects"
                            role="tabpanel"
                            aria-labelledby="projects"
                            className="flex flex-col gap-6"
                        >
                            <ProfileProjectsTab />
                        </div>
                    ) : null}
                    {tab === "skills" ? (
                        <div
                            id="profile-panel-skills"
                            role="tabpanel"
                            aria-labelledby="skills"
                            className="flex flex-col gap-6"
                        >
                            <ProfileSkillsTab />
                        </div>
                    ) : null}
                    {tab === "activity" ? (
                        <div
                            id="profile-panel-activity"
                            role="tabpanel"
                            aria-labelledby="activity"
                            className="flex flex-col gap-6"
                        >
                            <ProfileActivityTab />
                        </div>
                    ) : null}
                </main>
            </div>
        </div>
    )
}
