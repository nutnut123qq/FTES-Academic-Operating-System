"use client"

import { create } from "zustand"
import { LocalStorage } from "@/modules/storage/local/storage"
import { LocalStorageId } from "@/modules/storage/local/enums/id"

/**
 * Shared "has the learner discovered selection-ask?" flag, backed by
 * localStorage. Two surfaces read it: the one-time inline tip above the lesson
 * article ({@link import("./SelectionHintCallout").SelectionHintCallout}) and
 * the "Mới" tag on the floating ask button ({@link import("./index").ContentAiSelectionAsk}).
 * Both hide the moment it flips to `seen`, so we never keep nudging someone who
 * already found the feature (restraint). `seen` defaults to `false` for SSR and
 * is hydrated from localStorage on the client.
 */
interface SelectionHintState {
    /** Whether the learner has already discovered "highlight a passage to ask AI". */
    seen: boolean
    /** Read the persisted flag (client-only) — call once on mount; idempotent. */
    hydrate: () => void
    /** Mark discovered (on dismiss OR first use) + persist; hides the tip and the "Mới" tag. */
    markSeen: () => void
}

export const useSelectionHintStore = create<SelectionHintState>((set, get) => ({
    seen: false,
    hydrate: () => {
        if (get().seen) {
            return
        }
        if (LocalStorage.getItem<boolean>(LocalStorageId.HintSeenSelectionAsk)) {
            set({ seen: true })
        }
    },
    markSeen: () => {
        if (get().seen) {
            return
        }
        LocalStorage.setItem(LocalStorageId.HintSeenSelectionAsk, true)
        set({ seen: true })
    },
}))
