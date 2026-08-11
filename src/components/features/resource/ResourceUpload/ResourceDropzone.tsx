"use client"

import React, { useCallback, useRef, useState } from "react"
import { Button, Typography, cn } from "@heroui/react"
import { FileArrowUpIcon, FileIcon, XIcon } from "@phosphor-icons/react"

import { formatFileSize } from "./uploadRules"

/** Props of {@link ResourceDropzone}. */
export interface ResourceDropzoneProps {
    /** Currently picked file, or `null` when empty. */
    file: File | null
    /** Called with the picked file, or `null` when the user clears it. */
    onSelect: (file: File | null) => void
    /** `accept` attribute for the hidden input — derived from the chosen type. */
    accept: string
    /** Prompt shown when empty (e.g. "Kéo thả tệp hoặc bấm để chọn"). */
    label: string
    /** Secondary line listing the accepted extensions + max size. */
    hint: string
    /** Label of the clear button (icon-only, used as its accessible name). */
    clearLabel: string
    /** Validation message rendered under the zone; `null` when the file is fine. */
    error?: string | null
    /** Locks the zone while the publish chain runs. */
    isDisabled?: boolean
}

/**
 * File dropzone: a hidden `<input type="file">` driven by click, keyboard (Enter /
 * Space) and drag-and-drop.
 *
 * Only the FIRST dropped file is taken — the BE creates one version per upload, so a
 * multi-file drop would silently discard the rest. `dragOver` must call
 * `preventDefault()` on every event or the browser navigates to the dropped file
 * instead of handing it to the handler.
 */
export const ResourceDropzone = ({
    file,
    onSelect,
    accept,
    label,
    hint,
    clearLabel,
    error,
    isDisabled = false,
}: ResourceDropzoneProps) => {
    const inputRef = useRef<HTMLInputElement>(null)
    const [isDragging, setIsDragging] = useState(false)

    const openPicker = useCallback(() => {
        if (isDisabled) {
            return
        }
        inputRef.current?.click()
    }, [isDisabled])

    const handleFiles = useCallback(
        (files: FileList | null) => {
            const picked = files?.item(0) ?? null
            if (picked) {
                onSelect(picked)
            }
        },
        [onSelect],
    )

    const handleDrop = useCallback(
        (event: React.DragEvent<HTMLDivElement>) => {
            event.preventDefault()
            setIsDragging(false)
            if (isDisabled) {
                return
            }
            handleFiles(event.dataTransfer?.files ?? null)
        },
        [handleFiles, isDisabled],
    )

    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLDivElement>) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault()
                openPicker()
            }
        },
        [openPicker],
    )

    return (
        <div className="flex w-full flex-col gap-2">
            <div
                role="button"
                tabIndex={isDisabled ? -1 : 0}
                aria-disabled={isDisabled}
                aria-label={label}
                onClick={openPicker}
                onKeyDown={handleKeyDown}
                onDragOver={(event) => {
                    event.preventDefault()
                    if (!isDisabled) {
                        setIsDragging(true)
                    }
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={cn(
                    "flex min-h-32 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-4 py-6 text-center transition-colors outline-none",
                    isDragging
                        ? "border-accent bg-accent/10"
                        : "border-separator bg-default/40",
                    error ? "border-danger" : "",
                    isDisabled
                        ? "cursor-not-allowed opacity-60"
                        : "cursor-pointer hover:border-accent focus-visible:border-accent",
                )}
            >
                {file ? (
                    <div className="flex w-full items-center justify-center gap-3">
                        <FileIcon aria-hidden focusable="false" className="size-6 shrink-0" />
                        <div className="flex min-w-0 flex-col items-start">
                            <Typography type="body-sm" weight="medium" className="truncate">
                                {file.name}
                            </Typography>
                            <Typography type="body-xs" color="muted">
                                {formatFileSize(file.size)}
                            </Typography>
                        </div>
                        {/* the click must NOT bubble to the zone (which reopens the picker) */}
                        <span
                            onClick={(event) => event.stopPropagation()}
                            onKeyDown={(event) => event.stopPropagation()}
                        >
                            <Button
                                variant="tertiary"
                                size="sm"
                                isIconOnly
                                aria-label={clearLabel}
                                isDisabled={isDisabled}
                                onPress={() => {
                                    if (inputRef.current) {
                                        inputRef.current.value = ""
                                    }
                                    onSelect(null)
                                }}
                            >
                                <XIcon aria-hidden focusable="false" className="size-4" />
                            </Button>
                        </span>
                    </div>
                ) : (
                    <>
                        <FileArrowUpIcon aria-hidden focusable="false" className="size-8" />
                        <Typography type="body-sm" weight="medium">
                            {label}
                        </Typography>
                        <Typography type="body-xs" color="muted">
                            {hint}
                        </Typography>
                    </>
                )}

                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    disabled={isDisabled}
                    className="sr-only"
                    data-testid="resource-upload-input"
                    onChange={(event) => {
                        handleFiles(event.target.files)
                        // Reset so re-picking the SAME file still fires `change`.
                        event.target.value = ""
                    }}
                />
            </div>

            {error ? (
                <Typography type="body-xs" className="text-danger" role="alert">
                    {error}
                </Typography>
            ) : null}
        </div>
    )
}
