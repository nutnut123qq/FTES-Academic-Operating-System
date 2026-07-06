"use client"

import React, { useEffect } from "react"
import { CursorClickIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { Callout } from "@/components/blocks/feedback/Callout"
import { useSelectionHintStore } from "./hintStore"

/**
 * One-time inline tip above the lesson article teaching the learner they can
 * highlight any passage to ask the AI about it (StarCI port) — solving the
 * chicken-and-egg where the floating "ask" button only appears AFTER a selection.
 * Dismissible; auto-disappears once the learner selects text for the first time
 * (both gated by the shared `seen` flag). Uses the {@link Callout} block since it
 * sits inside the reading card (surface-in-surface).
 */
export const SelectionHintCallout = () => {
    const t = useTranslations("learn")
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
            icon={<CursorClickIcon aria-hidden focusable="false" className="size-5" />}
            title={t("reader.ai.selectionHintTitle")}
            description={t("reader.ai.selectionHint")}
            onClose={markSeen}
            closeAriaLabel={t("reader.ai.dismissHint")}
        />
    )
}
