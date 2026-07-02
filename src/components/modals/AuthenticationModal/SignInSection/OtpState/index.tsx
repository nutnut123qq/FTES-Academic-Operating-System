"use client"

/**
 * **Sign-in step 2** — OTP entry after `signInInit` succeeds.
 *
 * Same singleton Formik as credentials step. Description uses `t.rich` so the email can be styled.
 * Submit runs the OTP verify branch in `useSignInForm` while `signInState === OTP`.
 *
 * @see {@link SignInSection} for step routing; mirror this folder when sign-up adds a verify-email step.
 */
import React, { useEffect } from "react"
import { Button, cn, FieldError, InputOTP, Link, Modal, Spinner, TextField } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useMutateSignInResendOtpSwr } from "@/hooks/swr/api/graphql/mutations/useMutateSignInResendOtpSwr"
import { useResendCooldown } from "@/hooks/reuseables/useResendCooldown"
import { useSignInForm } from "@/hooks/zustand/signIn/useSignInForm"
import { useGraphQLWithToast } from "@/modules/toast/hooks"

/**
 * OTPState component.
 *
 * @param props Props for OTPState component.
 */
export const OtpState = () => {
    const t = useTranslations()
    const runGraphQL = useGraphQLWithToast()
    const { trigger: mutateSignInResendOtp, isMutating: isResending } = useMutateSignInResendOtpSwr()
    const {
        values,
        errors,
        touched,
        submitForm,
        setFieldValue,
        setFieldTouched,
        isSubmitting,
    } = useSignInForm()

    const { remaining, isCoolingDown, start } = useResendCooldown()
    // a code was just dispatched by signInInit — gate the first resend too
    useEffect(() => {
        start()
    }, [start])

    const onResend = async () => {
        const challengeId = values.challengeId
        if (!challengeId) {
            return
        }
        const ok = await runGraphQL(
            async () => {
                const apolloResult = await mutateSignInResendOtp({
                    request: {
                        challengeId,
                    },
                })
                const env = apolloResult.data?.signInResendOtp
                if (!env?.success || !env.data?.challengeId) {
                    throw new Error(
                        env?.error ?? env?.message ?? "signInResendOtp failed"
                    )
                }
                await setFieldValue("challengeId", env.data.challengeId)
                await setFieldValue("otp", "", true)
                return env
            },
            {
                showErrorToast: true,
                showSuccessToast: true,
            }
        )
        if (ok) {
            start()
        }
    }

    return (
        <>
            <Modal.CloseTrigger />
            <Modal.Header>
                <div className="text-center">
                    <div className="font-semibold text-lg">{t("auth.signIn.otp.title")}</div>
                </div>
            </Modal.Header>
            <Modal.Body>
                <div className="text-xs text-muted text-center">
                    {t.rich("auth.signIn.otp.desc", {
                        emailHighlight: (chunks) => (
                            <span className="text-accent">{chunks}</span>
                        ),
                        email: values.email,
                    })}
                </div>
                <div className="text-xs text-muted text-center">{t("auth.otp.expiryHint")}</div>
                <div className="h-3" />
                <TextField variant="secondary" isInvalid={!!(touched.otp && errors.otp)}>
                    <InputOTP
                        id="sign-in-otp"
                        name="otp"
                        variant="secondary"
                        maxLength={6}
                        value={values.otp}
                        onChange={(value) => setFieldValue("otp", value)}
                        onBlur={() => setFieldTouched("otp", true)}
                    >
                        <InputOTP.Group>
                            <InputOTP.Slot index={0} />
                            <InputOTP.Slot index={1} />
                            <InputOTP.Slot index={2} />
                        </InputOTP.Group>
                        <InputOTP.Separator />
                        <InputOTP.Group>
                            <InputOTP.Slot index={3} />
                            <InputOTP.Slot index={4} />
                            <InputOTP.Slot index={5} />
                        </InputOTP.Group>
                    </InputOTP>
                    <FieldError className="text-center">{errors.otp}</FieldError>
                </TextField>
                <div className="h-3" />
                <div className="flex flex-wrap items-center justify-center gap-1.5 text-center">
                    <span className="text-xs text-muted">{t("auth.signIn.otp.resend")}</span>
                    <Link
                        className={cn("text-xs text-accent", (isResending || isCoolingDown) ? "text-muted" : "")}
                        data-disabled={(isResending || isCoolingDown) ? true : undefined}
                        onPress={() => {
                            if (isResending || isCoolingDown) return
                            void onResend()
                        }}
                    >
                        {isCoolingDown
                            ? t("auth.otp.resendCooldown", { seconds: remaining })
                            : t("auth.signIn.otp.resendLink")}
                    </Link>
                </div>
                <div className="h-3" />
                <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    isPending={isSubmitting}
                    onPress={() => submitForm()}
                >
                    {({isPending}) => (
                        <>
                            {isPending ? <Spinner color="current" size="sm" /> : null}
                            {t("auth.signIn.otp.submit")}
                        </>
                    )}
                </Button>
            </Modal.Body>
        </>
    )
}
