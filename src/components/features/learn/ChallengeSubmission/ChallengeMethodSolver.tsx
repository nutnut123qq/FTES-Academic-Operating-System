"use client"

import React, { useRef, useState } from "react"
import { Button, Input, Tabs, TextField, Typography, cn } from "@heroui/react"
import {
    FileArrowUpIcon,
    LockSimpleIcon,
    UploadSimpleIcon,
    WarningCircleIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { ExtendedTabs } from "@/components/blocks/navigation/ExtendedTabs"
import { useRestWithToast } from "@/modules/toast/hooks"
import { usePostSubmitChallengeSwr } from "@/hooks/swr/api/rest/mutations/usePostSubmitChallengeSwr"
import { usePostSubmitChallengeFileSwr } from "@/hooks/swr/api/rest/mutations/usePostSubmitChallengeFileSwr"
import {
    fileMatchesExtensions,
    isHttpsUrl,
    parseFileExtensions,
    parseGradingConfigFileExtension,
    parseSubmitMethods,
    type SubmitMethod,
} from "@/components/features/learn/submissionMethods"

/** Props for {@link ChallengeMethodSolver}. */
export interface ChallengeMethodSolverProps {
    /** Challenge id (the real UUID, not the slug) the submissions post to. */
    challengeId: string
    /** Author's allowed method(s): `GITHUB` | `FILE` | `BOTH` (already known present). */
    submissionMethod: string | null | undefined
    /** Opaque grading config JSON — the FILE `fileExtension` whitelist is read from it. */
    gradingConfig: string | null | undefined
    /** Cap on attempts — drives the "used all attempts" lock message. */
    maxSubmissions: number
    /** True once every attempt is used — locks the submit surface. */
    reachedMax: boolean
    /** Called after a successful submit so the parent can revalidate its history. */
    onSubmitted: () => void
}

/**
 * The github-URL + file-upload solver for a `CODE` challenge that carries a
 * `submissionMethod` (contract challenge-submission-method-solver). Ports the lesson
 * assignment card's two forms onto the dedicated challenge solve page, honoring the
 * author's method:
 *   - `GITHUB` → only the repo-URL form (`payloadType:"URL"`)
 *   - `FILE`   → only the file-upload form (multipart → AI graded)
 *   - `BOTH`   → both, behind a method tab
 *
 * The URL submit goes through {@link usePostSubmitChallengeSwr} (`payloadType:"URL"`),
 * the file submit through {@link usePostSubmitChallengeFileSwr}. The learner's attempt
 * history + count chip stay owned by the parent `ChallengeSubmission`, which
 * revalidates via {@link onSubmitted}. When no method is set the parent renders the
 * inline `GradeCodePanel` instead — this solver is never mounted in that case.
 */
export const ChallengeMethodSolver = ({
    challengeId,
    submissionMethod,
    gradingConfig,
    maxSubmissions,
    reachedMax,
    onSubmitted,
}: ChallengeMethodSolverProps) => {
    const t = useTranslations("learn")
    const runRest = useRestWithToast()
    const submitUrl = usePostSubmitChallengeSwr()
    const submitFile = usePostSubmitChallengeFileSwr()

    const methods = parseSubmitMethods(submissionMethod)
    const acceptExtensions = parseFileExtensions(parseGradingConfigFileExtension(gradingConfig))
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

    const busy = submitUrl.isMutating || submitFile.isMutating
    const invalid = url.trim() !== "" && !isHttpsUrl(url)
    const canSubmitUrl = !reachedMax && isHttpsUrl(url) && !busy
    const canSubmitFile = !reachedMax && file !== null && fileError === null && !busy

    const handleSubmitUrl = async () => {
        setTouched(true)
        // Client-side gate — never fire the request for a non-https URL.
        if (!isHttpsUrl(url) || reachedMax || busy) {
            return
        }
        const ok = await runRest(
            () => submitUrl.trigger({ id: challengeId, request: { payloadType: "URL", url: url.trim() } }),
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
            () => submitFile.trigger({ id: challengeId, file }),
            { successMessage: t("exercises.assignment.submitted") },
        )
        if (ok !== null) {
            setFile(null)
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

    // Offers the allowed method(s): a GitHub-URL form and/or a file upload; both → tabs.
    if (showTabs) {
        return (
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
        )
    }

    return methods.file ? fileForm : githubForm
}
