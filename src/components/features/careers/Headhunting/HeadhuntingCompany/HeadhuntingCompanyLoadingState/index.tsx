"use client"

import React from "react"
import { Skeleton } from "@heroui/react"

/**
 * Skeleton placeholder shown while the headhunting companies list loads —
 * mirrors the company title + profile block of the detail page.
 */
export const HeadhuntingCompanyLoadingState = () => (
    <div className="flex flex-col gap-4 p-3">
        <Skeleton className="h-8 w-2/3 rounded-lg" />
        <Skeleton className="h-24 w-full rounded-2xl" />
    </div>
)
