"use client"

import React from "react"
import { Link } from "@heroui/react"
import { useAppSelector } from "@/redux/hooks"
import { useE2eResultOverlayState } from "@/hooks/zustand/overlay/hooks"

/** Minimal flow shape needed for the trigger label (full shape lives in E2eBody). */
interface E2eFlowLite {
    /** Per-flow status string (e.g. "passed"). */
    status: string
}

/**
 * Trigger for the global {@link import("@/components/drawers/E2eResultDrawer").E2eResultDrawer} — a
 * quiet text link in the lesson footer ("view E2E proof") that opens the proof drawer via the shared
 * overlay store. Hidden when the active lesson has no recorded flows. Split out from the drawer panel
 * so open-state lives in the store (no local `useState`).
 */
export const E2eResultButton = (): React.JSX.Element | null => {
    const { open } = useE2eResultOverlayState()
    const content = useAppSelector((state) => state.content.entity)
    const flows = (content?.e2eFlows as Array<E2eFlowLite> | null | undefined) ?? []
    if (flows.length === 0) return null
    const passed = flows.filter((flow) => flow.status === "passed").length

    return (
        <Link
            onPress={open}
            className="inline-flex items-center gap-2 text-sm font-medium text-accent underline-offset-4 hover:underline"
        >
            {`Xem kết quả kiểm thử E2E (${passed}/${flows.length} luồng pass) →`}
        </Link>
    )
}
