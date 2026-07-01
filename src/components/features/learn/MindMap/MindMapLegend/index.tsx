"use client"

import React, { useMemo } from "react"
import { Panel } from "@xyflow/react"
import { useTranslations } from "next-intl"
import { Legend } from "@/components/blocks/stats/Legend"

/**
 * Floating status legend for the mind-map: explains the module-node tints
 * (done / in-progress / not-started / locked) and the accent "you are here"
 * marker. Only shown once the viewer's progress is known (the colours mean
 * nothing on the structure-only guest map).
 *
 * Must render as a child of {@link import("@xyflow/react").ReactFlow}.
 */
export const MindMapLegend = () => {
    const t = useTranslations()

    const items = useMemo(
        () => [
            { key: "current", color: "var(--accent)", label: t("mindMap.legend.current") },
            { key: "done", color: "var(--success)", label: t("mindMap.legend.done") },
            { key: "inProgress", color: "var(--warning)", label: t("mindMap.legend.inProgress") },
            { key: "notStarted", color: "var(--muted)", label: t("mindMap.legend.notStarted") },
            { key: "locked", color: "var(--separator)", label: t("mindMap.legend.locked") },
        ],
        [t],
    )

    return (
        <Panel className="!m-4 rounded-2xl bg-surface/90 px-3 py-2 shadow-lg backdrop-blur-sm" position="bottom-left">
            <Legend items={items} />
        </Panel>
    )
}
