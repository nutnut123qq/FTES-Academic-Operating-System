"use client"

import { useCallback, useMemo } from "react"
import { useTranslations } from "next-intl"
import validator from "validator"
import { useSignInStore } from "./store"
import { useAuthenticationOverlayState } from "@/hooks/zustand/overlay/hooks"
import { usePostKeycloakLoginSwr } from "@/hooks/swr/api/rest/mutations/usePostKeycloakLoginSwr"
import { useRestWithToast } from "@/modules/toast/hooks"
import { LocalStorage } from "@/modules/storage/local/storage"
import { LocalStorageId } from "@/modules/storage/local/enums/id"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { resetSignInState, SignInState } from "@/redux/slices/state"

/**
 * Sign-in form hook (replaces the formik singleton) — state SHARED via {@link useSignInStore} so it
 * survives any step transition. Returns a formik-compatible shape (`values/errors/touched/submitForm/
 * setFieldValue/setFieldTouched/isSubmitting`) so consumers need no changes.
 *
 * Login is a SINGLE-STEP REST call (`POST /api/v1/auth/login`) via {@link usePostKeycloakLoginSwr}:
 * the backend exposes no GraphQL auth mutations and returns the access token directly (no email-OTP,
 * `mfaRequired: null`). The old 2-step GraphQL init/verify-OTP flow and the debounced
 * `checkEmailExists` bloom-filter gate (also GraphQL-only) have been removed. `SignInState.OTP` is no
 * longer reached for sign-in; its components stay build-safe but unused.
 */
export const useSignInForm = () => {
    const t = useTranslations()
    const runRest = useRestWithToast()
    const dispatch = useAppDispatch()
    const signInState = useAppSelector((state) => state.state.signInState)
    const { trigger: keycloakLogin } = usePostKeycloakLoginSwr()
    const { close: onAuthenticationClose } = useAuthenticationOverlayState()

    const email = useSignInStore((state) => state.email)
    const emailExists = useSignInStore((state) => state.emailExists)
    const password = useSignInStore((state) => state.password)
    const otp = useSignInStore((state) => state.otp)
    const challengeId = useSignInStore((state) => state.challengeId)
    const captchaToken = useSignInStore((state) => state.captchaToken)
    const rememberMe = useSignInStore((state) => state.rememberMe)
    const touched = useSignInStore((state) => state.touched)
    const isSubmitting = useSignInStore((state) => state.isSubmitting)
    const setValue = useSignInStore((state) => state.setValue)
    const setTouchedStore = useSignInStore((state) => state.setTouched)
    const setIsSubmitting = useSignInStore((state) => state.setIsSubmitting)
    const reset = useSignInStore((state) => state.reset)

    const values = useMemo(
        () => ({ state: signInState, email, emailExists, password, otp, challengeId, captchaToken, rememberMe }),
        [signInState, email, emailExists, password, otp, challengeId, captchaToken, rememberMe],
    )

    /**
     * Errors computed live. Email is validated for format only (required + `isEmail`) — the old
     * `checkEmailExists` "notExists" gate is gone (backend has no such endpoint; it blocked login).
     */
    const errors = useMemo(() => {
        const result: { email?: string, password?: string, otp?: string } = {}
        const trimmedEmail = email.trim()
        if (!trimmedEmail) {
            result.email = t("auth.signIn.email.required")
        } else if (!validator.isEmail(trimmedEmail)) {
            result.email = t("auth.signIn.email.invalid")
        }
        if (signInState === SignInState.Credentials) {
            if (!password) {
                result.password = t("auth.signIn.password.required")
            } else if (password.length < 8) {
                result.password = t("auth.signIn.password.minLength")
            }
        }
        // OTP validation is retained for build-safety; the OTP step is no longer reached for sign-in.
        if (signInState === SignInState.OTP) {
            if (!otp) {
                result.otp = t("auth.signIn.otp.required")
            } else if (!/^\d{6}$/.test(otp)) {
                result.otp = t("auth.signIn.otp.invalid")
            }
        }
        return result
    }, [email, password, otp, signInState, t])

    const setFieldValue = useCallback(
        // 3rd arg `shouldValidate` (formik-compat) is ignored — errors are always computed live.
        (field: string, value: string | boolean | undefined, shouldValidate?: boolean) => {
            void shouldValidate
            setValue(field as Parameters<typeof setValue>[0], value)
        },
        [setValue],
    )
    const setFieldTouched = useCallback(
        // only track touched for email/password/otp; other fields (rememberMe) are ignored.
        (field: string, value = true, shouldValidate?: boolean) => {
            void shouldValidate
            if (field === "email" || field === "password" || field === "otp") {
                setTouchedStore(field, value)
            }
        },
        [setTouchedStore],
    )

    /**
     * Single-step REST sign-in. Calls the fixed login hook with `{identifier, password}`; on success
     * the hook has already persisted the access token to LocalStorage + redux
     * (`setAccessToken`/`setAuthenticated`). We then persist the remember-me preference, reset the
     * form, clear the step machine and close the auth modal. Failures surface via the REST toast.
     */
    const submitForm = useCallback(async () => {
        setIsSubmitting(true)
        try {
            const result = await runRest(
                () => keycloakLogin({
                    identifier: email.trim(),
                    password,
                    captchaToken: captchaToken || undefined,
                }),
                { showErrorToast: true, showSuccessToast: true },
            )
            // `null` → login threw (toast already shown); no token means MFA/edge case — keep modal open.
            if (!result?.accessToken) {
                return
            }
            // persist the remember-me preference once sign-in succeeds (spec auth-session-preferences)
            LocalStorage.setItem(LocalStorageId.AuthRememberMe, rememberMe)
            reset()
            dispatch(resetSignInState())
            onAuthenticationClose()
        } finally {
            setIsSubmitting(false)
        }
    }, [email, password, captchaToken, rememberMe, keycloakLogin, runRest, dispatch, reset, onAuthenticationClose, setIsSubmitting])

    return { values, errors, touched, submitForm, setFieldValue, setFieldTouched, isSubmitting }
}
