"use client"

/**
 * **Sign-up step 2** — OTP after `POST /auth/register`; resend = calling `register` again with the
 * same email (the backend treats a register on an UNVERIFIED email as an idempotent OTP resend,
 * 60s cooldown), via {@link usePostRegisterSwr}.
 *
 * Submit runs `POST /auth/register/verify` via {@link useSignUpForm} while `signUpState === Otp`.
 */
import React, { useEffect } from "react"
import { Button, cn, FieldError, InputOTP, Link, Modal, Spinner, TextField } from "@heroui/react"
import { useTranslations } from "next-intl"
import { usePostRegisterSwr } from "@/hooks/swr/api/rest/mutations/usePostRegisterSwr"
import { useResendCooldown } from "@/hooks/reuseables/useResendCooldown"
import { useSignUpForm } from "@/hooks/zustand/signUp/useSignUpForm"
import { useRestWithToast } from "@/modules/toast/hooks"

/**
 * OTP entry for completing REST sign-up (mirrors sign-in `OTPState`).
 */
export const OtpState = () => {
    const t = useTranslations()
    const runRest = useRestWithToast()
    const { trigger: mutateRegister, isMutating: isResending } = usePostRegisterSwr()
    const {
        values,
        errors,
        touched,
        submitForm,
        setFieldValue,
        setFieldTouched,
        isSubmitting,
        isValid,
    } = useSignUpForm()

    const { remaining, isCoolingDown, start } = useResendCooldown()
    // a code was just dispatched by POST /auth/register — gate the first resend too
    useEffect(() => {
        start()
    }, [start])

    /**
     * Resend = `POST /auth/register` again with the same email+password (still in the shared
     * sign-up store): the account is PENDING_VERIFICATION, so the backend performs an idempotent
     * OTP resend (no new account; within the 60s server cooldown it still returns 200).
     */
    const onResend = async () => {
        const ok = await runRest(
            () => mutateRegister({ email: values.email.trim(), password: values.password }),
            {
                showErrorToast: true,
                showSuccessToast: true,
                successMessage: t("auth.signUp.otp.sent"),
            },
        )
        if (ok) {
            setFieldValue("otp", "")
            start()
        }
    }

    return (
        <>
            <Modal.CloseTrigger />
            <Modal.Header>
                <div className="text-center">
                    <div className="font-semibold text-lg">{t("auth.signUp.otp.title")}</div>
                </div>
            </Modal.Header>
            <Modal.Body>
                <div className="text-xs text-muted text-center">
                    {
                        t.rich("auth.signUp.otp.desc", {
                            emailHighlight: (chunks) => (
                                <span className="text-accent">{chunks}</span>
                            ),
                            email: values.email,
                        }
                        )
                    }
                </div>
                <div className="text-xs text-muted text-center">{t("auth.otp.expiryHint")}</div>
                <div className="h-3" />
                <TextField variant="secondary" isInvalid={!!(touched.otp && errors.otp)}>
                    <InputOTP
                        id="sign-up-otp"
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
                    <span className="text-xs text-muted">{t("auth.signUp.otp.resend")}</span>
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
                            : t("auth.signUp.otp.resendLink")}
                    </Link>
                </div>
                <div className="h-3" />
                <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    isDisabled={!isValid}
                    isPending={isSubmitting}
                    onPress={() => submitForm()}
                >
                    {({ isPending }) => (
                        <>
                            {isPending ? <Spinner color="current" size="sm" /> : null}
                            {t("auth.signUp.otp.submit")}
                        </>
                    )}
                </Button>
            </Modal.Body>
        </>
    )
}
