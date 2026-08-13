"use client"

import React, {
    useEffect,
    useMemo,
    useState,
} from "react"
import {
    Button,
    cn,
} from "@heroui/react"
import { useTranslations } from "next-intl"
import {
    useDashboardTabUrlSync,
} from "./hooks/useDashboardTabUrlSync"
import {
    DashboardTabsBar,
} from "./DashboardTabsBar"
import {
    OverviewTab,
} from "./OverviewTab"
import {
    ExploreTab,
} from "./ExploreTab"
import {
    CoursesTab,
} from "./CoursesTab"
import {
    CommunityTab,
} from "./CommunityTab"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { DashboardIdentity } from "@/components/features/analytics/AnalyticsDashboard/DashboardIdentity"
import { EmptyState } from "@/components/blocks/feedback/EmptyState"
import { FtesMascot } from "@/components/reuseable/FtesMascot"
import { useDashboardTabStore } from "@/hooks/zustand/dashboardTab/store"
import { useRegisterNavbarBottomLayer } from "@/hooks/zustand/navbarBottomLayer/store"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { LocalStorage } from "@/modules/storage/local/storage"
import { LocalStorageId } from "@/modules/storage/local/enums/id"

/** Props for {@link Dashboard}. */
export type DashboardProps = WithClassNames<undefined>

/**
 * `/dashboard` — the logged-in home. A tab strip rendered as the Navbar's bottom
 * layer, then a centered 2-column body: left = the viewer's identity + standing
 * (bare, stable across tabs, reusing the analytics `DashboardIdentity`), right = the
 * selected tab's content. Tabs: Overview (cockpit) · Explore (feed) · Courses ·
 * Community. The open tab lives in the shared store and mirrors `?tab=` (shareable);
 * only the active panel MOUNTS — closed tabs are unmounted rather than hidden, so
 * each tab's leaf queries fetch lazily on first open. Mobile stacks the identity then
 * the content (no rail, no drawer). `"use client"` for the tab store + URL sync.
 *
 * GUESTS get a sign-in prompt instead of the cockpit. Every widget here is
 * session-scoped, so without a session the page rendered four tabs of empty states —
 * a visitor reads "no courses, no activity, no streak" as a fact about the product
 * rather than as "you are not signed in". The gate lives IN THE PAGE on purpose: it
 * canNOT move to the proxy, because `/dashboard` is deliberately absent from
 * `PROTECTED_PATTERNS` (the `session_hint` cookie never reaches this origin, so the
 * edge check is false for signed-in visitors too — it took the page down for everyone
 * once already; see the docblock in `src/proxy.ts`). `useRequireAuth()` is the house
 * hook for this: the CTA opens the shared `AuthenticationModal` on its SignIn tab with
 * the contextual line, and the visitor stays on `/dashboard` — so a successful sign-in
 * lands them straight on the cockpit they asked for, no second navigation.
 *
 * @param props - optional className for the root element
 */
export const Dashboard = ({
    className,
}: DashboardProps) => {
    const t = useTranslations()
    useDashboardTabUrlSync()
    const tab = useDashboardTabStore((state) => state.tab)
    const { authenticated, requireAuth } = useRequireAuth()
    // `authenticated` starts FALSE on every load and only flips once the app-shell
    // `me` query resolves, so gating on it alone would flash "sign in" at a signed-in
    // visitor reloading this page. A stored access token means the session is still
    // RESOLVING, not absent — the same pre-hydration read `AuthQueryOpener` makes.
    // It is taken AFTER mount (localStorage is client-only; reading it during render
    // would diverge from the SSR pass) and starts optimistic, so the prompt can only
    // ever appear once we know there is no token to resolve.
    const [hasStoredToken, setHasStoredToken] = useState(true)
    useEffect(() => {
        setHasStoredToken(
            Boolean(LocalStorage.getItemAsString(LocalStorageId.KeycloakAccessToken)),
        )
    }, [])
    const isGuest = !authenticated && !hasStoredToken
    // the tab strip renders as the global Navbar's bottom layer; the node must be a
    // STABLE reference (it sits in the register effect's deps) — hence useMemo([]).
    // Guests register `null` (also stable): with no cockpit to switch between, a tab
    // strip in the navbar would only offer four doors onto the same prompt.
    const tabsNode = useMemo(() => <DashboardTabsBar />, [])
    useRegisterNavbarBottomLayer(isGuest ? null : tabsNode)

    if (isGuest) {
        return (
            <div className={cn("flex w-full flex-col", className)}>
                <div className="mx-auto flex w-full max-w-6xl flex-col px-6 py-6">
                    <EmptyState
                        icon={<FtesMascot pose="explain" size="lg" />}
                        title={t("nav.guestPrompt")}
                        action={(
                            <Button
                                size="sm"
                                variant="primary"
                                onPress={() => requireAuth("auth.context.generic")}
                            >
                                {t("nav.signIn")}
                            </Button>
                        )}
                    />
                </div>
            </div>
        )
    }

    return (
        <div className={cn("flex w-full flex-col", className)}>
            {/* tab strip is registered as the Navbar bottom layer above (not here) */}
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-6 md:flex-row md:items-start">
                {/* LEFT: identity + standing, bare, scrolls with the page */}
                <aside className="flex w-full flex-col gap-4 md:w-72 md:shrink-0">
                    <DashboardIdentity />
                </aside>
                {/* RIGHT: the open tab's content (only the active panel mounts) */}
                <main className="flex min-w-0 flex-1 flex-col gap-6">
                    {tab === "overview" ? (
                        <div
                            id="dashboard-panel-overview"
                            role="tabpanel"
                            aria-labelledby="overview"
                            className="flex flex-col gap-6"
                        >
                            <OverviewTab />
                        </div>
                    ) : null}
                    {tab === "explore" ? (
                        <div
                            id="dashboard-panel-explore"
                            role="tabpanel"
                            aria-labelledby="explore"
                            className="flex flex-col gap-6"
                        >
                            <ExploreTab />
                        </div>
                    ) : null}
                    {tab === "courses" ? (
                        <div
                            id="dashboard-panel-courses"
                            role="tabpanel"
                            aria-labelledby="courses"
                            className="flex flex-col gap-6"
                        >
                            <CoursesTab />
                        </div>
                    ) : null}
                    {tab === "community" ? (
                        <div
                            id="dashboard-panel-community"
                            role="tabpanel"
                            aria-labelledby="community"
                            className="flex flex-col gap-6"
                        >
                            <CommunityTab />
                        </div>
                    ) : null}
                </main>
            </div>
        </div>
    )
}
