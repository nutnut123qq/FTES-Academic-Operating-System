"use client"

import React from "react"
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
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link SaveButton}. Features pass only the entity coordinates. */
export interface SaveButtonProps extends WithClassNames<undefined> {
    /** What kind of entity this button saves ("resource" | "course" | "post"). */
    entityType: SavedEntityType
    /** The entity's id within its mock dataset. */
    entityId: string
    /** Post-only source context captured at save time (community/group/subject). */
    source?: SavedPostSource
}

/**
 * Shared save-for-later toggle (Threads visual language): a thin bookmark icon,
 * outline when unsaved and filled when saved, on a borderless/fill-less
 * icon-only button. Optimistic — the store flips synchronously, no spinner.
 * Guests get the existing sign-in modal and nothing toggles.
 *
 * Deliberate container-block (per openspec/changes/save-for-later/design.md,
 * decision 3): the block owns icon/state/gating via the saved-items store +
 * auth overlay so features only pass `entityType` + `entityId` (+ `source`
 * for posts). Presses never propagate to a wrapping card link.
 *
 * POST INTEGRATION POINT (post-engagement change): the post action bar's 🔖
 * button binds to the same mechanics — either render
 * `<SaveButton entityType="post" entityId={post.id} source={…} />` in the bar,
 * or call `useSavedItemsStore` `toggleSaved` / `useIsSaved` directly with the
 * identical gating shown here.
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
    const saved = useIsSaved(entityType, entityId)

    const onToggle = async () => {
        if (!authenticated) {
            dispatch(setAuthenticationModalTab(AuthenticationModalTab.SignIn))
            openAuthentication()
            return
        }
        // Optimistic flip first so the icon fills/empties with no perceptible lag.
        const wasSaved = saved
        toggleSaved({ entityType, entityId, source })
        // Only POSTs have a real BE bookmark endpoint; resources/courses stay on
        // the local store until their backends land (see store BE ASSUMPTION).
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
