"use client"

import React, { useRef, useState } from "react"
import { Button, Chip, Input, Tabs, TextField, Typography, cn } from "@heroui/react"
import {
    ClipboardTextIcon,
    FileArrowUpIcon,
    LockSimpleIcon,
    UploadSimpleIcon,
    WarningCircleIcon,
} from "@phosphor-icons/react"
import { useLocale, useTranslations } from "next-intl"
import { ExtendedTabs } from "@/components/blocks/navigation/ExtendedTabs"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import { useRestWithToast } from "@/modules/toast/hooks"
import {
    isSubmissionPending,
    useGetMyAssignmentSubmissionsSwr,
} from "@/hooks/swr/api/rest/queries/useGetMyAssignmentSubmissionsSwr"
import { useGetLessonAssignmentsSwr } from "@/hooks/swr/api/rest/queries/useGetLessonAssignmentsSwr"
import { usePostSubmitAssignmentSwr } from "@/hooks/swr/api/rest/mutations/usePostSubmitAssignmentSwr"
import { usePostSubmitAssignmentFileSwr } from "@/hooks/swr/api/rest/mutations/usePostSubmitAssignmentFileSwr"
import type { AssignmentView, CourseSubmissionView } from "@/modules/api/rest/course"

/** Props for {@link LessonAssignmentBlock}. */
export interface LessonAssignmentBlockProps {
    /** The lesson (route `contentId`) whose assignments to load. */
    lessonId: string
    /** Extra classes on the section root (e.g. the reading-width cap). */
    className?: string
}

/** The two first-class assignment submission methods (contract exercise-submission-methods). */
type SubmitMethod = "github" | "file"

/** Mirror of the BE `@Pattern("^https://.+")` guard on `githubSubmissionUrl`. */
const isHttpsUrl = (value: string): boolean => /^https:\/\/.+/.test(value.trim())

/**
 * Which submission tabs to offer, from the author's `submissionMethod`. Absent /
 * unknown → GitHub only (back-compat: never surface a file tab the BE can't accept).
 */
const parseSubmitMethods = (raw: string | null | undefined): { github: boolean, file: boolean } => {
    switch ((raw ?? "").toUpperCase().trim()) {
    case "BOTH":
        return { github: true, file: true }
    case "FILE":
        return { github: false, file: true }
    case "GITHUB":
    default:
        return { github: true, file: false }
    }
}

/**
 * Parses the author's `fileExtension` whitelist into lowercase dot-prefixed
 * extensions (`"py, zip"` / `".py .zip"` → `[".py", ".zip"]`). Empty → no restriction.
 */
const parseFileExtensions = (raw: string | null | undefined): Array<string> =>
    (raw ?? "")
        .split(/[\s,]+/)
        .map((entry) => entry.trim().toLowerCase())
        .filter((entry) => entry.length > 0)
        .map((entry) => (entry.startsWith(".") ? entry : `.${entry}`))

/** True when the file's name ends with one of the accepted extensions (or none are set). */
const fileMatchesExtensions = (file: File, extensions: Array<string>): boolean =>
    extensions.length === 0 || extensions.some((ext) => file.name.toLowerCase().endsWith(ext))

/**
 * Assignment block for the lesson reader. Loads the lesson's assignments and, when
 * the list is non-empty, renders one card per assignment: the prompt (markdown), the
 * submission surface (a GitHub-URL form and/or a file-upload form per the assignment's
 * `submissionMethod`), and the learner's grading history. Renders nothing while
 * loading / on error / when the lesson has no assignments (the common case), so it
 * never adds empty chrome.
 */
export const LessonAssignmentBlock = ({ lessonId, className }: LessonAssignmentBlockProps) => {
    const t = useTranslations("learn")
    const { data: assignments } = useGetLessonAssignmentsSwr(lessonId)

    // Only surface the block once we have a real, non-empty list — no skeleton on the
    // (majority) lessons that carry no assignment, and silence on a 401/403/empty.
    if (!assignments || assignments.length === 0) {
        return null
    }

    return (
        <section id="lesson-assignments" className={cn("flex flex-col gap-4", className)}>
            <div className="flex items-center gap-2">
                <ClipboardTextIcon aria-hidden focusable="false" className="size-5 text-accent" />
                <Typography type="body" weight="semibold">
                    {t("exercises.assignment.title")}
                </Typography>
            </div>
            <div className="flex flex-col gap-4">
                {assignments.map((assignment) => (
                    <AssignmentCard key={assignment.id} assignment={assignment} />
                ))}
            </div>
        </section>
    )
}

/** One assignment: prompt, submit form(s), submission history. */
const AssignmentCard = ({ assignment }: { assignment: AssignmentView }) => {
    const t = useTranslations("learn")
    const locale = useLocale()
    const runRest = useRestWithToast()
    const submissionsSwr = useGetMyAssignmentSubmissionsSwr(assignment.id)
    const submitUrl = usePostSubmitAssignmentSwr()
    const submitFile = usePostSubmitAssignmentFileSwr()

    const methods = parseSubmitMethods(assignment.submissionMethod)
    const acceptExtensions = parseFileExtensions(assignment.fileExtension)
    const showTabs = methods.github && methods.file

    // The active tab — default to the first allowed method.
    const [method, setMethod] = useState<SubmitMethod>(methods.github ? "github" : "file")

    const [url, setUrl] = useState("")
    const [touched, setTouched] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    /** Set when the picked file's extension is outside the whitelist. */
    const [fileError, setFileError] = useState<"wrongType" | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [dragOver, setDragOver] = useState(false)

    const submissions = submissionsSwr.data ?? []
    const usedCount = submissions.length
    const reachedMax = usedCount >= assignment.maxSubmissions
    const busy = submitUrl.isMutating || submitFile.isMutating

    const invalid = url.trim() !== "" && !isHttpsUrl(url)
    const canSubmitUrl = !reachedMax && isHttpsUrl(url) && !busy
    const canSubmitFile = !reachedMax && file !== null && fileError === null && !busy

    // newest attempt first
    const history = [...submissions].sort((a, b) => b.submissionAttempt - a.submissionAttempt)

    const handleSubmitUrl = async () => {
        setTouched(true)
        // Client-side gate — never fire the request for a non-https URL (spec scenario).
        if (!isHttpsUrl(url) || reachedMax || busy) {
            return
        }
        const ok = await runRest(
            () => submitUrl.trigger({ assignmentId: assignment.id, request: { githubSubmissionUrl: url.trim() } }),
            { successMessage: t("exercises.assignment.submitted") },
        )
        if (ok !== null) {
            setUrl("")
            setTouched(false)
            void submissionsSwr.mutate()
        }
    }

    const selectFile = (candidate: File | undefined) => {
        if (!candidate) return
        if (!fileMatchesExtensions(candidate, acceptExtensions)) {
            setFileError("wrongType")
            setFile(null)
            return
        }
        setFileError(null)
        setFile(candidate)
    }

    const handleSubmitFile = async () => {
        // Client-side gate — no doomed request for a missing / wrong-type file.
        if (!file || fileError !== null || reachedMax || busy) {
            return
        }
        const ok = await runRest(
            () => submitFile.trigger({ assignmentId: assignment.id, file }),
            { successMessage: t("exercises.assignment.submitted") },
        )
        if (ok !== null) {
            setFile(null)
            void submissionsSwr.mutate()
        }
    }

    const githubForm = (
        <div className="flex flex-col gap-2">
            <Typography type="body-sm" weight="medium">
                {t("exercises.assignment.urlLabel")}
            </Typography>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                <TextField variant="secondary" className="w-full" isInvalid={touched && invalid}>
                    <Input
                        variant="secondary"
                        type="url"
                        inputMode="url"
                        value={url}
                        onChange={(event) => setUrl(event.target.value)}
                        onBlur={() => setTouched(true)}
                        placeholder={t("exercises.assignment.urlPlaceholder")}
                        aria-label={t("exercises.assignment.urlLabel")}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                event.preventDefault()
                                void handleSubmitUrl()
                            }
                        }}
                    />
                </TextField>
                <Button
                    variant="primary"
                    className="shrink-0"
                    isPending={submitUrl.isMutating}
                    isDisabled={!canSubmitUrl}
                    onPress={() => void handleSubmitUrl()}
                >
                    {t("exercises.assignment.submit")}
                </Button>
            </div>
            {touched && invalid ? (
                <Typography type="body-xs" className="text-danger">
                    {t("exercises.assignment.urlInvalid")}
                </Typography>
            ) : null}
        </div>
    )

    const fileForm = (
        <div className="flex flex-col gap-3">
            <Typography type="body-sm" weight="medium">
                {t("exercises.assignment.fileLabel")}
            </Typography>
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(event) => {
                    event.preventDefault()
                    setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(event) => {
                    event.preventDefault()
                    setDragOver(false)
                    selectFile(event.dataTransfer.files?.[0])
                }}
                className={cn(
                    "flex flex-col items-center gap-2 rounded-2xl border border-dashed border-default p-8 text-center transition-colors",
                    dragOver && "border-accent bg-accent/5",
                )}
            >
                <UploadSimpleIcon aria-hidden focusable="false" className="size-7 text-muted" />
                <Typography type="body-sm" weight="medium">
                    {t("exercises.assignment.fileCta")}
                </Typography>
                <Typography type="body-xs" color="muted">
                    {acceptExtensions.length > 0
                        ? t("exercises.assignment.fileHint", { extensions: acceptExtensions.join(", ") })
                        : t("exercises.assignment.fileHintAny")}
                </Typography>
            </button>
            {/* Kept OUTSIDE the button — an <input> nested in a <button> is invalid HTML
                (interactive-in-interactive). Reset value after each pick so re-selecting
                the SAME file (the normal resubmission flow) fires a fresh change event. */}
            <input
                ref={fileInputRef}
                type="file"
                accept={acceptExtensions.length > 0 ? acceptExtensions.join(",") : undefined}
                className="hidden"
                aria-label={t("exercises.assignment.fileLabel")}
                onChange={(event) => {
                    selectFile(event.target.files?.[0])
                    event.target.value = ""
                }}
            />

            {fileError ? (
                <div className="flex items-center gap-2 rounded-2xl border border-danger/40 bg-danger/5 px-4 py-3">
                    <WarningCircleIcon aria-hidden focusable="false" className="size-5 shrink-0 text-danger" />
                    <Typography type="body-sm" color="muted">
                        {t("exercises.assignment.fileWrongType", { extensions: acceptExtensions.join(", ") })}
                    </Typography>
                </div>
            ) : null}

            {file ? (
                <div className="flex items-center gap-3 rounded-2xl border border-default bg-surface px-4 py-3">
                    <FileArrowUpIcon aria-hidden focusable="false" className="size-5 shrink-0 text-accent" />
                    <Typography type="body-sm" weight="medium" className="min-w-0 flex-1 truncate">
                        {file.name}
                    </Typography>
                </div>
            ) : null}

            <div>
                <Button
                    variant="primary"
                    isPending={submitFile.isMutating}
                    isDisabled={!canSubmitFile}
                    onPress={() => void handleSubmitFile()}
                >
                    {t("exercises.assignment.submitFile")}
                </Button>
            </div>
        </div>
    )

    return (
        <div className="flex flex-col gap-4 rounded-3xl border border-default bg-surface p-6">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <Typography type="body" weight="semibold" className="min-w-0">
                    {assignment.title}
                </Typography>
                <Chip size="sm" variant="soft" className="shrink-0">
                    {t("exercises.assignment.submissionsCount", {
                        used: usedCount,
                        max: assignment.maxSubmissions,
                    })}
                </Chip>
            </div>

            {assignment.question ? (
                <div className="text-sm">
                    <MarkdownContent reading markdown={assignment.question} />
                </div>
            ) : null}

            {/* submit surface — locked once the learner has used every attempt. Offers the
                allowed method(s): a GitHub-URL form and/or a file upload; both → tabs. */}
            {reachedMax ? (
                <div className="flex items-center gap-2 rounded-2xl border border-default bg-default/40 p-4">
                    <LockSimpleIcon aria-hidden focusable="false" className="size-5 shrink-0 text-muted" />
                    <Typography type="body-sm" color="muted">
                        {t("exercises.assignment.maxReached", { max: assignment.maxSubmissions })}
                    </Typography>
                </div>
            ) : showTabs ? (
                <div className="flex flex-col gap-4">
                    <ExtendedTabs
                        selectedKey={method}
                        onSelectionChange={(key) => setMethod(key as SubmitMethod)}
                    >
                        <Tabs.ListContainer>
                            <Tabs.List aria-label={t("exercises.assignment.methodTabsLabel")}>
                                <Tabs.Tab key="github" id="github">
                                    {t("exercises.assignment.tabGithub")}
                                </Tabs.Tab>
                                <Tabs.Tab key="file" id="file">
                                    {t("exercises.assignment.tabFile")}
                                </Tabs.Tab>
                            </Tabs.List>
                        </Tabs.ListContainer>
                    </ExtendedTabs>
                    {method === "github" ? githubForm : fileForm}
                </div>
            ) : methods.file ? (
                fileForm
            ) : (
                githubForm
            )}

            {/* grading history */}
            {history.length > 0 ? (
                <div className="flex flex-col gap-3 border-t border-default pt-4">
                    <Typography type="body-sm" weight="semibold">
                        {t("exercises.assignment.historyTitle")}
                    </Typography>
                    {history.map((submission) => (
                        <SubmissionRow key={submission.id} submission={submission} locale={locale} />
                    ))}
                </div>
            ) : null}
        </div>
    )
}

/** One row in the grading history — attempt, status, AI score + evaluation. */
const SubmissionRow = ({
    submission,
    locale,
}: {
    submission: CourseSubmissionView
    locale: string
}) => {
    const t = useTranslations("learn")
    const pending = isSubmissionPending(submission)
    const graded = submission.status === "GRADED"
    const failed = submission.status === "FAILED"

    const statusColor = pending ? undefined : graded ? "success" : failed ? "danger" : undefined
    const statusLabel = t(`exercises.assignment.status.${
        pending ? (submission.status === "GRADING" ? "grading" : "submitted") : graded ? "graded" : "failed"
    }`)

    return (
        <div className="flex flex-col gap-2 rounded-2xl border border-default bg-default/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <Typography type="body-sm" weight="medium">
                        {t("exercises.assignment.attemptLine", { number: submission.submissionAttempt })}
                    </Typography>
                    <Chip size="sm" variant="soft" color={statusColor}>
                        {statusLabel}
                    </Chip>
                    {graded && submission.aiScore !== null ? (
                        <Chip size="sm" variant="soft" color="accent">
                            {t("exercises.assignment.aiScore", { score: submission.aiScore })}
                        </Chip>
                    ) : null}
                </div>
                <Typography type="body-xs" color="muted">
                    {new Date(submission.submittedAt).toLocaleString(locale)}
                </Typography>
            </div>
            {pending ? (
                <Typography type="body-xs" color="muted">
                    {t("exercises.assignment.pendingHint")}
                </Typography>
            ) : submission.evaluation ? (
                <Typography type="body-sm" color="muted" className="whitespace-pre-wrap">
                    {submission.evaluation}
                </Typography>
            ) : null}
        </div>
    )
}
