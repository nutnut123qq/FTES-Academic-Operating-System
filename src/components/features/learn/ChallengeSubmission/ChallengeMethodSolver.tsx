"use client"

import React, { useEffect, useRef, useState } from "react"
import { Button, Input, Tabs, TextField, Typography, cn } from "@heroui/react"
import {
    CodeIcon,
    FileArrowUpIcon,
    GithubLogoIcon,
    LockSimpleIcon,
    UploadSimpleIcon,
    WarningCircleIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { ExtendedTabs } from "@/components/blocks/navigation/ExtendedTabs"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import { AiModelPicker } from "@/components/reuseable/AiModelPicker"
import { useRestWithToast } from "@/modules/toast/hooks"
import { useGetAiCatalogModelsSwr } from "@/hooks/swr/api/rest/queries"
import { usePostSubmitChallengeSwr } from "@/hooks/swr/api/rest/mutations/usePostSubmitChallengeSwr"
import { usePostSubmitChallengeFileSwr } from "@/hooks/swr/api/rest/mutations/usePostSubmitChallengeFileSwr"
import { usePostSqlSchemaSwr } from "@/hooks/swr/api/rest/mutations/usePostSqlSchemaSwr"
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
import { SqlSchemaPanel } from "./SqlSchemaPanel"

/** The solver's tab keys — the two author methods plus the in-browser code sandbox. */
type SolverTab = SubmitMethod | "sandbox"

/** i18n key for each tab's label (used for the visible label + the a11y `aria-label`). */
const TAB_LABEL_KEY: Record<SolverTab, string> = {
    github: "exercises.assignment.tabGithub",
    file: "exercises.assignment.tabFile",
    sandbox: "exercises.assignment.tabSandbox",
}

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
    onSubmitted,
}: ChallengeMethodSolverProps) => {
    const t = useTranslations("learn")
    const runRest = useRestWithToast()
    const submitUrl = usePostSubmitChallengeSwr()
    const submitFile = usePostSubmitChallengeFileSwr()
    const submitCode = usePostSubmitChallengeSwr()

    const methods = parseSubmitMethods(submissionMethod)
    const acceptExtensions = parseFileExtensions(parseGradingConfigFileExtension(gradingConfig))
    // The sandbox runtime language, from the top-level `fileExtension` hint (falling back
    // to the gradingConfig whitelist). Non-null → the exercise is runnable in-browser, so
    // the "Code trực tiếp" tab is offered; null → upload-only (e.g. `.zip`/`.pdf`).
    const sandboxLanguage = runnableLanguageFromFileExtension(
        fileExtension ?? parseGradingConfigFileExtension(gradingConfig),
    )
    const showSandbox = sandboxLanguage !== null

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

    // SQL schema/ERD (contract code-sandbox-ux §4C): when this is a SQL exercise carrying a
    // VISIBLE seed dataset, introspect it once so the sandbox problem column can show the
    // tables/relationships the learner queries. Non-SQL / no seed → nothing to introspect.
    const isSql = challengeDetail.type === "sql" || sandboxLanguage === "sql"
    const seedSqlValue = typeof seedSql === "string" ? seedSql.trim() : ""
    const hasSeed = isSql && seedSqlValue !== ""
    const {
        trigger: triggerSchema,
        data: schemaData,
        error: schemaError,
        isMutating: schemaLoading,
    } = usePostSqlSchemaSwr()
    // Introspect only once the sandbox tab is actually active (and once per seed): the
    // schema/ERD lives solely inside the sandbox column, so a github/file default tab — or
    // a SQL challenge that offers no sandbox at all — must never hit the SQL engine for a
    // panel the learner never opens. Failures are recovered by the section's retry button.
    const fetchedSeedRef = useRef<string | null>(null)
    useEffect(() => {
        if (hasSeed && method === "sandbox" && fetchedSeedRef.current !== seedSqlValue) {
            fetchedSeedRef.current = seedSqlValue
            void triggerSchema({ setupSql: seedSqlValue }).catch(() => {})
        }
    }, [hasSeed, method, seedSqlValue, triggerSchema])

    const busy = submitUrl.isMutating || submitFile.isMutating || submitCode.isMutating
    const invalid = url.trim() !== "" && !isHttpsUrl(url)
    const canSubmitUrl = !reachedMax && isHttpsUrl(url) && !busy
    const canSubmitFile = !reachedMax && file !== null && fileError === null && !busy
    const canSubmitCode = !reachedMax && sandboxCode.trim() !== "" && !busy

    const handleSubmitUrl = async () => {
        setTouched(true)
        // Client-side gate — never fire the request for a non-https URL.
        if (!isHttpsUrl(url) || reachedMax || busy) {
            return
        }
        const ok = await runRest(
            () => submitUrl.trigger({
                id: challengeId,
                request: { payloadType: "URL", url: url.trim(), ...(model ? { model } : {}) },
            }),
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
        // Client-side gate — no doomed request for a missing / wrong-type file.
        if (!file || fileError !== null || reachedMax || busy) {
            return
        }
        const ok = await runRest(
            () => submitFile.trigger({ id: challengeId, file, model: model ?? undefined }),
            { successMessage: t("exercises.assignment.submitted") },
        )
        if (ok !== null) {
            setFile(null)
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

    // The problem statement, rendered full-width above the github / file tabs (the sandbox
    // tab shows it in its own left split column instead). Owned here so the parent never
    // renders it twice on the split surface.
    const problemAbove = challengeDetail.description ? (
        <div className="rounded-3xl border border-default bg-surface p-6">
            <MarkdownContent reading markdown={challengeDetail.description} />
        </div>
    ) : null

    // The SQL seed-dataset schema/ERD for the sandbox left column. No seed → a plain note;
    // otherwise the introspected schema wrapped in the standard async states.
    const sqlSchemaSection = !hasSeed ? (
        <div className="rounded-2xl border border-default bg-default/40 p-4">
            <Typography type="body-sm" color="muted">
                {t("codeGrading.schemaNoSeed")}
            </Typography>
        </div>
    ) : (
        <AsyncContent
            isLoading={schemaLoading && !schemaData && !schemaError}
            skeleton={<SchemaSkeleton />}
            isEmpty={Boolean(schemaData) && (schemaData?.tables.length ?? 0) === 0}
            emptyContent={{ title: t("codeGrading.schemaEmpty") }}
            error={!schemaData ? schemaError : undefined}
            errorContent={{
                title: t("codeGrading.schemaError"),
                onRetry: () => { void triggerSchema({ setupSql: seedSqlValue }).catch(() => {}) },
                retryLabel: t("codeGrading.retry"),
            }}
        >
            {schemaData ? <SqlSchemaPanel schema={schemaData} /> : null}
        </AsyncContent>
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

    // The in-browser sandbox: a two-column split — LEFT = the problem (title + description,
    // plus the SQL schema/ERD) so the learner sees what to solve; RIGHT = the workspace,
    // the embedded GradeCodePanel (IDE layout: toolbar Run/AI-grade above, editor, terminal
    // output below) over lifted code/language, plus a formal "Nộp bài" that posts exactly
    // that source as a CODE submission. Mobile stacks to one column (problem then workspace).
    const sandboxForm = (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3">
                    <Typography type="body" weight="semibold">
                        {challengeDetail.title}
                    </Typography>
                    {challengeDetail.description ? (
                        <MarkdownContent reading markdown={challengeDetail.description} />
                    ) : null}
                </div>
                {isSql ? sqlSchemaSection : null}
            </div>
            <div className="flex flex-col gap-4">
                <GradeCodePanel
                    challenge={challengeDetail}
                    code={sandboxCode}
                    language={sandboxCodeLanguage}
                    onCodeChange={setSandboxCode}
                    onLanguageChange={setSandboxCodeLanguage}
                    // Thread the shared model down so the toolbar picker drives the same
                    // state the formal CODE "Nộp bài" submits (not just the practice grade).
                    model={model}
                    onModelChange={setModel}
                    setupSql={seedSql ?? undefined}
                    // The sandbox runtime is fixed to the author's `fileExtension` language;
                    // lock the picker so a learner can't Run/submit a mismatched language.
                    lockLanguage
                />
                <div>
                    <Button
                        variant="primary"
                        isPending={submitCode.isMutating}
                        isDisabled={!canSubmitCode}
                        onPress={() => void handleSubmitCode()}
                    >
                        {t("exercises.assignment.submit")}
                    </Button>
                </div>
            </div>
        </div>
    )

    const activeForm =
        method === "sandbox" ? sandboxForm : method === "file" ? fileForm : githubForm

    // The problem statement lives above the tabs for the github / file surfaces; the
    // sandbox surface renders it in its own left split column instead (so it never shows
    // twice). Owned here — the parent no longer renders a standalone description card for
    // this solver branch.
    return (
        <div className="flex flex-col gap-4">
            {method !== "sandbox" ? problemAbove : null}
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

/** Loading skeleton for the SQL schema/ERD panel — mirrors its single bordered card. */
const SchemaSkeleton = () => (
    <Skeleton className="h-40 w-full rounded-3xl" />
)
