"use client"

import { FilmSlateIcon, GearIcon, LinkSimpleIcon, UploadSimpleIcon } from "@phosphor-icons/react"
import React, {
    useCallback,
} from "react"
import {
    Button,
    Card,
    Input,
    Label,
    TextField,
} from "@heroui/react"
import type {
    ProcessResult,
} from "../types"
import type { WithClassNames } from "@/modules/types/base/class-name"
import {
    DropZone,
} from "./DropZone"
import {
    ProcessResultBanner,
} from "./ProcessResultBanner"

/** Props for {@link FileSelectionCard}. */
export interface FileSelectionCardProps extends WithClassNames<undefined> {
    /** Currently selected file, or null when none is chosen. */
    file: File | null
    /** Ref to the hidden file input, used to open the native picker. */
    fileInputRef: React.RefObject<HTMLInputElement | null>
    /** Current S3 object key (path) value. */
    objectKey: string
    /** Whether the presigned-URL request is in flight. */
    isRequesting: boolean
    /** Whether any provider upload is currently in progress. */
    isUploading: boolean
    /** Whether the upload step has completed (enables processing). */
    uploadDone: boolean
    /** Whether the process-video request is in flight. */
    isProcessing: boolean
    /** Latest process-video result, or null when none yet. */
    processResult: ProcessResult | null
    /** Fired when the drop zone is clicked (opens the native picker). */
    onClickZone: () => void
    /** Fired on dragover to allow dropping. */
    onDragOver: (event: React.DragEvent) => void
    /** Fired when a file is dropped onto the zone. */
    onDrop: (event: React.DragEvent) => void
    /** Fired when a file is chosen via the native picker. */
    onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void
    /** Fired with the new object-key value when the input changes. */
    onChangeObjectKey: (value: string) => void
    /** Fired to start the full upload flow. */
    onUpload: () => void
    /** Fired to start (or re-run) backend video processing. */
    onProcess: () => void
}

/**
 * Card grouping file selection, the object-key input, the upload/process
 * actions, and the process result.
 *
 * Presentational: composes {@link DropZone} + {@link ProcessResultBanner} and
 * forwards all gestures via on* callbacks. "use client" for the HeroUI
 * interactive controls.
 * @param props - file/upload state and the action callbacks
 */
export const FileSelectionCard = ({
    file,
    fileInputRef,
    objectKey,
    isRequesting,
    isUploading,
    uploadDone,
    isProcessing,
    processResult,
    onClickZone,
    onDragOver,
    onDrop,
    onFileChange,
    onChangeObjectKey,
    onUpload,
    onProcess,
}: FileSelectionCardProps) => {
    /** Forward the object-key input value up to the parent. */
    const onObjectKeyInputChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => onChangeObjectKey(event.target.value),
        [
            onChangeObjectKey,
        ],
    )
    return (
        <Card className="bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl shadow-indigo-500/5">
            <Card.Content className="flex flex-col gap-6 p-6">
                {/* Section header */}
                <div className="flex items-center gap-2 pb-2">
                    <div className="rounded-xl bg-indigo-500/10 p-2">
                        <FilmSlateIcon
                            className="size-5 text-indigo-400"
                            aria-hidden="true"
                            focusable="false"
                        />
                    </div>
                    <div className="flex flex-col gap-0">
                        <h2 className="text-base font-semibold text-white">
                            Video File
                        </h2>
                        <p className="text-xs text-slate-400">
                            Select and configure the file to upload
                        </p>
                    </div>
                </div>

                <DropZone
                    file={file}
                    fileInputRef={fileInputRef}
                    onClickZone={onClickZone}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                    onFileChange={onFileChange}
                />

                {/* Object Key Input */}
                <TextField variant="secondary">
                    <Label htmlFor="admin-object-key-input" className="text-sm text-slate-300">
                        Object Key (S3 Path)
                    </Label>
                    <div className="relative">
                        <LinkSimpleIcon
                            className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400 pointer-events-none"
                            aria-hidden="true"
                            focusable="false"
                        />
                        <Input
                            id="admin-object-key-input"
                            placeholder="videos/my-lecture.mp4"
                            className="pl-9 bg-white/5 border-white/10 hover:border-indigo-400/40 text-white placeholder:text-slate-500"
                            value={objectKey}
                            onChange={onObjectKeyInputChange}
                        />
                    </div>
                </TextField>

                {/* Action Buttons */}
                <div className="flex gap-3">

                    <Button
                        id="admin-upload-button"
                        variant="primary"
                        size="lg"
                        className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 font-semibold shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:scale-[1.01]"
                        onPress={onUpload}
                        isDisabled={
                            !file || !objectKey || isUploading
                        }
                        isPending={isRequesting}
                    >
                        {({isPending}) => (
                            <>
                                {!isPending && (
                                    <UploadSimpleIcon
                                        className="size-5"
                                        aria-hidden="true"
                                        focusable="false"
                                    />
                                )}
                                {isPending
                                    ? "Getting URLs…"
                                    : isUploading
                                        ? "Uploading…"
                                        : "Upload"}
                            </>
                        )}
                    </Button>
                    <Button
                        id="admin-process-button"
                        variant="primary"
                        size="lg"
                        className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 font-semibold shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40 hover:scale-[1.01]"
                        onPress={onProcess}
                        isDisabled={!uploadDone || isProcessing}
                        isPending={isProcessing}
                    >
                        {({isPending}) => (
                            <>
                                {!isPending && (
                                    <GearIcon
                                        className="size-5"
                                        aria-hidden="true"
                                        focusable="false"
                                    />
                                )}
                                {isPending
                                    ? "Processing…"
                                    : processResult
                                        ? "Re-process"
                                        : "Process Video"}
                            </>
                        )}
                    </Button>
                </div>

                <ProcessResultBanner processResult={processResult} />
            </Card.Content>
        </Card>
    )
}
