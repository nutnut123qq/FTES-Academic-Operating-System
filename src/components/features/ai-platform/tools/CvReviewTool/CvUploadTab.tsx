"use client"

import React, { useRef, useState } from "react"
import { Button, Typography, cn } from "@heroui/react"
import { UploadSimpleIcon, FileArrowUpIcon, WarningCircleIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import {
    uploadCvFileToStorage,
    validateCvFile,
    type CvFileError,
} from "./upload"

/** Props for {@link CvUploadTab}. */
export interface CvUploadTabProps {
    /** Submit a review of an uploaded file by its storage key. */
    onReview: (storageKey: string) => void
    /** True while a review job is submitting/running (disables the review button). */
    isReviewBusy: boolean
}

const prettySize = (bytes: number): string => `${(bytes / (1024 * 1024)).toFixed(1)} MB`

/**
 * The "upload file" source for CV review: pick a pdf/docx, validate it client-side
 * (type + ≤ 10MB — a wrong file never starts an upload), then on review push it
 * through the presigned pipeline and submit `{storageKey}` to the job.
 */
export const CvUploadTab = ({ onReview, isReviewBusy }: CvUploadTabProps) => {
    const t = useTranslations("aiPlatform.toolPages.cvReview")
    const inputRef = useRef<HTMLInputElement>(null)
    const [file, setFile] = useState<File | null>(null)
    const [fileError, setFileError] = useState<CvFileError | null>(null)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [dragOver, setDragOver] = useState(false)

    const accept = (candidate: File | undefined) => {
        if (!candidate) return
        setUploadError(null)
        const error = validateCvFile(candidate)
        if (error) {
            setFileError(error)
            setFile(null)
            return
        }
        setFileError(null)
        setFile(candidate)
    }

    const handleReview = async () => {
        if (!file) return
        setIsUploading(true)
        setUploadError(null)
        try {
            const storageKey = await uploadCvFileToStorage(file)
            onReview(storageKey)
        } catch (error) {
            setUploadError(error instanceof Error ? error.message : String(error))
        } finally {
            setIsUploading(false)
        }
    }

    const busy = isUploading || isReviewBusy

    return (
        <div className="flex flex-col gap-4">
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragOver={(event) => {
                    event.preventDefault()
                    setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(event) => {
                    event.preventDefault()
                    setDragOver(false)
                    accept(event.dataTransfer.files?.[0])
                }}
                className={cn(
                    "flex flex-col items-center gap-3 rounded-2xl border border-dashed border-default p-10 text-center transition-colors",
                    dragOver && "border-accent bg-accent/5",
                )}
            >
                <UploadSimpleIcon aria-hidden focusable="false" className="size-8 text-muted" />
                <Typography type="body-sm" weight="medium">
                    {t("uploadCta")}
                </Typography>
                <Typography type="body-xs" color="muted">
                    {t("uploadHint")}
                </Typography>
                <input
                    ref={inputRef}
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    onChange={(event) => accept(event.target.files?.[0])}
                />
            </button>

            {fileError ? (
                <div className="flex items-center gap-2 rounded-2xl border border-danger/40 bg-danger/5 px-4 py-3">
                    <WarningCircleIcon aria-hidden focusable="false" className="size-5 shrink-0 text-danger" />
                    <Typography type="body-sm" color="muted">
                        {t(`uploadError.${fileError}`)}
                    </Typography>
                </div>
            ) : null}

            {file ? (
                <div className="flex items-center gap-3 rounded-2xl border border-default bg-surface px-4 py-3">
                    <FileArrowUpIcon aria-hidden focusable="false" className="size-5 shrink-0 text-accent" />
                    <div className="min-w-0 flex-1">
                        <Typography type="body-sm" weight="medium" className="truncate">
                            {file.name}
                        </Typography>
                        <Typography type="body-xs" color="muted">
                            {prettySize(file.size)}
                        </Typography>
                    </div>
                </div>
            ) : null}

            {uploadError ? (
                <Typography type="body-sm" className="text-danger">
                    {uploadError}
                </Typography>
            ) : null}

            <Button
                variant="primary"
                className="self-start"
                onPress={handleReview}
                isDisabled={!file || busy}
                isPending={busy}
            >
                {t("reviewUpload")}
            </Button>
        </div>
    )
}
