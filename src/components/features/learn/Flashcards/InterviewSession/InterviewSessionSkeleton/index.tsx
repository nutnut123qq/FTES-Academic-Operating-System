import React from "react"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Loading placeholder for the voice-interview session. Mirrors the real layout:
 * meta chips, one tall question panel, a centered mic button, and the
 * new-question / submit controls.
 */
export const InterviewSessionSkeleton = ({ className }: WithClassNames<undefined> = {}) => {
    return (
        <div className={className}>
            <div className="flex flex-col gap-6">
                {/* level + tag chips */}
                <div className="flex gap-2">
                    <Skeleton.Chip />
                    <Skeleton.Chip />
                </div>
                {/* the question panel — plain (borderless) surface */}
                <div className="flex min-h-40 flex-col gap-3 rounded-xl bg-default/40 p-8">
                    <Skeleton.Typography type="body" width="3/4" />
                    <Skeleton.Typography type="body" width="2/3" />
                </div>
                {/* centered mic button */}
                <div className="flex justify-center">
                    <Skeleton.Button />
                </div>
                {/* new-question / submit controls */}
                <div className="flex items-center justify-between gap-3">
                    <Skeleton.Button />
                    <Skeleton.Button />
                </div>
            </div>
        </div>
    )
}
