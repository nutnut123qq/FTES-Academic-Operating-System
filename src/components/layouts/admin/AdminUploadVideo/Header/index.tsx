"use client"

import { Video as VideoIcon } from "@gravity-ui/icons"
import React from "react"
import {
    cn,
} from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"


/** Props for {@link AdminUploadVideoHeader}. */
export type AdminUploadVideoHeaderProps = WithClassNames<undefined>

/**
 * Page header for the admin video upload tool — badge + title + subtitle.
 *
 * Presentational (render-only). "use client" only to stay within the upload
 * tool's client boundary; no browser APIs of its own.
 * @param props - optional className forwarded to the wrapper div
 */
export const AdminUploadVideoHeader = ({
    className,
}: AdminUploadVideoHeaderProps = {}) => {
    return (
        <div className={cn("text-center space-y-1.5 pb-2", className)}>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold tracking-wider text-indigo-300 uppercase">
                <VideoIcon className="h-3.5 w-3.5" />
                Admin Tools
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-indigo-200 to-purple-300 bg-clip-text text-transparent">
                Video Upload
            </h1>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
                Upload videos via S3 presigned URLs. Files are sent directly to storage providers.
            </p>
        </div>
    )
}
