import { CircleCheck as CheckCircleIcon, CircleXmark as XCircleIcon } from "@gravity-ui/icons"
import React from "react"
import {
    Spinner,
} from "@heroui/react"
import {
    UploadStatus,
} from "./enums"

/**
 * Status indicator rendered next to each provider row, keyed by upload state.
 *
 * Idle has no indicator (null); uploading shows a spinner; success/error show
 * their respective icons.
 */
export const UPLOAD_STATUS_ICON_MAP: Record<UploadStatus, React.ReactNode> = {
    [UploadStatus.Idle]: null,
    [UploadStatus.Uploading]: <Spinner size="sm" />,
    [UploadStatus.Success]: <CheckCircleIcon className="h-5 w-5 text-emerald-400" />,
    [UploadStatus.Error]: <XCircleIcon className="h-5 w-5 text-red-400" />,
}

/** Progress-bar track background class, keyed by upload state. */
export const UPLOAD_STATUS_TRACK_CLASS_MAP: Record<UploadStatus, string> = {
    [UploadStatus.Idle]: "bg-white/5",
    [UploadStatus.Uploading]: "bg-white/5",
    [UploadStatus.Success]: "bg-emerald-500/10",
    [UploadStatus.Error]: "bg-red-500/10",
}

/** Progress-bar fill background class, keyed by upload state. */
export const UPLOAD_STATUS_FILL_CLASS_MAP: Record<UploadStatus, string> = {
    [UploadStatus.Idle]: "bg-gradient-to-r from-indigo-500 to-purple-500",
    [UploadStatus.Uploading]: "bg-gradient-to-r from-indigo-500 to-purple-500",
    [UploadStatus.Success]: "bg-emerald-500",
    [UploadStatus.Error]: "bg-red-500",
}
