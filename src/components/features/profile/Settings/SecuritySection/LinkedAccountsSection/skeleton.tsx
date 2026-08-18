import React from "react"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"

/**
 * Loading state of the linked-accounts list — two rows shaped like the real `ListRow`s
 * (leading provider icon, provider name over a muted email/date line, a trailing action),
 * stacked in the same `gap-0` column so the card does not resize when data arrives.
 */
export const LinkedAccountsSectionSkeleton = () => {
    return (
        <div className="flex flex-col gap-0">
            {[0, 1].map((row) => (
                <div key={row} className="flex items-center gap-3 py-2">
                    <Skeleton className="size-5 shrink-0 rounded-md" />
                    <div className="flex min-w-0 flex-col gap-0">
                        <Skeleton.Typography type="body-sm" className="w-24" />
                        <Skeleton.Typography type="body-xs" className="w-56" />
                    </div>
                    <div className="ml-auto shrink-0">
                        <Skeleton.Button width="w-20" />
                    </div>
                </div>
            ))}
        </div>
    )
}
