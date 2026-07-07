"use client"

import { CheckCircleIcon, UploadSimpleIcon } from "@phosphor-icons/react"
import React from "react"
import {
    Card,
    Chip,
} from "@heroui/react"
import type {
    ProviderUploadStatus,
} from "../types"
import type { WithClassNames } from "@/modules/types/base/class-name"
import {
    ProviderUploadRow,
} from "./ProviderUploadRow"

/** Props for {@link UploadProgressCard}. */
export interface UploadProgressCardProps extends WithClassNames<undefined> {
    /** Per-provider upload statuses to render. */
    uploads: Array<ProviderUploadStatus>
    /** Whether all uploads have finished (drives the header copy + Done chip). */
    uploadDone: boolean
    /** Fired with the presigned URL when a row's copy button is pressed. */
    onCopyUrl: (url: string) => void
}

/**
 * Card listing per-provider upload progress rows.
 *
 * Presentational: maps uploads → {@link ProviderUploadRow}. "use client" only
 * to stay within the upload tool's client boundary.
 * @param props - uploads, completion flag, and copy callback
 */
export const UploadProgressCard = ({
    uploads,
    uploadDone,
    onCopyUrl,
}: UploadProgressCardProps) => {
    return (
        <Card className="bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl shadow-indigo-500/5">
            <Card.Content className="flex flex-col gap-6 p-6">
                {/* Section header */}
                <div className="flex items-center gap-2 pb-2">
                    <div className="rounded-xl bg-purple-500/10 p-2">
                        <UploadSimpleIcon
                            className="size-5 text-purple-400"
                            aria-hidden="true"
                            focusable="false"
                        />
                    </div>
                    <div className="flex-1 flex flex-col gap-0">
                        <h2 className="text-base font-semibold text-white">
                            Upload Progress
                        </h2>
                        <p className="text-xs text-slate-400">
                            {uploadDone
                                ? "All uploads completed"
                                : "Uploading to storage providers…"}
                        </p>
                    </div>
                    {uploadDone && (
                        <Chip
                            size="sm"
                            color="success"
                            variant="secondary"
                        >
                            <CheckCircleIcon
                                className="size-3"
                                aria-hidden="true"
                                focusable="false"
                            />
                            <Chip.Label>Done</Chip.Label>
                        </Chip>
                    )}
                </div>

                {uploads.map((upload, idx) => (
                    <ProviderUploadRow
                        key={upload.provider}
                        upload={upload}
                        index={idx}
                        onCopyUrl={onCopyUrl}
                    />
                ))}
            </Card.Content>
        </Card>
    )
}
