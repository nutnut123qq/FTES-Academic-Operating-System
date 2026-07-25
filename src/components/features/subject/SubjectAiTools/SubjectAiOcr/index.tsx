"use client"

import React from "react"
import { Button, Chip, Spinner, Typography, cn, toast } from "@heroui/react"
import {
    CopyIcon,
    FileArrowUpIcon,
    UploadSimpleIcon,
    WarningCircleIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"

import { EmptyContent } from "@/components/blocks/async/EmptyContent"
import { ErrorContent } from "@/components/blocks/async/ErrorContent"
import { useRequireAuth } from "@/hooks/useRequireAuth"

import {
    useMutateSubjectAiOcrSwr,
    validateLearningFile,
    type LearningFileError,
} from "../../hooks/useMutateSubjectAiOcrSwr"
import { ToolSurfaceHeader } from "../ToolSurfaceHeader"

/** Props for {@link SubjectAiOcr}. */
export interface SubjectAiOcrProps {
    subjectId?: string
    /** Subject code — part of the hub's shared tool-surface prop shape. */
    subjectCode?: string
    /** Back to the hub. */
    onBack: () => void
}

/** Human size label for the picked file. */
const prettySize = (bytes: number): string => `${(bytes / (1024 * 1024)).toFixed(1)} MB`

/**
 * OCR tool surface — the one AI tool that reads an UPLOADED file rather than a
 * subject resource.
 *
 * `POST /ai/learning/ocr` accepts only a `storageKey` the caller owns, so a picked
 * image/PDF goes through the platform presigned pipeline first, then the job is
 * submitted and polled like every other tool. If the environment has no object
 * store wired, the presign/PUT failure lands in the surface's normal error state
 * (an honest "couldn't upload", not a silent hang).
 */
export const SubjectAiOcr = ({ onBack }: SubjectAiOcrProps) => {
    const t = useTranslations()
    const { guard } = useRequireAuth()
    const headingRef = React.useRef<HTMLHeadingElement>(null)
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const ocr = useMutateSubjectAiOcrSwr()

    const [file, setFile] = React.useState<File | null>(null)
    const [fileError, setFileError] = React.useState<LearningFileError | null>(null)

    React.useEffect(() => {
        headingRef.current?.focus()
    }, [])

    /** Client-side gate first: a wrong type/size never starts an upload. */
    const acceptFile = (candidate: File | undefined) => {
        if (!candidate) return
        const error = validateLearningFile(candidate)
        setFile(error ? null : candidate)
        setFileError(error)
    }

    const run = guard(() => {
        if (!file || fileError || ocr.isBusy) return
        ocr.run(file)
    })

    /** Back to the picker for another file. */
    const pickAnother = () => {
        setFile(null)
        setFileError(null)
        ocr.reset()
    }

    const copy = async () => {
        if (!ocr.data) return
        await navigator.clipboard.writeText(ocr.data.text)
        toast.success(t("subjects.aiTools.ocr.copied"))
    }

    // A job that COMPLETED with no recognized text is not an error — say so plainly.
    const isEmptyResult = ocr.raw.poll.isComplete && !ocr.data

    return (
        <div className="flex flex-col gap-6 p-6">
            <ToolSurfaceHeader
                title={t("subjects.aiTools.tools.ocr.title")}
                onBack={onBack}
                backLabel={t("common.back")}
                headingRef={headingRef}
            />

            {!ocr.data ? (
                <div className="flex flex-col gap-3">
                    <button
                        type="button"
                        disabled={ocr.isBusy}
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => {
                            event.preventDefault()
                            acceptFile(event.dataTransfer.files?.[0])
                        }}
                        className={cn(
                            "flex flex-col items-center gap-2 rounded-2xl border border-dashed border-default p-8 text-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-focus",
                            !ocr.isBusy && "hover:border-accent hover:bg-accent/5",
                        )}
                    >
                        <UploadSimpleIcon
                            aria-hidden
                            focusable="false"
                            className="size-7 text-muted"
                        />
                        <Typography type="body-sm" weight="medium">
                            {t("subjects.aiTools.ocr.pick")}
                        </Typography>
                        <Typography type="body-xs" color="muted">
                            {t("subjects.aiTools.ocr.hint")}
                        </Typography>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={(event) => acceptFile(event.target.files?.[0])}
                        />
                    </button>

                    {fileError ? (
                        <div className="flex items-center gap-2 rounded-2xl border border-danger/40 bg-danger/5 px-4 py-3">
                            <WarningCircleIcon
                                aria-hidden
                                focusable="false"
                                className="size-5 shrink-0 text-danger"
                            />
                            <Typography type="body-sm" color="muted">
                                {t(`subjects.aiTools.ocr.fileError.${fileError}`)}
                            </Typography>
                        </div>
                    ) : null}

                    {file ? (
                        <div className="flex items-center gap-3 rounded-2xl border border-default bg-surface px-4 py-3">
                            <FileArrowUpIcon
                                aria-hidden
                                focusable="false"
                                className="size-5 shrink-0 text-accent"
                            />
                            <div className="min-w-0 flex-1">
                                <Typography
                                    type="body-sm"
                                    weight="medium"
                                    className="truncate"
                                >
                                    {file.name}
                                </Typography>
                                <Typography type="body-xs" color="muted">
                                    {prettySize(file.size)}
                                </Typography>
                            </div>
                        </div>
                    ) : null}

                    <Button
                        variant="primary"
                        className="self-start"
                        isDisabled={!file || !!fileError || ocr.isBusy}
                        isPending={ocr.isBusy}
                        onPress={run}
                    >
                        {ocr.isBusy
                            ? t("subjects.aiTools.job.working")
                            : t("subjects.aiTools.ocr.run")}
                    </Button>

                    {ocr.isBusy ? (
                        <div className="flex flex-col items-center gap-3 rounded-2xl border border-separator p-8 text-center">
                            <Spinner size="lg" />
                            <Typography type="body-sm" color="muted">
                                {t("subjects.aiTools.job.running")}
                            </Typography>
                            {ocr.isStale ? (
                                <div className="flex flex-col items-center gap-2">
                                    <Typography type="body-xs" color="muted">
                                        {t("subjects.aiTools.job.stale")}
                                    </Typography>
                                    <Button
                                        size="sm"
                                        variant="tertiary"
                                        onPress={() => ocr.refresh()}
                                    >
                                        {t("subjects.aiTools.job.refresh")}
                                    </Button>
                                </div>
                            ) : null}
                        </div>
                    ) : ocr.errorKey ? (
                        <ErrorContent
                            title={t(`subjects.aiTools.job.${ocr.errorKey}`)}
                            description={
                                ocr.failureMessage ?? t("subjects.aiTools.errorRetryHint")
                            }
                            onRetry={run}
                            retryLabel={t("subjects.aiTools.retry")}
                        />
                    ) : isEmptyResult ? (
                        <EmptyContent
                            title={t("subjects.aiTools.ocr.emptyTitle")}
                            description={t("subjects.aiTools.ocr.emptyDesc")}
                            onRetry={pickAnother}
                            retryLabel={t("subjects.aiTools.ocr.again")}
                        />
                    ) : null}
                </div>
            ) : (
                <div className="flex flex-col gap-3 rounded-2xl border border-separator p-4">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                            <Typography type="body" weight="medium">
                                {t("subjects.aiTools.ocr.resultTitle")}
                            </Typography>
                            {ocr.data.pageCount ? (
                                <Chip size="sm" variant="soft" color="default">
                                    {t("subjects.aiTools.ocr.pages", {
                                        count: ocr.data.pageCount,
                                    })}
                                </Chip>
                            ) : null}
                        </div>
                        <Button
                            size="sm"
                            variant="tertiary"
                            isIconOnly
                            aria-label={t("subjects.aiTools.ocr.copy")}
                            onPress={copy}
                        >
                            <CopyIcon className="size-5" aria-hidden focusable="false" />
                        </Button>
                    </div>

                    <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-default/40 p-3 text-sm">
                        {ocr.data.text}
                    </pre>

                    {ocr.data.model ? (
                        <Typography type="body-xs" color="muted">
                            {t("subjects.aiTools.job.model", { model: ocr.data.model })}
                        </Typography>
                    ) : null}

                    <Button variant="secondary" className="self-start" onPress={pickAnother}>
                        {t("subjects.aiTools.ocr.again")}
                    </Button>
                </div>
            )}
        </div>
    )
}
