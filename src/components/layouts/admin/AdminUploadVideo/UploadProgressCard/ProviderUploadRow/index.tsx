"use client"

import { CopyIcon } from "@phosphor-icons/react"
import React, {
    useCallback,
} from "react"
import {
    Button,
    Chip,
    ProgressBar,
} from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"
import type {
    ProviderUploadStatus,
} from "../../types"
import {
    UPLOAD_STATUS_ICON_MAP,
    UPLOAD_STATUS_TRACK_CLASS_MAP,
    UPLOAD_STATUS_FILL_CLASS_MAP,
} from "../../map"

/** Props for {@link ProviderUploadRow}. */
export interface ProviderUploadRowProps extends WithClassNames<undefined> {
    /** Per-provider upload status to render. */
    upload: ProviderUploadStatus
    /** Zero-based index of this row, used for the copy button's element id. */
    index: number
    /** Fired with the presigned URL when the copy button is pressed. */
    onCopyUrl: (url: string) => void
}

/**
 * One provider's upload row — name chip, status icon, progress bar, copy
 * button, and any error/url details.
 *
 * Presentational: renders {@link ProviderUploadStatus} and forwards the copy
 * gesture. "use client" for the HeroUI interactive controls.
 * @param props - the upload status, row index, and copy callback
 */
export const ProviderUploadRow = ({
    upload,
    index,
    onCopyUrl,
}: ProviderUploadRowProps) => {
    const onPressCopy = useCallback(
        () => onCopyUrl(upload.url),
        [
            onCopyUrl,
            upload.url,
        ],
    )
    return (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Chip
                        size="sm"
                        variant="secondary"
                        className="bg-indigo-500/10 text-indigo-300 capitalize"
                    >
                        {upload.provider}
                    </Chip>
                    {UPLOAD_STATUS_ICON_MAP[upload.status]}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">
                        {upload.progress}%
                    </span>
                    <Button
                        id={`admin-copy-url-${index}`}
                        size="sm"
                        variant="ghost"
                        isIconOnly
                        onPress={onPressCopy}
                        className="text-slate-400 hover:text-white"
                    >
                        <CopyIcon
                            className="size-4"
                            aria-hidden="true"
                            focusable="false"
                        />
                    </Button>
                </div>
            </div>
            <ProgressBar
                aria-label={`${upload.provider} upload progress`}
                className="w-full"
                maxValue={100}
                minValue={0}
                value={upload.progress}
            >
                <ProgressBar.Track
                    className={UPLOAD_STATUS_TRACK_CLASS_MAP[upload.status]}
                >
                    <ProgressBar.Fill
                        className={UPLOAD_STATUS_FILL_CLASS_MAP[upload.status]}
                    />
                </ProgressBar.Track>
            </ProgressBar>
            {upload.error && (
                <p className="text-xs text-rose-400">
                    Error: {upload.error}
                </p>
            )}
            <p className="text-xs text-slate-600 font-mono break-all">
                {upload.url.substring(0, 120)}…
            </p>
        </div>
    )
}
