"use client"

import React, { useEffect } from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useCommunityComposerOverlayState } from "@/hooks/zustand/overlay/hooks"
import { CommunityComposerForm } from "./CommunityComposerForm"

export { CommunityComposerForm } from "./CommunityComposerForm"

/**
 * Community post composer page (§6, `/community/new`) — the full-page surface
 * around the shared {@link CommunityComposerForm} (the modal composer reuses
 * the same form). Submit POSTs the draft via the community REST API
 * (see {@link CommunityComposerForm}).
 *
 * The page is always a PLAIN compose (repost/quote only enters via the modal), but
 * the quote lives in a shared overlay store, so clear it on mount — otherwise a
 * quote stashed by a dismissed repost modal would leave this page stuck in
 * repost mode with no way out.
 */
export const CommunityComposer = () => {
    const t = useTranslations("communityHub")
    const { setQuote } = useCommunityComposerOverlayState()

    useEffect(() => {
        setQuote(null)
    }, [setQuote])

    return (
        <div className="flex flex-col gap-4">
            <Typography type="h5" weight="bold">
                {t("composer.title")}
            </Typography>
            <CommunityComposerForm />
        </div>
    )
}
