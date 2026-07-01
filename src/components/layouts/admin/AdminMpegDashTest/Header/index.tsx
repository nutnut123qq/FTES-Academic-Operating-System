"use client"

import { ArrowLeft as ArrowLeftIcon } from "@gravity-ui/icons"
import React, { useCallback } from "react"
import { Button, cn } from "@heroui/react"
import { useRouter } from "next/navigation"
import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Page header for the video renderer test tool: back button + title.
 *
 * Self-contained section (single-use): owns its own back-navigation handler via
 * the router, so the container renders `<AdminMpegDashTestHeader />` with no props.
 */
export const AdminMpegDashTestHeader = ({ className }: WithClassNames<undefined>) => {
    const router = useRouter()

    /** Navigate back to the admin dashboard. */
    const onBack = useCallback(
        () => router.push("/admin"),
        [router],
    )

    return (
        <div className={cn("flex items-center gap-3", className)}>
            <Button
                id="admin-mpegdash-back"
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-white"
                onPress={onBack}
            >
                <ArrowLeftIcon className="h-5 w-5 mr-1" />
            Back
            </Button>
            <div>
                <h1 className="text-2xl font-bold text-white">
                Video Renderer Test
                </h1>
                <p className="text-sm text-slate-400">
                Enter a URL and select a renderer type to preview
                </p>
            </div>
        </div>
    )
}
