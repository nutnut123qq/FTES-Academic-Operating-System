import type { DashboardTab } from "@/hooks/zustand/dashboardTab/store"

/** Re-export the canonical tab union (owned by the shared dashboard tab store). */
export type { DashboardTab }

/**
 * Dashboard tabs in display order. "overview" = the cockpit (next action + pace);
 * "explore" = feed/discovery; "courses" = my courses + recommended; "community" =
 * leaderboard + standing. i18n labels live under `dashboard.tabs.*`.
 */
export const DASHBOARD_TABS: ReadonlyArray<DashboardTab> = [
    "overview",
    "explore",
    "courses",
    "community",
]

/**
 * Tab a bare `/dashboard` (no `?tab=`) lands on. Matches the shared store's initial
 * value; `useDashboardTabUrlSync` resets to it when the URL carries no valid tab, so
 * the module-level store cannot leak the previous visit's tab into a fresh link.
 */
export const DEFAULT_DASHBOARD_TAB: DashboardTab = "overview"
