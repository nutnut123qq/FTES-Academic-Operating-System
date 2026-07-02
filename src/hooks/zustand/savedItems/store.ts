"use client"

import { create } from "zustand"

/** Namespaced localStorage key persisting the mock saved-items list. */
const STORAGE_KEY = "ftes.savedItems.v1"

/** Entity kinds a user can save for later (§ save-for-later). */
export type SavedEntityType = "resource" | "course" | "post"

/**
 * Where a saved POST lives — captured at save time so the `/saved` "Bài viết"
 * tab can render "Cộng đồng / group X / subject Y" and build the detail link
 * without re-querying every feed. Resource/course entries omit this (their
 * context resolves from the mock datasets).
 */
export interface SavedPostSource {
    /** Which surface family the post was saved from. */
    kind: "community" | "group" | "subject"
    /** The owning group/subject id (absent for the global community feed). */
    id?: string
    /** Display-only snapshot of the source name (e.g. the group's name). */
    label: string
}

/** One saved entry in the mock store. */
export interface SavedItem {
    /** What kind of entity is saved. */
    entityType: SavedEntityType
    /** The entity's id within its mock dataset. */
    entityId: string
    /** Epoch millis of the save action (drives newest-first ordering). */
    savedAt: number
    /** Post-only source context (see {@link SavedPostSource}). */
    source?: SavedPostSource
}

/** Input for {@link SavedItemsStoreState.toggleSaved}. */
export interface ToggleSavedInput {
    /** What kind of entity to toggle. */
    entityType: SavedEntityType
    /** The entity's id. */
    entityId: string
    /** Post-only source context, captured when saving (ignored on unsave). */
    source?: SavedPostSource
}

/** Read the persisted list (client only); empty when absent / unreadable. */
const readStoredItems = (): Array<SavedItem> => {
    if (typeof window === "undefined") {
        return []
    }
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        if (!raw) {
            return []
        }
        const parsed = JSON.parse(raw) as unknown
        if (!Array.isArray(parsed)) {
            return []
        }
        return parsed.filter(
            (item): item is SavedItem =>
                !!item &&
                typeof (item as SavedItem).entityId === "string" &&
                typeof (item as SavedItem).savedAt === "number" &&
                ["resource", "course", "post"].includes((item as SavedItem).entityType),
        )
    } catch {
        return []
    }
}

/** Persist the list (client only); write failures are swallowed (mock scope). */
const writeStoredItems = (items: Array<SavedItem>): void => {
    if (typeof window === "undefined") {
        return
    }
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
        // storage full / blocked — the in-memory state stays authoritative
    }
}

/**
 * Saved-items store shape: the entries plus the hydration flag surfaces gate
 * their filled/outline rendering on (pre-hydration everything renders unsaved,
 * so SSR markup never flashes a wrong state).
 */
interface SavedItemsStoreState {
    /** Every saved entry (unordered; consumers sort by `savedAt`). */
    items: Array<SavedItem>
    /** Whether the localStorage read ran (client-side, in an effect). */
    isHydrated: boolean
    /** Read the persisted list once (idempotent — call from an effect). */
    hydrate: () => void
    /** Optimistically save/unsave an entity and persist the new list. */
    toggleSaved: (input: ToggleSavedInput) => void
    /** Whether an entity is currently saved. */
    isSaved: (entityType: SavedEntityType, entityId: string) => boolean
}

/**
 * MOCK saved-items store (save-for-later): Zustand + `localStorage`, the single
 * client-side source of truth for saved resources / courses / posts shared by
 * every toggle surface and the `/saved` library.
 *
 * BE ASSUMPTION (recorded per openspec/changes/save-for-later/design.md): the
 * backend will eventually expose `toggleSaved(entityType, entityId)` +
 * `savedItems(entityType?, skip, take, search)` cross-entity and user-scoped
 * (no `X-Course-Id` header). The existing course-context-bound
 * `useMutateToggleFavoriteSwr` / `useQuerySavedContentsSwr` hooks are NOT used
 * here (the mutation is lesson-content-scoped and throws without a Redux
 * courseId) — they stay untouched as the future wiring reference. When BE
 * lands, swap this store's toggle/list internals for the real mutation/query
 * and drop the `localStorage` persistence.
 */
export const useSavedItemsStore = create<SavedItemsStoreState>((set, get) => ({
    items: [],
    isHydrated: false,
    hydrate: () => {
        if (get().isHydrated) {
            return
        }
        set({ items: readStoredItems(), isHydrated: true })
    },
    toggleSaved: ({ entityType, entityId, source }) => {
        const { items } = get()
        const exists = items.some(
            (item) => item.entityType === entityType && item.entityId === entityId,
        )
        const next = exists
            ? items.filter(
                (item) => !(item.entityType === entityType && item.entityId === entityId),
            )
            : [...items, { entityType, entityId, savedAt: Date.now(), source }]
        writeStoredItems(next)
        set({ items: next })
    },
    isSaved: (entityType, entityId) =>
        get().items.some(
            (item) => item.entityType === entityType && item.entityId === entityId,
        ),
}))
