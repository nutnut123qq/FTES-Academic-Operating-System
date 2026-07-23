"use client"

import React, { useRef } from "react"
import {
    Button,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownPopover,
    DropdownTrigger,
    Typography,
    cn,
} from "@heroui/react"
import {
    CaretDownIcon,
    BookOpenIcon,
    UploadSimpleIcon,
    FileArrowUpIcon,
    WarningCircleIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useQueryMyLearnedLessonsSwr } from "@/hooks/swr/api/graphql/queries/useQueryMyLearnedLessonsSwr"
import { fromGlobalId } from "@/modules/utils/globalId"
import {
    uploadLearningFileToStorage,
    validateLearningFile,
    type LearningFileError,
} from "./upload"

/**
 * Which source a learning tool draws from. Note there is NO free-text mode: the BE
 * learning guard rejects a raw `{text}` body (needs `lessonId` / `storageKey` /
 * `resourceId`), so a document is UPLOADED to a `storageKey` rather than pasted.
 */
export type LearningInputMode = "upload" | "lesson"

/** Controlled value of {@link LearningInput}. */
export interface LearningInputValue {
    /** Active source tab. */
    mode: LearningInputMode
    /** Picked file to upload (used when `mode === "upload"`), or null. */
    file: File | null
    /** Client-side rejection of {@link file}, or null when accepted / none. */
    fileError: LearningFileError | null
    /** Decoded raw lesson id (used when `mode === "lesson"`), or null. */
    lessonId: string | null
    /** Human label of the picked lesson, for display. */
    lessonLabel: string | null
}

/** The empty initial value for a learning tool form. */
export const emptyLearningInput: LearningInputValue = {
    mode: "lesson",
    file: null,
    fileError: null,
    lessonId: null,
    lessonLabel: null,
}

/**
 * Resolves the `{lessonId}` / `{storageKey}` body fragment a learning job submit
 * sends for the current source. Sends `lessonId` when a lesson is picked (BE
 * resolves its `body_md`); otherwise UPLOADS the picked file through the presigned
 * pipeline and sends its `storageKey`. Async because the upload is a network step
 * — the caller runs it inside `job.run` so the upload shares the submit's busy/error
 * state.
 *
 * @throws if called with no valid source (guarded by {@link isLearningInputReady}).
 */
export const resolveLearningInputRef = async (
    value: LearningInputValue,
): Promise<Record<string, string>> => {
    if (value.mode === "lesson") {
        if (!value.lessonId) throw new Error("No lesson selected")
        return { lessonId: value.lessonId }
    }
    if (!value.file || value.fileError) throw new Error("No valid file selected")
    const storageKey = await uploadLearningFileToStorage(value.file)
    return { storageKey }
}

/** Whether the current value is submittable (has a valid file or a picked lesson). */
export const isLearningInputReady = (value: LearningInputValue): boolean =>
    value.mode === "lesson"
        ? !!value.lessonId
        : !!value.file && !value.fileError

/** Props for {@link LearningInput}. */
export interface LearningInputProps {
    /** Controlled value. */
    value: LearningInputValue
    /** Change handler. */
    onChange: (value: LearningInputValue) => void
    /** Disables all controls (while a job runs). */
    isDisabled?: boolean
}

const prettySize = (bytes: number): string => `${(bytes / (1024 * 1024)).toFixed(1)} MB`

/**
 * Shared source input for the learning tools (summary / flashcards / quiz): a two-
 * tab switch between UPLOADING a document (pdf/image → `storageKey`) and picking one
 * of the viewer's recently studied lessons (→ `lessonId`). The BE has no raw-text
 * path, so there is no paste box. The lesson list comes from `myLearnedLessons`
 * (opaque global ids decoded to the raw lesson id the job body needs). When the
 * viewer has no studied lessons the lesson tab explains that and upload stays
 * available.
 */
export const LearningInput = ({ value, onChange, isDisabled }: LearningInputProps) => {
    const t = useTranslations("aiPlatform.toolPages.input")
    const { data: lessons, isLoading } = useQueryMyLearnedLessonsSwr()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const setMode = (mode: LearningInputMode) => onChange({ ...value, mode })

    const acceptFile = (candidate: File | undefined) => {
        if (!candidate) return
        const error = validateLearningFile(candidate)
        onChange({
            ...value,
            file: error ? null : candidate,
            fileError: error,
        })
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="flex gap-2">
                <Button
                    size="sm"
                    variant={value.mode === "upload" ? "primary" : "secondary"}
                    onPress={() => setMode("upload")}
                    isDisabled={isDisabled}
                >
                    <UploadSimpleIcon aria-hidden focusable="false" className="size-4" />
                    {t("modeUpload")}
                </Button>
                <Button
                    size="sm"
                    variant={value.mode === "lesson" ? "primary" : "secondary"}
                    onPress={() => setMode("lesson")}
                    isDisabled={isDisabled}
                >
                    <BookOpenIcon aria-hidden focusable="false" className="size-4" />
                    {t("modeLesson")}
                </Button>
            </div>

            {value.mode === "upload" ? (
                <div className="flex flex-col gap-2">
                    <button
                        type="button"
                        disabled={isDisabled}
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => {
                            event.preventDefault()
                            acceptFile(event.dataTransfer.files?.[0])
                        }}
                        className={cn(
                            "flex flex-col items-center gap-2 rounded-2xl border border-dashed border-default p-8 text-center transition-colors",
                            !isDisabled && "hover:border-accent hover:bg-accent/5",
                        )}
                    >
                        <UploadSimpleIcon aria-hidden focusable="false" className="size-7 text-muted" />
                        <Typography type="body-sm" weight="medium">
                            {t("uploadCta")}
                        </Typography>
                        <Typography type="body-xs" color="muted">
                            {t("uploadHint")}
                        </Typography>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={(event) => acceptFile(event.target.files?.[0])}
                        />
                    </button>

                    {value.fileError ? (
                        <div className="flex items-center gap-2 rounded-2xl border border-danger/40 bg-danger/5 px-4 py-3">
                            <WarningCircleIcon aria-hidden focusable="false" className="size-5 shrink-0 text-danger" />
                            <Typography type="body-sm" color="muted">
                                {t(`uploadError.${value.fileError}`)}
                            </Typography>
                        </div>
                    ) : null}

                    {value.file ? (
                        <div className="flex items-center gap-3 rounded-2xl border border-default bg-surface px-4 py-3">
                            <FileArrowUpIcon aria-hidden focusable="false" className="size-5 shrink-0 text-accent" />
                            <div className="min-w-0 flex-1">
                                <Typography type="body-sm" weight="medium" className="truncate">
                                    {value.file.name}
                                </Typography>
                                <Typography type="body-xs" color="muted">
                                    {prettySize(value.file.size)}
                                </Typography>
                            </div>
                        </div>
                    ) : null}
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    {!isLoading && (lessons?.length ?? 0) === 0 ? (
                        <Typography type="body-sm" color="muted">
                            {t("noLessons")}
                        </Typography>
                    ) : (
                        <Dropdown>
                            <DropdownTrigger
                                isDisabled={isDisabled || isLoading}
                                className={cn(
                                    "cursor-pointer rounded-2xl border border-default px-3 py-2",
                                    "flex items-center justify-between gap-2",
                                )}
                            >
                                <span className="min-w-0 truncate text-sm font-medium">
                                    {value.lessonLabel ?? t("lessonPlaceholder")}
                                </span>
                                <CaretDownIcon aria-hidden focusable="false" className="size-4 shrink-0" />
                            </DropdownTrigger>
                            <DropdownPopover className="min-w-72 max-w-96">
                                <DropdownMenu
                                    aria-label={t("lessonPlaceholder")}
                                    onAction={(key) => {
                                        const globalId = String(key)
                                        const lesson = (lessons ?? []).find((item) => item.globalId === globalId)
                                        if (!lesson) return
                                        onChange({
                                            ...value,
                                            lessonId: fromGlobalId(lesson.globalId)?.id ?? null,
                                            lessonLabel: lesson.label,
                                        })
                                    }}
                                >
                                    {(lessons ?? [])
                                        .filter((lesson) => !!lesson.globalId)
                                        .map((lesson) => (
                                            <DropdownItem
                                                // `id` (not just React `key`) is the collection key
                                                // react-aria hands to `onAction` — a bare `key` is a
                                                // reserved React prop the collection never sees, so the
                                                // picked value would be lost (same picker-id bug family).
                                                key={lesson.globalId}
                                                id={lesson.globalId}
                                                textValue={lesson.label}
                                            >
                                                <span className="line-clamp-2">{lesson.label}</span>
                                            </DropdownItem>
                                        ))}
                                </DropdownMenu>
                            </DropdownPopover>
                        </Dropdown>
                    )}
                </div>
            )}
        </div>
    )
}
