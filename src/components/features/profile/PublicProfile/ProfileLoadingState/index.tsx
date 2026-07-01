"use client"

import React from "react"
import {
    Card,
    CardContent,
    Skeleton,
    cn,
} from "@heroui/react"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"

/** Props for {@link ProfileLoadingState}. */
export type ProfileLoadingStateProps = WithClassNames<undefined>

/**
 * First-load skeleton for the public profile, shaped to MIRROR the real shell so
 * the layout never jumps on resolve: a full-width tab strip, then the 2-column
 * body — a BARE identity sidebar on the left (rank avatar + name + bio + CTA +
 * meta, no card) and a stack of labelled section cards on the right (label
 * placeholder OUTSIDE each card, matching `LabeledCard`).
 *
 * @param props - {@link ProfileLoadingStateProps}
 */
export const ProfileLoadingState = ({
    className,
}: ProfileLoadingStateProps) => {
    return (
        <div
            aria-busy="true"
            aria-label="Loading profile"
            className={cn("flex w-full flex-col", className)}
        >
            {/* tab strip (full-width, under the navbar) */}
            <div className="w-full px-6 py-3">
                <div className="flex gap-6">
                    {[0, 1, 2, 3, 4].map((tab) => (
                        <Skeleton key={tab} className="h-6 w-24 rounded-xl" />
                    ))}
                </div>
            </div>

            {/* 2-col body: left identity BARE · right content cards */}
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-6 md:flex-row md:items-start">
                {/* left: identity column, bare (no card) */}
                <aside className="flex w-full flex-col gap-4 md:w-72 md:shrink-0">
                    {/* rank-framed avatar */}
                    <Skeleton className="size-44 rounded-full" />
                    {/* name + @handle */}
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-7 w-44 rounded-xl" />
                        <Skeleton className="h-4 w-28 rounded-xl" />
                    </div>
                    {/* bio */}
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-4 w-full rounded-xl" />
                        <Skeleton className="h-4 w-3/4 rounded-xl" />
                    </div>
                    {/* action cluster */}
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-10 w-full rounded-full" />
                        <Skeleton className="h-10 w-full rounded-full" />
                    </div>
                    {/* meta lines */}
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-4 w-32 rounded-xl" />
                        <Skeleton className="h-4 w-40 rounded-xl" />
                    </div>
                </aside>

                {/* right: labelled section cards (label outside, card body) */}
                <main className="flex min-w-0 flex-1 flex-col gap-6">
                    {[0, 1, 2].map((section) => (
                        <div key={section} className="flex flex-col gap-3">
                            <Skeleton className="h-5 w-40 rounded-xl" />
                            <Card>
                                <CardContent>
                                    <Skeleton className="h-40 w-full rounded-xl" />
                                </CardContent>
                            </Card>
                        </div>
                    ))}
                </main>
            </div>
        </div>
    )
}
