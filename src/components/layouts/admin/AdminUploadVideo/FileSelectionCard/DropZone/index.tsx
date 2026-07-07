"use client"

import { UploadSimpleIcon, VideoCameraIcon } from "@phosphor-icons/react"
import React from "react"
import {
    Chip,
} from "@heroui/react"
import {
    formatSize,
} from "../../utils"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link DropZone}. */
export interface DropZoneProps extends WithClassNames<undefined> {
    /** Currently selected file, or null when none is chosen. */
    file: File | null
    /** Ref to the hidden file input, used to open the native picker. */
    fileInputRef: React.RefObject<HTMLInputElement | null>
    /** Fired when the drop zone is clicked (opens the native file picker). */
    onClickZone: () => void
    /** Fired on dragover to allow dropping. */
    onDragOver: (event: React.DragEvent) => void
    /** Fired when a file is dropped onto the zone. */
    onDrop: (event: React.DragEvent) => void
    /** Fired when a file is chosen via the native picker. */
    onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

/**
 * Click/drag-and-drop zone for selecting the video file to upload.
 *
 * Presentational: shows either the chosen file's metadata or an empty prompt,
 * and forwards user gestures via the on* callbacks. "use client" for the DOM
 * drag/drop + click handlers.
 * @param props - selected file, input ref, and gesture callbacks
 */
export const DropZone = ({
    file,
    fileInputRef,
    onClickZone,
    onDragOver,
    onDrop,
    onFileChange,
}: DropZoneProps) => {
    return (
        <div
            id="admin-video-dropzone"
            onClick={onClickZone}
            onDragOver={onDragOver}
            onDrop={onDrop}
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/10 bg-white/[0.02] p-8 transition-all hover:border-indigo-400/40 hover:bg-indigo-500/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
        >
            {file ? (
                <div className="flex flex-col items-center gap-2">
                    <div className="rounded-full bg-emerald-500/10 p-3">
                        <VideoCameraIcon
                            className="size-8 text-emerald-400"
                            aria-hidden="true"
                            focusable="false"
                        />
                    </div>
                    <p className="text-sm font-medium text-white">
                        {file.name}
                    </p>
                    <div className="flex items-center gap-2">
                        <Chip
                            size="sm"
                            variant="secondary"
                            className="bg-white/5 text-slate-300"
                        >
                            {file.type || "unknown"}
                        </Chip>
                        <Chip
                            size="sm"
                            variant="secondary"
                            className="bg-white/5 text-slate-300"
                        >
                            {formatSize(file.size)}
                        </Chip>
                    </div>
                    <p className="text-xs text-slate-500">
                        Click or drag to replace
                    </p>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-3">
                    <div className="rounded-full bg-indigo-500/10 p-3">
                        <UploadSimpleIcon
                            className="size-8 text-indigo-400"
                            aria-hidden="true"
                            focusable="false"
                        />
                    </div>
                    <div className="text-center flex flex-col gap-0">
                        <p className="text-sm font-medium text-white">
                            Click to select or drag & drop
                        </p>
                        <p className="text-xs text-slate-500">
                            MP4, MOV, WebM, AVI — any size
                        </p>
                    </div>
                </div>
            )}
            <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={onFileChange}
                id="admin-video-file-input"
            />
        </div>
    )
}
