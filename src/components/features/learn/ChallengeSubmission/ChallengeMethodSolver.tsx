"use client"

import React, { useRef, useState } from "react"
import { Button, Input, Spinner, Tabs, TextField, Typography, cn } from "@heroui/react"
import {
    CodeIcon,
    FileArrowUpIcon,
    FileZipIcon,
    FolderIcon,
    GithubLogoIcon,
    LockSimpleIcon,
    UploadSimpleIcon,
    WarningCircleIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { ExtendedTabs } from "@/components/blocks/navigation/ExtendedTabs"
import { AiModelPicker } from "@/components/reuseable/AiModelPicker"
import { RestError } from "@/modules/api/rest/client"
import type { SubmissionView } from "@/modules/api/rest/challenges"
import { useRestWithToast } from "@/modules/toast/hooks"
import { useGetAiCatalogModelsSwr } from "@/hooks/swr/api/rest/queries"
import { usePostSubmitChallengeSwr } from "@/hooks/swr/api/rest/mutations/usePostSubmitChallengeSwr"
import { usePostSubmitChallengeFileSwr } from "@/hooks/swr/api/rest/mutations/usePostSubmitChallengeFileSwr"
import { GradeCodePanel } from "@/components/features/challenge/ChallengeView/GradeCodePanel"
import type { ChallengeDetail } from "@/components/features/challenge/hooks/useQueryChallengeSwr"
import {
    fileMatchesExtensions,
    isHttpsUrl,
    parseFileExtensions,
    parseGradingConfigFileExtension,
    parseSubmitMethods,
    runnableLanguageFromFileExtension,
    type SubmitMethod,
} from "@/components/features/learn/submissionMethods"
import { ProjectTreePreview } from "./ProjectTreePreview"
import {
    prepareFolderProject,
    prepareZipProject,
    ProjectArchiveError,
    type PreparedProject,
    type ProjectArchiveErrorKind,
} from "./projectArchive"

/** The solver's tab keys — the two author methods plus the in-browser code sandbox. */
type SolverTab = SubmitMethod | "sandbox"

/** i18n key for each tab's label (used for the visible label + the a11y `aria-label`). */
const TAB_LABEL_KEY: Record<SolverTab, string> = {
    github: "exercises.assignment.tabGithub",
    file: "exercises.assignment.tabFile",
    sandbox: "exercises.assignment.tabSandbox",
}

/**
 * Per-learner-per-challenge cap on the HEAVY project grade — a `FILE` (zip) or `URL`
 * (github) submission routed to the agentic `/grade-project`. Mirrors the BE
 * `PROJECT_GRADE_LIMIT` enforced at submit time (rejecting with `PROJECT_GRADE_LIMIT_REACHED`
 * once reached). Inline sandbox `CODE` submissions are NOT counted against this cap.
 *
 * Dùng để HIỂN THỊ `used/limit` và cảnh báo, KHÔNG để khoá nút: BE chỉ áp cap cho học viên
 * chưa có quyền trả phí, và FE không biết trạng thái entitlement — khoá ở đây là khoá nhầm.
 */
const PROJECT_GRADE_LIMIT = 2

/** The submission `payloadType`s that count as a heavy project grade (see {@link PROJECT_GRADE_LIMIT}). */
const PROJECT_PAYLOAD_TYPES = new Set(["FILE", "URL"])

/** Props for {@link ChallengeMethodSolver}. */
export interface ChallengeMethodSolverProps {
    /** Challenge id (the real UUID, not the slug) the submissions post to. */
    challengeId: string
    /** Author's allowed method(s): `GITHUB` | `FILE` | `BOTH` (already known present). */
    submissionMethod: string | null | undefined
    /** Opaque grading config JSON — the FILE `fileExtension` whitelist is read from it. */
    gradingConfig: string | null | undefined
    /**
     * The full solve-view challenge — powers the embedded "Code trực tiếp" sandbox
     * ({@link GradeCodePanel}) so its inline Run/AI-grade practice and the formal
     * "Nộp bài" post the same source.
     */
    challengeDetail: ChallengeDetail
    /**
     * The author's file-extension hint (top-level view field). Drives whether the
     * in-browser sandbox tab is offered and which runtime language it locks to; falls
     * back to the `gradingConfig` extension whitelist when absent.
     */
    fileExtension: string | null | undefined
    /** SQL seed dataset threaded into the sandbox SQL Run path (visible to the learner). */
    seedSql: string | null | undefined
    /** Cap on attempts — drives the "used all attempts" lock message. */
    maxSubmissions: number
    /** True once every attempt is used — locks the submit surface. */
    reachedMax: boolean
    /**
     * The learner's attempts on this challenge (from the parent's my-submissions query).
     * Used to count the heavy project grades (`FILE` / `URL` payloads, trạng thái khác
     * `FAILED`) against {@link PROJECT_GRADE_LIMIT} so the github + file submits show
     * `used/2` và cảnh báo khi chạm trần; the inline sandbox `CODE` submit is never affected.
     */
    submissions: Array<SubmissionView>
    /** Called after a successful submit so the parent can revalidate its history. */
    onSubmitted: () => void
}

/**
 * The multi-method solver for a `CODE` challenge that carries a `submissionMethod`
 * (contract challenge-submission-method-solver). Ports the lesson assignment card's
 * forms onto the dedicated challenge solve page and adds an in-browser sandbox,
 * honoring the author's method plus the exercise's runnable language:
 *   - `GITHUB` → the repo-URL form (`payloadType:"URL"`)
 *   - `FILE`   → the file-upload form (multipart → AI graded)
 *   - `BOTH`   → both
 *   - a runnable `fileExtension` (py/js/ts/java/c/cpp/go/csharp/php/ruby/sql) also adds
 *     a **"Code trực tiếp"** tab: an embedded {@link GradeCodePanel} (Run + AI-grade
 *     practice) whose formal "Nộp bài" posts `payloadType:"CODE"`.
 *
 * More than one enabled surface → tabbed; a single surface renders inline. The URL
 * submit goes through {@link usePostSubmitChallengeSwr} (`payloadType:"URL"`), the file
 * submit through {@link usePostSubmitChallengeFileSwr}, the sandbox submit through
 * {@link usePostSubmitChallengeSwr} (`payloadType:"CODE"`). The learner's attempt
 * history + count chip stay owned by the parent `ChallengeSubmission`, which
 * revalidates via {@link onSubmitted}. When no method is set the parent renders the
 * inline `GradeCodePanel` instead — this solver is never mounted in that case.
 */
export const ChallengeMethodSolver = ({
    challengeId,
    submissionMethod,
    gradingConfig,
    challengeDetail,
    fileExtension,
    seedSql,
    maxSubmissions,
    reachedMax,
    submissions,
    onSubmitted,
}: ChallengeMethodSolverProps) => {
    const t = useTranslations("learn")
    const runRest = useRestWithToast()
    const submitUrl = usePostSubmitChallengeSwr()
    const submitFile = usePostSubmitChallengeFileSwr()
    const submitCode = usePostSubmitChallengeSwr()

    // The heavy PROJECT grade cap (PIN §1): count the learner's existing FILE (zip) / URL
    // (github) attempts — the two payloads routed to the agentic `/grade-project`. Inline
    // sandbox CODE submissions never count.
    // Đếm PHẢI khớp BE (`countByChallengeIdAndParticipantIdAndPayloadTypeIn` có `status <> 'FAILED'`):
    // bài chết vì lỗi hệ thống không tiêu lượt chấm project. Đếm cả FAILED làm học viên bị khoá nút
    // dù BE vẫn nhận bài — đúng ca gặp thật trên [HSF302] (1 SCORED + 1 FAILED = FE tưởng 2/2).
    const projectGradesUsed = submissions.filter(
        (submission) => submission.payloadType !== undefined
            && PROJECT_PAYLOAD_TYPES.has(submission.payloadType)
            && submission.status !== "FAILED",
    ).length
    // CẢNH BÁO chứ KHÔNG khoá: từ change project-grade-limit-purchased, BE chỉ áp cap này cho học
    // viên CHƯA có quyền trả phí (người đã mua / enrollment LEGACY thì chỉ còn max_submissions), mà
    // FE không biết trạng thái entitlement. Khoá cứng ở đây là khoá nhầm người BE vẫn cho nộp; để BE
    // phán quyết rồi dịch PROJECT_GRADE_LIMIT_REACHED thành thông báo rõ (xem mapSubmitError).
    const projectLimitReached = projectGradesUsed >= PROJECT_GRADE_LIMIT

    // Translate the BE project-grade cap rejection to a clear i18n message so the submit
    // toast reads meaningfully; anything else re-throws for the default error toast.
    const mapSubmitError = (error: unknown): never => {
        if (error instanceof RestError && error.errorCode === "PROJECT_GRADE_LIMIT_REACHED") {
            throw new Error(t("exercises.project.gradeLimitReached"))
        }
        throw error
    }

    const methods = parseSubmitMethods(submissionMethod)
    const acceptExtensions = parseFileExtensions(parseGradingConfigFileExtension(gradingConfig))
    // The sandbox runtime language, from the top-level `fileExtension` hint (falling back
    // to the gradingConfig whitelist). Non-null → the exercise is runnable in-browser, so
    // the "Code trực tiếp" tab is offered; null → upload-only (e.g. `.zip`/`.pdf`).
    const sandboxLanguage = runnableLanguageFromFileExtension(
        fileExtension ?? parseGradingConfigFileExtension(gradingConfig),
    )
    const showSandbox = sandboxLanguage !== null
    // When the FILE method accepts a `.zip`, the file tab becomes a PROJECT upload (zip OR
    // whole folder → one zip) with a pre-submit tree preview, instead of the single-file
    // picker (PIN §4A). Read from both the gradingConfig whitelist and the top-level hint.
    const isProjectUpload =
        acceptExtensions.includes(".zip") || (fileExtension ?? "").toLowerCase().includes(".zip")

    // The enabled surfaces, in tab order: github, file, sandbox.
    const availableTabs: Array<SolverTab> = [
        ...(methods.github ? (["github"] as const) : []),
        ...(methods.file ? (["file"] as const) : []),
        ...(showSandbox ? (["sandbox"] as const) : []),
    ]
    const showTabs = availableTabs.length > 1

    // The active tab — default to the first enabled surface.
    const [method, setMethod] = useState<SolverTab>(availableTabs[0])

    const [url, setUrl] = useState("")
    const [touched, setTouched] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    /** Set when the picked file's extension is outside the whitelist. */
    const [fileError, setFileError] = useState<"wrongType" | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [dragOver, setDragOver] = useState(false)

    // Project-upload state (used only when `isProjectUpload`): `prepared` holds the built
    // `.zip` blob + the preview tree, `null` until a zip/folder is picked; `preparing` guards
    // the async fflate zip/unzip; `projectError` maps an intake failure to an i18n message.
    const [prepared, setPrepared] = useState<PreparedProject | null>(null)
    const [preparing, setPreparing] = useState(false)
    const [projectError, setProjectError] = useState<ProjectArchiveErrorKind | null>(null)
    const zipInputRef = useRef<HTMLInputElement>(null)
    const folderInputRef = useRef<HTMLInputElement | null>(null)

    // Lifted sandbox editor state — the same source the embedded GradeCodePanel edits and
    // Runs/AI-grades is what the formal "Nộp bài" posts (payloadType CODE). The language is
    // fixed to the exercise's runnable language; GradeCodePanel locks the picker (see the
    // `lockLanguage` prop passed below), so it never changes after mount.
    const [sandboxCode, setSandboxCode] = useState("")
    const [sandboxCodeLanguage, setSandboxCodeLanguage] = useState<string>(sandboxLanguage ?? "python")

    // Shared AI grading model across every surface: the github / file tabs render its
    // picker below, and the sandbox tab drives the SAME state through GradeCodePanel's
    // toolbar picker (threaded down as a controlled prop). Null → the BE default; threaded
    // into the URL / file / CODE submits so the learner's pick always reaches the grader.
    const [model, setModel] = useState<string | null>(null)
    const modelsSwr = useGetAiCatalogModelsSwr()

    const busy = submitUrl.isMutating || submitFile.isMutating || submitCode.isMutating
    const invalid = url.trim() !== "" && !isHttpsUrl(url)
    // URL / FILE / project are the heavy project grades → also gated by the project cap.
    // The sandbox CODE submit is intentionally NOT gated by it.
    const canSubmitUrl = !reachedMax && isHttpsUrl(url) && !busy
    const canSubmitFile = !reachedMax && file !== null && fileError === null && !busy
    const canSubmitCode = !reachedMax && sandboxCode.trim() !== "" && !busy
    const canSubmitProject = !reachedMax && prepared !== null && !busy && !preparing

    const handleSubmitUrl = async () => {
        setTouched(true)
        // Client-side gate — never fire the request for a non-https URL or a used-up
        // project-grade quota (URL is a heavy project grade).
        if (!isHttpsUrl(url) || reachedMax || busy) {
            return
        }
        const ok = await runRest(
            () => submitUrl.trigger({
                id: challengeId,
                request: { payloadType: "URL", url: url.trim(), ...(model ? { model } : {}) },
            }).catch(mapSubmitError),
            { successMessage: t("exercises.assignment.submitted") },
        )
        if (ok !== null) {
            setUrl("")
            setTouched(false)
            onSubmitted()
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
        // Client-side gate — no doomed request for a missing / wrong-type file or a used-up
        // project-grade quota (FILE is a heavy project grade).
        if (!file || fileError !== null || reachedMax || busy) {
            return
        }
        const ok = await runRest(
            () => submitFile.trigger({ id: challengeId, file, model: model ?? undefined }).catch(mapSubmitError),
            { successMessage: t("exercises.assignment.submitted") },
        )
        if (ok !== null) {
            setFile(null)
            onSubmitted()
        }
    }

    // Runs the async fflate intake (zip OR folder), swapping the picked project in on
    // success and mapping a typed failure to the learner-facing error.
    const preparePicked = async (build: () => Promise<PreparedProject>) => {
        setPreparing(true)
        setProjectError(null)
        setPrepared(null)
        try {
            setPrepared(await build())
        } catch (error) {
            setProjectError(error instanceof ProjectArchiveError ? error.kind : "read")
        } finally {
            setPreparing(false)
        }
    }

    const handlePickZip = (candidate: File | undefined) => {
        if (candidate) {
            void preparePicked(() => prepareZipProject(candidate))
        }
    }

    const handlePickFolder = (files: FileList | null) => {
        if (files && files.length > 0) {
            void preparePicked(() => prepareFolderProject(Array.from(files)))
        }
    }

    const handleSubmitProject = async () => {
        // Client-side gate — no doomed request for a missing project / used-up attempt or
        // project-grade quota (a project upload is a heavy FILE project grade).
        if (!prepared || reachedMax || busy) {
            return
        }
        // The prepared blob is already ONE .zip — wrap it as a File and submit through the
        // SAME multipart path as a single-file upload (grade = submit, consumes an attempt).
        const zipFile = new File([prepared.blob], prepared.fileName, { type: "application/zip" })
        const ok = await runRest(
            () => submitFile.trigger({ id: challengeId, file: zipFile, model: model ?? undefined }).catch(mapSubmitError),
            { successMessage: t("exercises.assignment.submitted") },
        )
        if (ok !== null) {
            setPrepared(null)
            setProjectError(null)
            onSubmitted()
        }
    }

    const handleSubmitCode = async () => {
        // Client-side gate — no doomed request for empty source / a used-up quota.
        if (sandboxCode.trim() === "" || reachedMax || busy) {
            return
        }
        const ok = await runRest(
            () => submitCode.trigger({
                id: challengeId,
                request: {
                    payloadType: "CODE",
                    code: sandboxCode,
                    language: sandboxCodeLanguage.trim() || "text",
                    ...(model ? { model } : {}),
                },
            }),
            { successMessage: t("exercises.assignment.submitted") },
        )
        if (ok !== null) {
            onSubmitted()
        }
    }

    if (reachedMax) {
        return (
            <div className="flex items-center gap-2 rounded-2xl border border-default bg-default/40 p-4">
                <LockSimpleIcon aria-hidden focusable="false" className="size-5 shrink-0 text-muted" />
                <Typography type="body-sm" color="muted">
                    {t("exercises.assignment.maxReached", { max: maxSubmissions })}
                </Typography>
            </div>
        )
    }

    // Shared AI grading model picker for the github / file tabs (each model grades
    // differently); the sandbox tab has its own picker inside GradeCodePanel.
    const modelPicker = (
        <div className="flex flex-col gap-2">
            <AiModelPicker
                catalog={modelsSwr.data}
                value={model}
                onChange={setModel}
                isDisabled={busy}
            />
            <Typography type="body-xs" color="muted">
                {t("codeGrading.modelHint")}
            </Typography>
        </div>
    )

    // The heavy PROJECT grade cap surface (PIN §3), shown on the github + file submits: a
    // muted `used/2` hint while quota remains, or a danger note once the cap is reached. The
    // sandbox CODE submit never renders this (it isn't a project grade).
    const projectGradeHint = projectLimitReached ? (
        <div className="flex items-center gap-2 rounded-2xl border border-danger/40 bg-danger/5 px-4 py-3">
            <WarningCircleIcon aria-hidden focusable="false" className="size-5 shrink-0 text-danger" />
            <Typography type="body-sm" color="muted">
                {t("exercises.project.gradeLimitReached")}
            </Typography>
        </div>
    ) : (
        <Typography type="body-xs" color="muted">
            {t("exercises.project.gradeLimitHint", { used: projectGradesUsed, limit: PROJECT_GRADE_LIMIT })}
        </Typography>
    )

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
            {projectGradeHint}
            {modelPicker}
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

            {projectGradeHint}

            {modelPicker}

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

    // The PROJECT upload form (file tab when the challenge accepts `.zip`): pick a `.zip`
    // OR a whole folder → fflate builds ONE zip + a tree preview (ProjectTreePreview) shown
    // BEFORE Submit (replacing the plain file chip). Submit posts through the same multipart
    // path as a single-file upload (grade = submit).
    const projectFileForm = (
        <div className="flex flex-col gap-3">
            <Typography type="body-sm" weight="medium">
                {t("exercises.project.uploadTitle")}
            </Typography>

            {prepared ? (
                <ProjectTreePreview
                    fileName={prepared.fileName}
                    paths={prepared.paths}
                    onClear={() => {
                        setPrepared(null)
                        setProjectError(null)
                    }}
                />
            ) : (
                <div
                    onDragOver={(event) => {
                        event.preventDefault()
                        setDragOver(true)
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(event) => {
                        event.preventDefault()
                        setDragOver(false)
                        handlePickZip(event.dataTransfer.files?.[0])
                    }}
                    className={cn(
                        "flex flex-col items-center gap-3 rounded-2xl border border-dashed border-default p-8 text-center transition-colors",
                        dragOver && "border-accent bg-accent/5",
                    )}
                >
                    <UploadSimpleIcon aria-hidden focusable="false" className="size-7 text-muted" />
                    <Typography type="body-sm" color="muted">
                        {t("exercises.project.dropHint")}
                    </Typography>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            isDisabled={preparing}
                            onPress={() => zipInputRef.current?.click()}
                        >
                            <FileZipIcon aria-hidden focusable="false" className="size-4" />
                            {t("exercises.project.pickZip")}
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            isDisabled={preparing}
                            onPress={() => folderInputRef.current?.click()}
                        >
                            <FolderIcon aria-hidden focusable="false" className="size-4" />
                            {t("exercises.project.pickFolder")}
                        </Button>
                    </div>
                </div>
            )}

            {/* Hidden pickers — a `.zip` input + a folder input whose `webkitdirectory`/
                `directory` attributes are set imperatively (they are not in React's JSX input
                types). Value reset after each pick so re-choosing the same zip/folder fires a
                fresh change event. */}
            <input
                ref={zipInputRef}
                type="file"
                accept=".zip,application/zip"
                className="hidden"
                aria-label={t("exercises.project.pickZip")}
                onChange={(event) => {
                    handlePickZip(event.target.files?.[0])
                    event.target.value = ""
                }}
            />
            <input
                ref={(el) => {
                    if (el) {
                        el.setAttribute("webkitdirectory", "")
                        el.setAttribute("directory", "")
                    }
                    folderInputRef.current = el
                }}
                type="file"
                className="hidden"
                aria-label={t("exercises.project.pickFolder")}
                onChange={(event) => {
                    handlePickFolder(event.target.files)
                    event.target.value = ""
                }}
            />

            {preparing ? (
                <div className="flex items-center gap-2">
                    <Spinner size="sm" />
                    <Typography type="body-sm" color="muted">
                        {t("exercises.project.reading")}
                    </Typography>
                </div>
            ) : null}

            {projectError ? (
                <div className="flex items-center gap-2 rounded-2xl border border-danger/40 bg-danger/5 px-4 py-3">
                    <WarningCircleIcon aria-hidden focusable="false" className="size-5 shrink-0 text-danger" />
                    <Typography type="body-sm" color="muted">
                        {t(`exercises.project.error.${projectError === "too-large" ? "tooLarge" : projectError}`)}
                    </Typography>
                </div>
            ) : null}

            {projectGradeHint}

            {modelPicker}

            <div>
                <Button
                    variant="primary"
                    isPending={submitFile.isMutating}
                    isDisabled={!canSubmitProject}
                    onPress={() => void handleSubmitProject()}
                >
                    {t("exercises.project.submit")}
                </Button>
            </div>
        </div>
    )

    // The in-browser sandbox tab body = ONLY the workspace (the embedded GradeCodePanel:
    // toolbar Run/submit above, editor, terminal output below). The problem statement + SQL
    // schema/ERD live in the shared RIGHT column of the outer split (owned by the parent), so
    // this stays a single column. GRADE = SUBMIT: the panel's PRIMARY button ("Nộp & Chấm AI")
    // posts exactly the edited source as a CODE submission (consuming an attempt); the free
    // "Run" stays for no-attempt testing.
    const sandboxForm = (
        <GradeCodePanel
            challenge={challengeDetail}
            code={sandboxCode}
            language={sandboxCodeLanguage}
            onCodeChange={setSandboxCode}
            onLanguageChange={setSandboxCodeLanguage}
            // Thread the shared model down so the toolbar picker drives the same state the
            // formal CODE submission posts (not just an in-panel grade).
            model={model}
            onModelChange={setModel}
            setupSql={seedSql ?? undefined}
            // The seed's schema/ERD is rendered once in the shared right column
            // (ChallengeProblemAside) — suppress the panel's raw-seed block here so the
            // learner doesn't see the same dataset twice.
            hideSeedNote
            // The sandbox runtime is fixed to the author's `fileExtension` language; lock the
            // picker so a learner can't Run/submit a mismatched language.
            lockLanguage
            onSubmit={() => void handleSubmitCode()}
            submitLabel={t("exercises.challenge.gradeSubmit")}
            isSubmitting={submitCode.isMutating}
            submitDisabled={!canSubmitCode}
        />
    )

    const activeForm =
        method === "sandbox"
            ? sandboxForm
            : method === "file"
                ? (isProjectUpload ? projectFileForm : fileForm)
                : githubForm

    // ONLY the work area (tabs + active form) — the LEFT column of the outer solve split.
    // The problem statement ("Đề bài") + SQL schema/ERD live in the shared RIGHT column,
    // owned by the parent `ChallengeSubmission`, so they render once for every tab.
    return (
        <div className="flex min-w-0 flex-col gap-4">
            {/* Offers the enabled surface(s): a GitHub-URL form, a file upload, and/or the
                code sandbox; more than one → tabs (icon + label, label hidden `<sm`). */}
            {showTabs ? (
                <ExtendedTabs
                    selectedKey={method}
                    onSelectionChange={(key) => setMethod(key as SolverTab)}
                >
                    <Tabs.ListContainer>
                        <Tabs.List aria-label={t("exercises.assignment.methodTabsLabel")}>
                            {availableTabs.map((tab) => (
                                <Tabs.Tab key={tab} id={tab} aria-label={t(TAB_LABEL_KEY[tab])}>
                                    <span className="flex items-center gap-2">
                                        {tab === "github" ? (
                                            <GithubLogoIcon aria-hidden focusable="false" className="size-4" />
                                        ) : tab === "file" ? (
                                            <FileArrowUpIcon aria-hidden focusable="false" className="size-4" />
                                        ) : (
                                            <CodeIcon aria-hidden focusable="false" className="size-4" />
                                        )}
                                        <span className="hidden sm:inline">{t(TAB_LABEL_KEY[tab])}</span>
                                    </span>
                                </Tabs.Tab>
                            ))}
                        </Tabs.List>
                    </Tabs.ListContainer>
                </ExtendedTabs>
            ) : null}
            {activeForm}
        </div>
    )
}
