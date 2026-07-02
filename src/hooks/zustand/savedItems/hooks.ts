"use client"

import { useEffect } from "react"
import { useSavedItemsStore } from "./store"
import type { SavedEntityType } from "./store"

/**
 * Hydrate the saved-items store from `localStorage` once on the client.
 * Idempotent — every surface that renders saved state calls it; the first
 * mounted one wins. Runs in an effect so SSR markup never reads storage.
 */
export const useHydrateSavedItems = () => {
    const hydrate = useSavedItemsStore((state) => state.hydrate)
    useEffect(() => {
        hydrate()
    }, [hydrate])
}

/**
 * Reactive saved-state of one entity. Returns `false` until the store is
 * hydrated so pre-hydration renders are always the neutral/unsaved appearance
 * (no wrong-state flash).
 *
 * @param entityType - the entity kind ("resource" | "course" | "post")
 * @param entityId - the entity's id
 * @returns whether the entity is currently saved (post-hydration)
 */
export const useIsSaved = (entityType: SavedEntityType, entityId: string) => {
    const isHydrated = useSavedItemsStore((state) => state.isHydrated)
    const saved = useSavedItemsStore((state) =>
        state.items.some(
            (item) => item.entityType === entityType && item.entityId === entityId,
        ),
    )
    return isHydrated && saved
}
