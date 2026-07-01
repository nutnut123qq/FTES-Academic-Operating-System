"use client"

import { CloudArrowUpIn as CloudArrowUpIcon } from "@gravity-ui/icons"
import React, { useCallback } from "react"
import { cn } from "@heroui/react"
import { useDropzone } from "react-dropzone"
import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Props for Dropzone component.
 */
export interface DropzoneProps extends WithClassNames<undefined> {
    /** Helper text shown below dropzone area. */
    hint: string
    /** Current selected file. */
    file: File | null
    /** Validation error text to render below hint. */
    errorMessage?: string
    /** Accepted mime types for uploaded file. */
    acceptedMimeTypes: Array<string>
    /** Maximum file size in bytes. */
    maxSizeInBytes: number
    /** Callback fired when file changes. */
    onChange: (file: File | null) => void
    /** Callback fired when dropzone loses focus. */
    onBlur?: () => void
}

/**
 * Dropzone file input with drag and drop interaction.
 * @param {DropzoneProps} props Dropzone display and validation props.
 */
export const Dropzone = ({
    hint,
    file,
    errorMessage,
    acceptedMimeTypes,
    maxSizeInBytes,
    onChange,
    onBlur,
    className,
}: DropzoneProps) => {
    const onDrop = useCallback((acceptedFiles: Array<File>) => {
        onChange(acceptedFiles[0] ?? null)
    }, [onChange])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        onFileDialogCancel: () => onBlur?.(),
        accept: acceptedMimeTypes.reduce<Record<string, Array<string>>>((result, type) => {
            result[type] = []
            return result
        }, {}),
        maxSize: maxSizeInBytes,
        multiple: false,
    })

    return (
        <div className={cn("flex flex-col gap-1.5", className)}>
            <div
                {...getRootProps()}
                className={cn(
                    "cursor-pointer rounded-large border border-dashed  bg-surface border-2 rounded-3xl p-2 transition-colors",
                    isDragActive ? "border-accent bg-accent/10" : "",
                    errorMessage ? "border-danger" : "",
                )}
            >
                <input {...getInputProps({ onBlur })} />
                <div className="flex flex-col items-center gap-1.5 text-center">
                    <CloudArrowUpIcon className="size-6 text-muted" />
                    <div className="text-sm">
                        {file?.name ?? hint}
                    </div>
                </div>
            </div>
            {errorMessage ? (
                <div className="text-sm text-danger">{errorMessage}</div>
            ) : null}
        </div>
    )
}
