"use client"

/**
 * **Sign-in step 3** — TOTP challenge shown when login returns
 * `{mfaRequired: true, challengeId}` (spec `auth-two-factor`, login challenge
 * scenario).
 *
 * The code is step-local state (it never survives the step), verified through
 * the real `POST /api/v1/auth/mfa/verify` endpoint via
 * {@link usePostVerifyMfaChallengeSwr} — the hook persists the returned token
 * pair; success finalises sign-in (reset store + flow state, close the modal).
 */
import React, { useState } from "react"
import { Button, FieldError, InputOTP, Modal, Spinner, TextField } from "@heroui/react"
import { useTranslations } from "next-intl"
import { usePostVerifyMfaChallengeSwr } from "@/hooks/swr/api/rest/mutations/usePostVerifyMfaChallengeSwr"
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
    const challengeId = useSignInStore((state) => state.challengeId)
    const { trigger: verifyChallenge, isMutating: isVerifying } = usePostVerifyMfaChallengeSwr()
    const [code, setCode] = useState("")
    const [isInvalid, setIsInvalid] = useState(false)

    const onSubmit = async () => {
        if (!challengeId) {
            setIsInvalid(true)
            return
        }
        try {
            const result = await verifyChallenge({ challengeId, code })
            if (!result?.accessToken) {
                setIsInvalid(true)
                return
            }
        } catch {
            // wrong/expired TOTP code — the backend rejects the challenge
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
