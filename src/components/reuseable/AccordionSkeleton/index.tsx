"use client"

import React from "react"
import {
    cn,
    Separator,
    Skeleton,
} from "@heroui/react"
import {
    SkeletonText,
} from "../SkeletonText"
import type {
    AccordionSkeletonProps,
} from "./types"

/**
 * Static accordion-shaped loading placeholder — no HeroUI `Accordion` (no expand/collapse logic).
 * Mirrors title row + optional chevron + expanded body so layout stays stable when real accordion mounts.
 * @param props - {@link AccordionSkeletonProps}
 */
export const AccordionSkeleton = (props: AccordionSkeletonProps) => {
    const {
        items,
        className,
        renderExpandedBody,
    } = props
    return (
        <div
            className={cn("rounded-none border-none px-0 shadow-none", className)}
            aria-busy="true"
        >
            {
                items.map(
                    (item, index) => {
                        const showIndicator = item.showIndicator !== false
                        const titleSize = item.titleSize ?? "base"
                        return (
                            <React.Fragment key={index}>
                                <div
                                    aria-label={item.ariaLabel}
                                >
                                    <div className="flex w-full items-center justify-between gap-1.5 p-3">
                                        <SkeletonText
                                            size={titleSize}
                                            width={item.titleWidth}
                                            className="min-w-0 flex-1"
                                        />
                                        {showIndicator ? (
                                            <Skeleton className="w-5 h-5 rounded-full" />
                                        ) : null}
                                    </div>
                                    {
                                        item.expanded && renderExpandedBody ? (
                                            <div className="rounded-none border-none p-3 pt-1.5">
                                                {renderExpandedBody(index)}
                                            </div>
                                        ) : null
                                    }
                                </div>
                                <Separator className="last:hidden" />
                            </React.Fragment>
                        )
                    }
                )
            }
        </div>
    )
}
