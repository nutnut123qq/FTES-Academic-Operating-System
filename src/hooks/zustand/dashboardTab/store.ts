"use client"

import { create } from "zustand"

/**
 * Top-level tabs of the logged-in dashboard. Owned here (the store owns the tab
 * state) so the tab strip and any jump-to-tab action drive the same selection
 * without prop-drilling. Mirrors the profile-page tab pattern.
 */
export type DashboardTab = "overview" | "explore" | "courses" | "community"

/** Shared store shape for the dashboard tab. */
interface DashboardTabStoreState {
    /** Currently open tab (drives the panel switch). */
    tab: DashboardTab
    /** Select a tab. */
    setTab: (tab: DashboardTab) => void
}

/** Shared store for the dashboard tab. Default "overview" (the cockpit front page). */
export const useDashboardTabStore = create<DashboardTabStoreState>((set) => ({
    tab: "overview",
    setTab: (tab) => set({ tab }),
}))
