"use client"

import { create } from "zustand"

/** localStorage key for the "learner has discovered selection-ask" flag. */
const STORAGE_KEY = "ftes.learn.selectionAskSeen"

/**
 * Shared "has the learner discovered selection-ask?" flag, backed by
 * localStorage (StarCI port). Two surfaces read it: the one-time inline tip above
 * the lesson article ({@link import("./SelectionHintCallout").SelectionHintCallout})
 * and the "Mới" tag on the floating ask button. Both hide the moment it flips to
 * `seen`, so we never keep nudging someone who already found the feature.
 */
interface SelectionHintState {
    seen: boolean
    /** Read the persisted flag (client-only) — call once on mount; idempotent. */
    hydrate: () => void
    /** Mark discovered (on dismiss OR first use) + persist. */
    markSeen: () => void
}

export const useSelectionHintStore = create<SelectionHintState>((set, get) => ({
    seen: false,
    hydrate: () => {
        if (get().seen || typeof window === "undefined") {
            return
        }
        if (window.localStorage.getItem(STORAGE_KEY) === "true") {
            set({ seen: true })
        }
    },
    markSeen: () => {
        if (get().seen) {
            return
        }
        if (typeof window !== "undefined") {
            window.localStorage.setItem(STORAGE_KEY, "true")
        }
        set({ seen: true })
    },
}))
