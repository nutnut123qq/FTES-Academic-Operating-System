"use client"

import { create } from "zustand"

/**
 * The top-level tabs of the public profile. Defined here (the store owns the tab
 * state) so neither the live profile feature nor the parked legacy one owns the
 * canonical type — both import it from the shared store. "challenges" surfaces
 * graded-challenge proof (repo submissions); "skills" holds coding-practice stats.
 */
export type ProfileTab = "overview" | "challenges" | "projects" | "skills" | "activity"

/**
 * Zustand store for the public-profile tab — SHARED so the Tabs strip and the
 * jump-to-tab buttons (ProfileHero summary cards, ProfileFeaturedProjects
 * "see all") drive the same selected tab without prop-drilling a callback.
 * Default is "overview" (the GitHub-style front page).
 */
interface ProfileTabStoreState {
    /** Currently open tab (drives the panel switch). */
    tab: ProfileTab
    /** Select a tab. */
    setTab: (tab: ProfileTab) => void
}

/** Shared store for the public-profile tab. */
export const useProfileTabStore = create<ProfileTabStoreState>((set) => ({
    tab: "overview",
    setTab: (tab) => set({ tab }),
}))
