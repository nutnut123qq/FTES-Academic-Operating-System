"use client"

import React from "react"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"

/**
 * ConfigSkeleton — loading placeholder for the Config Center PANEL, mirroring
 * its real layout (a toolbar row, then a stack of bordered setting/flag rows
 * with a label pair on the left and a control on the right). The static chrome
 * (breadcrumb, title, scope selector, category nav) stays outside — it renders
 * for real while only the data region shimmers.
 */
export const ConfigSkeleton = () => {
    return (
        <div className="flex flex-col gap-3" aria-hidden>
            <Skeleton className="h-10 w-full max-w-sm rounded-xl" />
            {Array.from({ length: 4 }, (_, index) => (
                <div
                    key={index}
                    className="flex items-center justify-between gap-3 rounded-large border border-separator p-4"
                >
                    <div className="flex w-full max-w-xs flex-col gap-2">
                        <Skeleton.Typography type="body-sm" className="w-40" />
                        <Skeleton.Typography type="body-xs" className="w-56" />
                    </div>
                    <Skeleton className="h-9 w-40 rounded-xl" />
                </div>
            ))}
        </div>
    )
}
