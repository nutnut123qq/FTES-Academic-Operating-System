"use client"

import React from "react"
import type { ReactNode } from "react"
import { Typography, cn } from "@heroui/react"
import { ImageIcon } from "@phosphor-icons/react"
import { useDropzone } from "react-dropzone"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Max image size in bytes (5 MB — mirrors the BE avatar limit). */
const MAX_SIZE = 5 * 1024 * 1024

/** Accepted image MIME types. */
const ACCEPT = {
    "image/png": [],
    "image/jpeg": [],
    "image/webp": [],
    "image/gif": [],
}

/** Why a dropped / picked file was rejected by the baked type/size filter. */
export type ImageDropzoneRejectReason = "invalidType" | "tooLarge"

/** Props for the {@link ImageDropzone} block. */
export interface ImageDropzoneProps extends WithClassNames<undefined> {
    /** Called with the dropped / picked image file (type + size filtered). */
    onFile: (file: File) => void
    /** Called when the picked file fails the baked type/size filter (optional). */
    onReject?: (reason: ImageDropzoneRejectReason) => void
    /** Primary CTA (e.g. "Kéo thả ảnh vào đây, hoặc bấm để chọn"). */
    label: ReactNode
    /** Format/size hint below the CTA (e.g. "PNG, JPG, WEBP, GIF · tối đa 5 MB"). */
    hint?: ReactNode
    /** Override the default {@link ImageIcon} (phosphor `*Icon`). */
    icon?: ReactNode
}

/**
 * Standard file dropzone (react-dropzone) for a single image: a dashed-border area
 * with a centered column — an icon, the CTA label, and a format hint. Accepts one
 * image (png/jpeg/webp/gif, ≤5 MB) by drop OR click; on drag-over the border turns
 * solid accent with a soft tint and the icon/label highlight (clear "drop here"
 * state). Pure/props-only — owns its look; the feature handles the file.
 *
 * @param props - {@link ImageDropzoneProps}
 */
export const ImageDropzone = ({
    onFile,
    onReject,
    label,
    hint,
    icon,
    className,
}: ImageDropzoneProps) => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: ACCEPT,
        maxSize: MAX_SIZE,
        multiple: false,
        onDrop: (accepted, rejections) => {
            const next = accepted[0]
            if (next) {
                onFile(next)
                return
            }
            const code = rejections[0]?.errors[0]?.code
            if (code) {
                onReject?.(code === "file-too-large" ? "tooLarge" : "invalidType")
            }
        },
    })

    return (
        <div
            {...getRootProps()}
            className={cn(
                "flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed border-separator px-6 py-8 text-center transition-colors hover:border-accent",
                isDragActive && "border-solid border-accent bg-accent/10",
                className,
            )}
        >
            <input {...getInputProps()} />
            <span
                aria-hidden
                className={cn("text-muted [&_svg]:size-8", isDragActive && "text-accent")}
            >
                {icon ?? <ImageIcon focusable="false" />}
            </span>
            <Typography
                type="body-sm"
                weight="medium"
                align="center"
                className={cn(isDragActive && "text-accent")}
            >
                {label}
            </Typography>
            {hint ? (
                <Typography type="body-xs" color="muted" align="center">
                    {hint}
                </Typography>
            ) : null}
        </div>
    )
}
