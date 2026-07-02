"use client"

/**
 * **Sign-in step 3** — TOTP challenge shown after OTP verify when the account
 * has 2FA enabled (spec `auth-two-factor`, login challenge scenario).
 *
 * The code is step-local state (it never survives the step), verified through
 * the {@link use2fa} mock service; success finalises sign-in exactly like the
 * OTP step (reset store + flow state, close the modal).
 */
import React, { useState } from "react"
import { Button, FieldError, InputOTP, Modal, Spinner, TextField } from "@heroui/react"
import { useTranslations } from "next-intl"
import { use2fa } from "@/hooks/auth"
import { useAuthenticationOverlayState } from "@/hooks/zustand/overlay/hooks"
import { useSignInStore } from "@/hooks/zustand/signIn/store"
import { useAppDispatch } from "@/redux/hooks"
import { resetSignInState } from "@/redux/slices/state"

/**
 * TOTP challenge step for the sign-in tab.
 */
export const TwoFactorState = () => {
    const t = useTranslations()
    const dispatch = useAppDispatch()
    const { close } = useAuthenticationOverlayState()
    const reset = useSignInStore((state) => state.reset)
    const { verifyChallenge, isVerifying } = use2fa()
    const [code, setCode] = useState("")
    const [isInvalid, setIsInvalid] = useState(false)

    const onSubmit = async () => {
        const ok = await verifyChallenge(code)
        if (!ok) {
            setIsInvalid(true)
            return
        }
        reset()
        dispatch(resetSignInState())
        close()
    }

    return (
        <>
            <Modal.CloseTrigger />
            <Modal.Header>
                <div className="text-center">
                    <div className="font-semibold text-lg">{t("auth.signIn.twoFactor.title")}</div>
                </div>
            </Modal.Header>
            <Modal.Body>
                <div className="text-xs text-muted text-center">
                    {t("auth.signIn.twoFactor.desc")}
                </div>
                <div className="h-3" />
                <TextField variant="secondary" isInvalid={isInvalid}>
                    <InputOTP
                        id="sign-in-two-factor"
                        name="twoFactorCode"
                        variant="secondary"
                        maxLength={6}
                        value={code}
                        onChange={(value) => {
                            setCode(value)
                            setIsInvalid(false)
                        }}
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
                    <FieldError className="text-center">{t("auth.signIn.twoFactor.invalid")}</FieldError>
                </TextField>
                <div className="h-3" />
                <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    isPending={isVerifying}
                    isDisabled={code.length !== 6 || isVerifying}
                    onPress={() => void onSubmit()}
                >
                    {({ isPending }) => (
                        <>
                            {isPending ? <Spinner color="current" size="sm" /> : null}
                            {t("auth.signIn.twoFactor.submit")}
                        </>
                    )}
                </Button>
            </Modal.Body>
        </>
    )
}
