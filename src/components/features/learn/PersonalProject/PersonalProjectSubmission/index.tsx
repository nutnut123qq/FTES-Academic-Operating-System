"use client"

import React from "react"
import {
    cn,
    FieldError,
    Input,
    Label,
    Spinner,
    TextField,
    Typography,
} from "@heroui/react"
import { useTranslations } from "next-intl"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { usePersonalProjectGithubForm } from "@/hooks/zustand/personalProjectGithub/usePersonalProjectGithubForm"
import type { PersonalProjectGithubAutosaveStatus } from "@/hooks/zustand/personalProjectGithub/store"

/** Props for {@link PersonalProjectSubmission}. */
export type PersonalProjectSubmissionProps = WithClassNames<undefined>

/**
 * GitHub repo URL field — the panel's PRIMARY input (the thing learners actually change).
 *
 * Also the debounced-sync OWNER (`enableSync: true`): it is always mounted in the panel, so it
 * runs BOTH the url and branch auto-sync even while the grading-settings Drawer (which hosts the
 * branch field) is closed. The set-once config (language / branch / token) now lives in
 * {@link import("../GithubGradingSettings").GithubGradingSettings} inside that Drawer.
 * @param props - {@link PersonalProjectSubmissionProps}
 */
export const PersonalProjectSubmission = ({ className }: PersonalProjectSubmissionProps) => {
    const t = useTranslations()
    const {
        githubUrl,
        errors,
        touched,
        autosaveStatus,
        setGithubUrl,
        setTouchedGithubUrl,
    } = usePersonalProjectGithubForm({ enableSync: true })
    const urlInvalid = Boolean(touched.githubUrl && errors.githubUrl)

    return (
        <div className={cn("flex flex-col gap-2", className)}>
            {/* label + autosave status on ONE row → the section ends at the input, so the gap to
                the next section stays a clean gap-6 (the status no longer adds trailing height). */}
            <div className="flex items-center justify-between gap-2">
                <Label>{t("finalProject.page.submitGithub.repoFieldTitle")}</Label>
                <AutosaveStatus status={autosaveStatus.githubUrl} />
            </div>
            <TextField variant="secondary" isInvalid={urlInvalid} className="w-full">
                <Input
                    className="w-full"
                    placeholder={t("finalProject.page.submitGithub.placeholder")}
                    name="githubUrl"
                    value={githubUrl}
                    onChange={(event) => setGithubUrl(event.target.value)}
                    onBlur={() => setTouchedGithubUrl(true)}
                />
                <FieldError>{errors.githubUrl}</FieldError>
            </TextField>
        </div>
    )
}

/** Props for {@link AutosaveStatus}. */
interface AutosaveStatusProps {
    status: PersonalProjectGithubAutosaveStatus
}

/**
 * Inline autosave feedback at a FIXED height (no layout jump). `saving` = spinner + muted text,
 * `saved` = success-green, `failed` = danger, `idle` = empty. Kept OUTSIDE the `TextField` (a bare
 * Text inside one is treated as a description/errorMessage slot).
 */
export const AutosaveStatus = ({ status }: AutosaveStatusProps) => {
    const t = useTranslations()
    const tAutosave = useTranslations("autosave")
    return (
        <div className="flex h-5 items-center gap-2">
            {status === "saving"
                ? (
                    <>
                        <Spinner size="sm" />
                        <Typography type="body-sm" color="muted">{t("finalProject.page.submitGithub.syncing")}</Typography>
                    </>
                )
                : status === "saved"
                    ? <Typography type="body-sm" className="text-success">{tAutosave("saved")}</Typography>
                    : status === "failed"
                        ? <Typography type="body-sm" className="text-danger">{tAutosave("failed")}</Typography>
                        : null}
        </div>
    )
}
