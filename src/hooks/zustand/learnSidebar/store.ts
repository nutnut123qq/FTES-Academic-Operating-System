"use client"

import { create } from "zustand"

/**
 * Shared collapse state for the learn layout's left content-map rail. The reader
 * owns the toggle (inline on the lesson-title row); the route layout owns the rail
 * and reads this store to show/hide it. Mirrors the dashboard-tab store pattern.
 */
interface LearnSidebarStoreState {
    /** When true the left content-map rail is collapsed and the reading column widens. */
    collapsed: boolean
    /** Toggle the rail open/closed. */
    toggle: () => void
    /** Explicitly set the collapsed state. */
    setCollapsed: (collapsed: boolean) => void
}

/** Shared store for the learn sidebar. Default expanded so first visits see the map. */
export const useLearnSidebarStore = create<LearnSidebarStoreState>((set) => ({
    collapsed: false,
    toggle: () => set((state) => ({ collapsed: !state.collapsed })),
    setCollapsed: (collapsed) => set({ collapsed }),
}))
