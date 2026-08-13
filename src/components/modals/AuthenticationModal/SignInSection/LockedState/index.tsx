"use client"

/**
 * **Bước đăng nhập — tài khoản bị khoá.** Hiện khi `POST /auth/login` trả 423
 * `IDENTITY_ACCOUNT_LOCKED`.
 *
 * Là một BƯỚC riêng chứ không phải một toast, vì có hai thứ toast không làm được: nói cho người
 * dùng biết **vì sao** họ bị khoá (backend soạn lý do từ đúng các thiết bị đã đăng nhập), và cho
 * họ **một chỗ để kêu** — mà toast thì biến mất sau vài giây.
 *
 * Form xin mở khoá gửi lại `identifier + password` đang nằm trong store: tài khoản bị khoá đã bị
 * thu hồi mọi phiên, nên mật khẩu là bằng chứng sở hữu duy nhất còn dùng được (xem
 * `identity-device-ban-appeal` §1 phía backend).
 */
import React, { useState } from "react"
import { Button, FieldError, Input, Spinner, TextField, Typography, Modal } from "@heroui/react"
import { useFormatter, useTranslations } from "next-intl"
import { LockIcon } from "@phosphor-icons/react"
import { Callout } from "@/components/blocks/feedback/Callout"
import { usePostUnlockAppealSwr } from "@/hooks/swr/api/rest/mutations/usePostUnlockAppealSwr"
import { useAuthenticationOverlayState } from "@/hooks/zustand/overlay/hooks"
import { useSignInStore } from "@/hooks/zustand/signIn/store"
import { useAppDispatch } from "@/redux/hooks"
import { setSignInState, SignInState } from "@/redux/slices/state"

/** Trần độ dài lời trình bày — khớp cột `message varchar(2000)` của backend. */
const MESSAGE_MAX = 2000
/** Dưới mức này thì lời trình bày không đủ để người duyệt quyết được gì. */
const MESSAGE_MIN = 20

export const LockedState = () => {
    const t = useTranslations()
    const format = useFormatter()
    const dispatch = useAppDispatch()
    const { close } = useAuthenticationOverlayState()

    const email = useSignInStore((state) => state.email)
    const password = useSignInStore((state) => state.password)
    const lockInfo = useSignInStore((state) => state.lockInfo)
    const reset = useSignInStore((state) => state.reset)

    const { trigger: submitAppeal, isMutating } = usePostUnlockAppealSwr()
    const [message, setMessage] = useState("")
    const [sent, setSent] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const canAppeal = lockInfo?.canAppeal ?? false
    const violationCount = lockInfo?.violationCount ?? 0

    const onSubmit = async () => {
        setError(null)
        try {
            await submitAppeal({ identifier: email.trim(), password, message: message.trim() })
            setSent(true)
        } catch (e) {
            // Lỗi ở đây là thông tin hữu ích (sai mật khẩu, đã có đơn chờ, gửi quá nhiều) nên hiện
            // TẠI CHỖ thay vì toast — người dùng đang đứng trong đúng form vừa gửi.
            setError(e instanceof Error ? e.message : t("auth.signIn.locked.appealFailed"))
        }
    }

    const onBack = () => {
        reset()
        dispatch(setSignInState(SignInState.Credentials))
    }

    return (
        <>
            <Modal.CloseTrigger />
            <Modal.Header>
                <div className="flex flex-col items-center gap-2 text-center">
                    <LockIcon className="size-8 text-danger" aria-hidden focusable="false" />
                    <Typography type="h6" weight="bold">
                        {t("auth.signIn.locked.title")}
                    </Typography>
                </div>
            </Modal.Header>
            <Modal.Body>
                <div className="flex flex-col gap-4">
                    <Callout
                        status="danger"
                        title={t("auth.signIn.locked.reasonLabel")}
                        description={lockInfo?.reason || t("auth.signIn.locked.reasonUnknown")}
                    />

                    <div className="flex flex-col gap-0">
                        {lockInfo?.lockedAt && (
                            <Typography type="body-sm" color="muted">
                                {t("auth.signIn.locked.lockedAt", {
                                    date: format.dateTime(new Date(lockInfo.lockedAt), {
                                        dateStyle: "medium",
                                        timeStyle: "short",
                                    }),
                                })}
                            </Typography>
                        )}
                        {lockInfo?.unlockAt && (
                            <Typography type="body-sm" color="muted">
                                {t("auth.signIn.locked.unlockAt", {
                                    date: format.dateTime(new Date(lockInfo.unlockAt), {
                                        dateStyle: "medium",
                                        timeStyle: "short",
                                    }),
                                })}
                            </Typography>
                        )}
                        {violationCount > 0 && (
                            <Typography type="body-sm" color="muted">
                                {t("auth.signIn.locked.violationCount", { count: violationCount })}
                            </Typography>
                        )}
                    </div>

                    {sent ? (
                        <Callout
                            status="success"
                            title={t("auth.signIn.locked.appealSentTitle")}
                            description={t("auth.signIn.locked.appealSentDesc")}
                        />
                    ) : lockInfo?.hasPendingAppeal ? (
                        <Callout status="warning" title={t("auth.signIn.locked.appealPending")} />
                    ) : canAppeal ? (
                        <div className="flex flex-col gap-3">
                            <Typography type="body-sm">{t("auth.signIn.locked.appealIntro")}</Typography>
                            <TextField variant="secondary" isInvalid={Boolean(error)}>
                                <Input
                                    id="unlock-appeal-message"
                                    name="unlockAppealMessage"
                                    variant="secondary"
                                    placeholder={t("auth.signIn.locked.appealPlaceholder")}
                                    maxLength={MESSAGE_MAX}
                                    value={message}
                                    onChange={(event) => {
                                        setMessage(event.target.value)
                                        setError(null)
                                    }}
                                />
                                <FieldError>{error}</FieldError>
                            </TextField>
                            <Button
                                variant="primary"
                                fullWidth
                                isPending={isMutating}
                                isDisabled={message.trim().length < MESSAGE_MIN || isMutating}
                                onPress={() => void onSubmit()}
                            >
                                {({ isPending }) => (
                                    <>
                                        {isPending ? <Spinner color="current" size="sm" /> : null}
                                        {t("auth.signIn.locked.appealSubmit")}
                                    </>
                                )}
                            </Button>
                        </div>
                    ) : (
                        <Callout status="warning" title={t("auth.signIn.locked.appealUnavailable")} />
                    )}

                    <Button variant="tertiary" fullWidth onPress={sent ? close : onBack}>
                        {sent ? t("common.close") : t("common.back")}
                    </Button>
                </div>
            </Modal.Body>
        </>
    )
}
