"use client"

import React, { useCallback, useMemo, useState } from "react"
import { Button, Chip, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"

import { useRequireAuth } from "@/hooks/useRequireAuth"
import { useRestWithToast } from "@/modules/toast/hooks"
import { ResourceDropzone } from "@/components/features/resource/ResourceUpload/ResourceDropzone"
import { useMutateSubmitPeAnswerSwr } from "@/components/features/resource/hooks/useMutateSubmitPeAnswerSwr"
import {
    PE_ANSWER_EXTENSIONS,
    PE_ANSWER_MAX_SIZE_MB,
    peAnswerAcceptAttribute,
    validatePeAnswerFile,
    type PeAnswerRejection,
} from "./peAnswerRules"
import { classifyPeSubmitError } from "./peErrors"

/** Props for {@link PeAnswerForm}. */
export interface PeAnswerFormProps {
    /** The PE resource being answered. */
    resourceId: string
    /** Attempts the student has already spent (server-computed). */
    attemptsUsed: number
    /** Attempt budget for this paper (server-computed — never hardcoded here). */
    maxAttempts: number
    /** True while an earlier attempt is still being graded — a second submit would race it. */
    isGrading: boolean
    /** Called after a submit lands so the parent can revalidate its attempt list. */
    onSubmitted: () => void
}

/**
 * The student's answer upload for a PE paper.
 *
 * Mirrors the challenge solver's attempt-cap UX: the `used/limit` hint sits next to the
 * submit, the button is disabled (not merely rejected) once the budget is spent, and a
 * doomed request is never fired — the file is gated client-side against the BE
 * whitelist (Office / PDF / picture / text / zip, ≤ {@link PE_ANSWER_MAX_SIZE_MB} MB)
 * before anything leaves the browser. The cap itself comes from the server
 * (`maxAttempts`), so a policy change on the BE needs no FE release.
 *
 * A rejection is translated before it reaches the toast — notably the two different
 * 429s: "hết lượt" is permanent while "thao tác quá nhanh" is not, and telling a student
 * out of attempts to retry shortly would be wrong.
 *
 * @param props - {@link PeAnswerFormProps}
 */
export const PeAnswerForm = ({
    resourceId,
    attemptsUsed,
    maxAttempts,
    isGrading,
    onSubmitted,
}: PeAnswerFormProps) => {
    const t = useTranslations("subjects")
    const runRest = useRestWithToast()
    const { guard } = useRequireAuth()
    const submit = useMutateSubmitPeAnswerSwr()
    const [file, setFile] = useState<File | null>(null)

    const validation = useMemo(
        () => (file ? validatePeAnswerFile(file) : null),
        [file],
    )
    const fileError: PeAnswerRejection | null =
        validation && !validation.ok ? validation.reason : null

    const reachedMax = maxAttempts > 0 && attemptsUsed >= maxAttempts
    const busy = submit.isMutating
    const canSubmit = !reachedMax && !isGrading && !busy && validation?.ok === true

    /**
     * Re-words a BE rejection so the toast says something the student can act on;
     * anything unclassified still reaches the wrapper's generic error toast.
     */
    const mapSubmitError = useCallback(
        (error: unknown): never => {
            throw new Error(t(`practice.pe.errors.${classifyPeSubmitError(error)}`))
        },
        [t],
    )

    const runSubmit = useCallback(async () => {
        if (!file || !canSubmit) {
            return
        }
        const ok = await runRest(
            () => submit.trigger({ resourceId, file }).catch(mapSubmitError),
            { successMessage: t("practice.pe.submitted") },
        )
        if (ok !== null && ok !== undefined) {
            setFile(null)
            onSubmitted()
        }
    }, [file, canSubmit, runRest, submit, resourceId, mapSubmitError, t, onSubmitted])

    const onPress = guard(() => {
        void runSubmit()
    }, "auth.context.generic")

    return (
        <section className="flex flex-col gap-3 rounded-2xl border border-separator p-4">
            <div className="flex flex-wrap items-center gap-2">
                <Typography type="body" weight="semibold" className="min-w-0 flex-1">
                    {t("practice.pe.answerTitle")}
                </Typography>
                <Chip size="sm" variant="soft" color={reachedMax ? "warning" : "accent"}>
                    {t("practice.pe.attempts", { used: attemptsUsed, limit: maxAttempts })}
                </Chip>
            </div>

            <ResourceDropzone
                file={file}
                onSelect={setFile}
                accept={peAnswerAcceptAttribute()}
                label={t("practice.pe.answerDropzone")}
                hint={t("practice.pe.answerHint", {
                    extensions: PE_ANSWER_EXTENSIONS.join(", "),
                    maxSize: PE_ANSWER_MAX_SIZE_MB,
                })}
                clearLabel={t("practice.pe.clearFile")}
                isDisabled={reachedMax || busy}
                error={
                    fileError
                        ? t(`practice.pe.fileError.${fileError}`, {
                            extensions: PE_ANSWER_EXTENSIONS.join(", "),
                            maxSize: PE_ANSWER_MAX_SIZE_MB,
                        })
                        : null
                }
            />

            {reachedMax ? (
                <Typography type="body-xs" className="text-warning">
                    {t("practice.pe.attemptsExhausted", { limit: maxAttempts })}
                </Typography>
            ) : null}
            {!reachedMax && isGrading ? (
                <Typography type="body-xs" color="muted">
                    {t("practice.pe.waitForGrading")}
                </Typography>
            ) : null}

            <Button
                variant="primary"
                className="self-start"
                isDisabled={!canSubmit}
                isPending={busy}
                onPress={onPress}
            >
                {t("practice.pe.submit")}
            </Button>
        </section>
    )
}
