"use client"

import React from "react"
import {
    Card,
    CardContent,
    cn,
    Skeleton,
} from "@heroui/react"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"

/** Props for {@link ProfileLoadingState}. */
export type ProfileLoadingStateProps = WithClassNames<undefined>

/**
 * First-load skeleton for the public profile. It mirrors the real layout so the
 * column never jumps when data resolves: a top tab strip, then a left identity
 * card (avatar + name + counts + action) beside a main column of section cards.
 * Purely presentational — the parent owns the loading condition and decides when
 * to render this.
 *
 * @param props - {@link ProfileLoadingStateProps}
 */
export const ProfileLoadingState = ({
    className,
}: ProfileLoadingStateProps) => {
    return (
        <div
            className={cn("mx-auto flex max-w-6xl flex-col", className)}
            aria-busy="true"
            aria-label="Loading profile"
        >
            {/* tab strip placeholder — matches the real four-tab row baseline */}
            <div className="mt-3 flex w-full gap-6 border-b border-separator pb-3">
                {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-5 w-20 rounded-full" />
                ))}
            </div>

            {/* sidebar + main, same gutter / widths as the loaded layout */}
            <div className="flex flex-col gap-8 px-6 py-6 md:flex-row md:items-start">
                {/* sidebar: identity card skeleton */}
                <aside className="flex w-full flex-col gap-6 md:w-64 md:shrink-0">
                    <Card>
                        <CardContent className="flex flex-col gap-3">
                            <Skeleton className="size-32 rounded-xl" />
                            <div className="flex flex-col gap-2">
                                <Skeleton className="h-6 w-40 rounded-full" />
                                <Skeleton className="h-4 w-24 rounded-full" />
                            </div>
                            <Skeleton className="h-9 w-full rounded-full" />
                            <Skeleton className="h-4 w-32 rounded-full" />
                        </CardContent>
                    </Card>
                </aside>

                {/* main: a couple of section-card skeletons */}
                <main className="flex min-w-0 flex-1 flex-col gap-6">
                    {Array.from({ length: 2 }).map((_, index) => (
                        <Card key={index}>
                            <CardContent className="flex flex-col gap-3">
                                <Skeleton className="h-5 w-32 rounded-full" />
                                <Skeleton className="h-4 w-full rounded-full" />
                                <Skeleton className="h-4 w-5/6 rounded-full" />
                                <Skeleton className="h-4 w-2/3 rounded-full" />
                            </CardContent>
                        </Card>
                    ))}
                </main>
            </div>
        </div>
    )
}
