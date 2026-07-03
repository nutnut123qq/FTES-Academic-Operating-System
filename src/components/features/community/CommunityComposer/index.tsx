"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { CommunityComposerForm } from "./CommunityComposerForm"

export { CommunityComposerForm } from "./CommunityComposerForm"

/**
 * Community post composer page (§6, `/community/new`) — the full-page surface
 * around the shared {@link CommunityComposerForm} (the modal composer reuses
 * the same form). ponytail: submit is a no-op mock (no BE).
 */
export const CommunityComposer = () => {
    const t = useTranslations("communityHub")

    return (
        <div className="flex flex-col gap-4">
            <Typography type="h5" weight="bold">
                {t("composer.title")}
            </Typography>
            <CommunityComposerForm />
        </div>
    )
}
