"use client"

import React, { useEffect } from "react"
import { CursorClickIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { Callout } from "@/components/blocks/feedback/Callout"
import { useSelectionHintStore } from "./hintStore"

/**
 * One-time inline tip above the lesson article teaching the learner they can
 * highlight any passage to ask the AI about it — solving the chicken-and-egg
 * where the floating "ask" button only appears AFTER a selection. Shows on the
 * first reading view, is dismissible, and auto-disappears once the learner
 * selects text for the first time (both gated by the shared `seen` flag —
 * see {@link import("./hintStore").useSelectionHintStore}). Render it above
 * `#lesson-article` on the (unlocked) reading tab.
 *
 * Uses {@link Callout} (the in-card alert block) since it sits inside the
 * reading "paper" card (surface-in-surface).
 */
export const SelectionHintCallout = () => {
    const t = useTranslations()
    const seen = useSelectionHintStore((state) => state.seen)
    const hydrate = useSelectionHintStore((state) => state.hydrate)
    const markSeen = useSelectionHintStore((state) => state.markSeen)

    useEffect(() => hydrate(), [hydrate])

    if (seen) {
        return null
    }

    return (
        <Callout
            status="accent"
            className="mb-4"
            icon={<CursorClickIcon className="size-5" />}
            title={t("contentAi.selectionHintTitle")}
            description={t("contentAi.selectionHint")}
            onClose={markSeen}
            closeAriaLabel={t("contentAi.dismissHint")}
        />
    )
}

