"use client"

import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslations } from "next-intl"
import { usePostChangePasswordSwr } from "@/hooks/swr/api/rest/mutations/usePostChangePasswordSwr"
import { useRestWithToast } from "@/modules/toast/hooks"

/**
 * Minimum password length. Mirrors the backend policy documented on
 * `RegisterRequest` (">=8 chars, must contain letter+digit") so the learner is told
 * about a weak password before the round trip, not after a 400.
 */
export const PASSWORD_MIN_LENGTH = 8

/** A password is accepted only if it carries at least one letter AND one digit. */
const LETTER_AND_DIGIT = /^(?=.*[A-Za-z])(?=.*\d).+$/

/** Editable change-password form values. */
export interface ChangePasswordFormValues {
    /** The password in use right now — proves the learner owns the session. */
    currentPassword: string
    /** The replacement password. */
    newPassword: string
    /** The replacement password, typed again. */
    confirmPassword: string
}

/** Localized validation copy, injected so the schema factory stays pure + testable. */
export interface ChangePasswordSchemaMessages {
    /** Shown when a required field is empty. */
    required: string
    /** Shown when the new password is shorter than {@link PASSWORD_MIN_LENGTH}. */
    tooShort: string
    /** Shown when the new password has no letter+digit mix. */
    weak: string
    /** Shown when the confirmation does not match the new password. */
    mismatch: string
    /** Shown when the new password equals the current one. */
    sameAsCurrent: string
}

/**
 * Builds the change-password zod schema from already-localized messages.
 *
 * Split out of the hook so it can be unit-tested without React: the hook itself
 * calls it inside `useMemo(…, [t])`, which is what keeps the messages on the ACTIVE
 * locale (a module-level schema would capture whichever locale rendered first).
 *
 * @param messages - Localized validation copy.
 * @returns The zod schema for {@link ChangePasswordFormValues}.
 */
export const createChangePasswordSchema = (messages: ChangePasswordSchemaMessages) =>
    z
        .object({
            currentPassword: z.string().min(1, messages.required),
            newPassword: z
                .string()
                .min(1, messages.required)
                .min(PASSWORD_MIN_LENGTH, messages.tooShort)
                .regex(LETTER_AND_DIGIT, messages.weak),
            confirmPassword: z.string().min(1, messages.required),
        })
        // Both cross-field rules stand down while a field is still EMPTY: an untouched
        // form must read as "fill this in", not as "your new password matches your old
        // one" (which is technically true of two empty strings, and useless advice).
        .refine(
            (values) =>
                values.confirmPassword.length === 0 ||
                values.newPassword === values.confirmPassword,
            { path: ["confirmPassword"], message: messages.mismatch },
        )
        .refine(
            (values) =>
                values.currentPassword.length === 0 ||
                values.newPassword.length === 0 ||
                values.newPassword !== values.currentPassword,
            { path: ["newPassword"], message: messages.sameAsCurrent },
        )

/** Parameters for {@link useChangePasswordForm}. */
export interface UseChangePasswordFormParams {
    /** Called after the password actually changed. */
    onSuccess?: () => void
}

/**
 * react-hook-form for changing the account password from settings.
 *
 * Runs `PUT /identity/password` through {@link useRestWithToast} (never a bare
 * `toast.*`), then clears the fields — the three inputs are write-only secrets, so
 * nothing is left behind for the next person at the keyboard. The backend signs every
 * OTHER device out on success; the surface says so before submit.
 *
 * @param params - {@link UseChangePasswordFormParams}
 * @returns the RHF methods + `onSubmit`.
 */
export const useChangePasswordForm = ({
    onSuccess,
}: UseChangePasswordFormParams = {}) => {
    const t = useTranslations()
    const runRest = useRestWithToast()
    const { trigger } = usePostChangePasswordSwr()

    const schema = useMemo(
        () =>
            createChangePasswordSchema({
                required: t("security.password.required"),
                tooShort: t("security.password.tooShort", { min: PASSWORD_MIN_LENGTH }),
                weak: t("security.password.weak"),
                mismatch: t("security.password.mismatch"),
                sameAsCurrent: t("security.password.sameAsCurrent"),
            }),
        [t],
    )

    const form = useForm<ChangePasswordFormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    })

    const onSubmit = form.handleSubmit(async (values) => {
        // `PUT /identity/password` is a VOID endpoint, so its unwrapped payload is
        // `null` — the same value `runRest` returns on failure. Returning an explicit
        // sentinel is what makes "did it work?" answerable here.
        const changed = await runRest(
            async () => {
                await trigger({
                    currentPassword: values.currentPassword,
                    newPassword: values.newPassword,
                })
                return true
            },
            { successMessage: t("security.password.changed") },
        )
        // Failed (e.g. wrong current password — the toast already explains it):
        // keep what was typed so it can be corrected.
        if (changed === null) {
            return
        }
        form.reset()
        onSuccess?.()
    })

    return { ...form, onSubmit }
}
