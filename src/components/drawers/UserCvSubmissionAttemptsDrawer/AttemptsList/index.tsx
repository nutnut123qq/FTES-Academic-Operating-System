"use client"

import React from "react"
import {
    cn,
    ScrollShadow,
} from "@heroui/react"
import type { AttemptRow } from "../types"
import {
    CVCard,
} from "./CVCard"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link AttemptsList}. */
export interface AttemptsListProps extends WithClassNames<undefined> {
    /** Display-ready attempt rows to render. */
    rows: Array<AttemptRow>
}

/**
 * Scrollable list of CV attempt cards.
 *
 * Presentational: maps rows → {@link CVCard}, no logic.
 * @param props - {@link AttemptsListProps}
 */
export const AttemptsList = ({
    rows,
    className,
}: AttemptsListProps) => {
    return (
        <ScrollShadow
            className={cn("min-h-0 flex-1 overflow-x-hidden p-3", className)}
            hideScrollBar
        >
            <div className="flex flex-col gap-3">
                {rows.map((row) => (
                    <CVCard
                        key={row.key}
                        attemptId={row.key}
                        attemptNumber={row.attemptNumber}
                        fileLabel={row.fileLabel}
                        fileUrl={row.fileUrl}
                        fileUrlIsPublic={row.fileUrlIsPublic}
                        submittedAtLabel={row.submittedAtLabel}
                        status={row.status}
                        feedbackPreview={row.feedbackPreview}
                        detailFeedback={row.detailFeedback}
                    />
                ))}
            </div>
        </ScrollShadow>
    )
}
