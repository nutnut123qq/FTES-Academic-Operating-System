"use client"

import { useCallback, useEffect, useMemo } from "react"
import { useTranslations } from "next-intl"
import validator from "validator"
import _ from "lodash"
import { useSignInStore } from "./store"
import { useAuthenticationOverlayState } from "@/hooks/zustand/overlay/hooks"
import { useMutateSignInInitSwr } from "@/hooks/swr/api/graphql/mutations/useMutateSignInInitSwr"
import { useMutateSignInVerifyOtpSwr } from "@/hooks/swr/api/graphql/mutations/useMutateSignInVerifyOtpSwr"
import { useQueryCheckEmailExistsSwr } from "@/hooks/swr/api/graphql/queries/useQueryCheckEmailExistsSwr"
import { useGraphQLWithToast } from "@/modules/toast/hooks"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { resetSignInState, setSignInState, SignInState } from "@/redux/slices/state"

/**
 * Sign-in form hook (replaces the formik singleton) — state SHARED via {@link useSignInStore} so it
 * survives the Credentials→OTP step transition. Returns a formik-compatible shape (`values/errors/
 * touched/submitForm/setFieldValue/setFieldTouched/isSubmitting`) so consumers need no changes. The
 * current step comes from redux `state.signInState`. Includes a debounced email-exists check (bloom filter).
 */
export const useSignInForm = () => {
    const t = useTranslations()
    const runGraphQL = useGraphQLWithToast()
    const dispatch = useAppDispatch()
    const signInState = useAppSelector((state) => state.state.signInState)
    const { trigger: mutateSignInInit } = useMutateSignInInitSwr()
    const { trigger: mutateSignInVerifyOtp } = useMutateSignInVerifyOtpSwr()
    const { trigger: queryCheckEmailExists } = useQueryCheckEmailExistsSwr()
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

    /** Errors computed live, conditional on the step (replaces the old Yup `.when`). */
    const errors = useMemo(() => {
        const result: { email?: string, password?: string, otp?: string } = {}
        const trimmedEmail = email.trim()
        if (!trimmedEmail) {
            result.email = t("auth.signIn.email.required")
        } else if (!validator.isEmail(trimmedEmail)) {
            result.email = t("auth.signIn.email.invalid")
        } else if (!emailExists) {
            result.email = t("auth.signIn.email.notExists")
        }
        if (signInState === SignInState.Credentials) {
            if (!password) {
                result.password = t("auth.signIn.password.required")
            } else if (password.length < 8) {
                result.password = t("auth.signIn.password.minLength")
            }
        }
        if (signInState === SignInState.OTP) {
            if (!otp) {
                result.otp = t("auth.signIn.otp.required")
            } else if (!/^\d{6}$/.test(otp)) {
                result.otp = t("auth.signIn.otp.invalid")
            }
        }
        return result
    }, [email, emailExists, password, otp, signInState, t])

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

    const submitForm = useCallback(async () => {
        setIsSubmitting(true)
        try {
            if (signInState === SignInState.Credentials) {
                let nextChallengeId: string | undefined
                const ok = await runGraphQL(
                    async () => {
                        const apolloResult = await mutateSignInInit({
                            request: { email, password },
                            headers: captchaToken ? { "x-captcha-token": captchaToken } : undefined,
                        })
                        const env = apolloResult.data?.signInInit
                        if (!env) {
                            throw new Error("signIn init failed")
                        }
                        nextChallengeId = env.data?.challengeId
                        if (!env.success || !nextChallengeId) {
                            throw new Error(env.error ?? env.message ?? "signIn init failed")
                        }
                        return env
                    },
                    { showErrorToast: true, showSuccessToast: true },
                )
                if (!ok) {
                    return
                }
                setValue("challengeId", nextChallengeId)
                setValue("otp", "")
                dispatch(setSignInState(SignInState.OTP))
                return
            }
            const ok = await runGraphQL(
                async () => {
                    if (!challengeId) {
                        throw new Error("challengeId is required")
                    }
                    const apolloResult = await mutateSignInVerifyOtp({ request: { challengeId, otp } })
                    const verifyEnv = apolloResult.data?.signInVerifyOtp
                    if (!verifyEnv) {
                        throw new Error("signInVerifyOtp failed")
                    }
                    return verifyEnv
                },
                { showErrorToast: true, showSuccessToast: true },
            )
            if (!ok) {
                return
            }
            reset()
            dispatch(resetSignInState())
            onAuthenticationClose()
        } finally {
            setIsSubmitting(false)
        }
    }, [signInState, email, password, challengeId, otp, captchaToken, mutateSignInInit, mutateSignInVerifyOtp, setValue, dispatch, reset, onAuthenticationClose, setIsSubmitting, runGraphQL])

    // Debounced bloom-filter email-exists check (same as the old formik core).
    useEffect(() => {
        const controller = new AbortController()
        const debounced = _.debounce(async () => {
            const trimmed = email.trim()
            if (!trimmed || !validator.isEmail(trimmed)) {
                return
            }
            const result = await queryCheckEmailExists({ request: { email: trimmed }, signal: controller.signal })
            if (result.isBloomFilterReady) {
                setValue("emailExists", result.exists)
            }
        }, 300)
        debounced()
        return () => {
            controller.abort()
            debounced.cancel()
        }
    }, [email, queryCheckEmailExists, setValue])

    return { values, errors, touched, submitForm, setFieldValue, setFieldTouched, isSubmitting }
}
