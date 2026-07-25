"use client"

import React, { useEffect, useRef, useState } from "react"
import { Button, cn, toast } from "@heroui/react"
import { BookmarkSimpleIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { AuthenticationModalTab, setAuthenticationModalTab } from "@/redux/slices/tabs"
import { useAuthenticationOverlayState } from "@/hooks/zustand/overlay/hooks"
import {
    useHydrateSavedItems,
    useIsSaved,
    useSavedItemsStore,
    type SavedEntityType,
    type SavedPostSource,
} from "@/hooks/zustand/savedItems"
import { bookmarkPost, unbookmarkPost } from "@/modules/api/rest/community/community"
import { bookmarkResource, unbookmarkResource } from "@/modules/api/rest/resource"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { useResourceBookmarksSwr } from "./useResourceBookmarksSwr"

/** Props for {@link SaveButton}. Features pass only the entity coordinates. */
export interface SaveButtonProps extends WithClassNames<undefined> {
    /** What kind of entity this button saves ("resource" | "course" | "post"). */
    entityType: SavedEntityType
    /** The entity's id (a real UUID for resources/posts). */
    entityId: string
    /** Post-only source context captured at save time (community/group/subject). */
    source?: SavedPostSource
}

/**
 * Shared save-for-later toggle (Threads visual language): a thin bookmark icon,
 * outline when unsaved and filled when saved, on a borderless/fill-less
 * icon-only button. Optimistic — the state flips synchronously, no spinner.
 * Guests get the existing sign-in modal and nothing toggles.
 *
 * Backends per entity type:
 *  - `post` → `PUT/DELETE /community/bookmarks/{id}`, UI truth = saved-items store,
 *  - `resource` → `PUT/DELETE /resources/{id}/bookmark`, UI truth = SERVER
 *    (`GET /resources/me/bookmarks`, see {@link useResourceBookmarksSwr}); the
 *    local store is kept in sync so the `/saved` library still lists the row,
 *  - `course` → local store only (no BE endpoint yet).
 *
 * Concurrency note: the optimistic flip is reverted through a FUNCTIONAL state
 * update that compares against the value still pending (`prev === next`), and the
 * store revert reads a ref, never a closed-over boolean — a second toggle landing
 * while the first request is in flight therefore cannot be clobbered by a stale
 * rollback.
 *
 * @param props - {@link SaveButtonProps}
 */
export const SaveButton = ({ entityType, entityId, source, className }: SaveButtonProps) => {
    const t = useTranslations()
    const dispatch = useAppDispatch()
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const { open: openAuthentication } = useAuthenticationOverlayState()
    const toggleSaved = useSavedItemsStore((state) => state.toggleSaved)
    useHydrateSavedItems()
    const storeSaved = useIsSaved(entityType, entityId)

    const isResource = entityType === "resource"
    const { bookmarkedIds, mutate: mutateBookmarks } = useResourceBookmarksSwr(isResource)
    const remoteSaved = bookmarkedIds?.has(entityId)

    /** Optimistic override while a resource bookmark call is in flight (`null` = server truth). */
    const [pendingSaved, setPendingSaved] = useState<boolean | null>(null)
    const [isPending, setIsPending] = useState(false)
    /** In-flight latch read synchronously (state lands a render too late for a double press). */
    const isPendingRef = useRef(false)

    const saved = isResource ? (pendingSaved ?? remoteSaved ?? storeSaved) : storeSaved

    // refs mirror the LAST COMMITTED values so an async rollback never reads a
    // value captured before a concurrent toggle
    const savedRef = useRef(saved)
    const storeSavedRef = useRef(storeSaved)
    const hasBookmarkListRef = useRef(bookmarkedIds !== undefined)
    /** Mirror of `pendingSaved`, readable synchronously inside an async handler. */
    const pendingSavedRef = useRef<boolean | null>(null)
    /** Value this button last pushed into the local store (`null` = in sync). */
    const storeSyncedRef = useRef<boolean | null>(null)
    useEffect(() => {
        savedRef.current = saved
        storeSavedRef.current = storeSaved
        hasBookmarkListRef.current = bookmarkedIds !== undefined
        if (storeSyncedRef.current === storeSaved) {
            // the store caught up with our optimistic push — drop the shadow
            storeSyncedRef.current = null
        }
    }, [saved, storeSaved, bookmarkedIds])

    /**
     * Keep the local saved-items store aligned with `next` (the `/saved` library
     * joins against it). Compares against the value we actually pushed, not a
     * closed-over boolean, so a rollback can never double-toggle.
     */
    const syncStore = (next: boolean) => {
        const current = storeSyncedRef.current ?? storeSavedRef.current
        if (current !== next) {
            storeSyncedRef.current = next
            toggleSaved({ entityType, entityId, source })
        }
    }

    /** Drop the optimistic override iff it is still the value THIS call set. */
    const settlePending = (value: boolean): boolean => {
        if (pendingSavedRef.current !== value) {
            return false
        }
        pendingSavedRef.current = null
        setPendingSaved(null)
        return true
    }

    const onToggleResource = async () => {
        if (isPendingRef.current) {
            // a bookmark call is already in flight — ignore the extra press
            return
        }
        isPendingRef.current = true
        const next = !savedRef.current
        pendingSavedRef.current = next
        setPendingSaved(next)
        setIsPending(true)
        syncStore(next)
        try {
            await (next ? bookmarkResource(entityId) : unbookmarkResource(entityId))
            // patch the shared bookmark cache in place; revalidate only when the
            // list was never loaded (a partial Set would mislead the other rows)
            await mutateBookmarks(
                (previous) => {
                    if (!previous) {
                        return previous
                    }
                    const updated = new Set(previous)
                    if (next) {
                        updated.add(entityId)
                    } else {
                        updated.delete(entityId)
                    }
                    return updated
                },
                { revalidate: !hasBookmarkListRef.current },
            )
            settlePending(next)
        } catch {
            // revert ONLY if this call's optimistic value is still the pending one
            if (settlePending(next)) {
                syncStore(!next)
            }
            toast.danger(t("savedItems.saveFailed"))
        } finally {
            isPendingRef.current = false
            setIsPending(false)
        }
    }

    const onToggle = async () => {
        if (!authenticated) {
            dispatch(setAuthenticationModalTab(AuthenticationModalTab.SignIn))
            openAuthentication()
            return
        }
        if (isResource) {
            await onToggleResource()
            return
        }
        // Optimistic flip first so the icon fills/empties with no perceptible lag.
        const wasSaved = saved
        toggleSaved({ entityType, entityId, source })
        // Courses stay on the local store until their backend lands (see store
        // BE ASSUMPTION); posts and resources have real bookmark endpoints.
        if (entityType !== "post") {
            return
        }
        try {
            await (wasSaved ? unbookmarkPost(entityId) : bookmarkPost(entityId))
        } catch {
            // Revert the optimistic flip and surface the failure.
            toggleSaved({ entityType, entityId, source })
            toast.danger(t("savedItems.saveFailed"))
        }
    }

    return (
        // wrapper swallows the click so a press never bubbles into (or triggers
        // the default navigation of) a wrapping card <Link>
        <span
            className={cn("inline-flex shrink-0", className)}
            onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
            }}
        >
            <Button
                isIconOnly
                size="sm"
                variant="ghost"
                aria-pressed={saved}
                aria-label={saved ? t("savedItems.unsave") : t("savedItems.save")}
                isDisabled={isPending}
                onPress={() => void onToggle()}
            >
                <BookmarkSimpleIcon
                    aria-hidden
                    focusable="false"
                    className="size-5"
                    weight={saved ? "fill" : "regular"}
                />
            </Button>
        </span>
    )
}
