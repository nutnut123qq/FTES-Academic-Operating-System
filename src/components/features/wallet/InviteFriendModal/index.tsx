"use client"

import React, { useState } from "react"
import {
    Button,
    Input,
    Modal,
    Spinner,
    TextField,
    Typography,
} from "@heroui/react"
import { useTranslations } from "next-intl"
import {
    CheckIcon,
    CoinsIcon,
    CopyIcon,
    GiftIcon,
    PaperPlaneTiltIcon,
    SparkleIcon,
    UserCheckIcon,
    UsersThreeIcon,
} from "@phosphor-icons/react"
import { useGetMyReferralSwr } from "@/hooks/swr/api/rest/queries/useGetMyReferralSwr"
import { usePostApplyReferralCodeSwr } from "@/hooks/swr/api/rest/mutations/usePostApplyReferralCodeSwr"
import { useRestWithToast } from "@/modules/toast/hooks"

/** Props for {@link InviteFriendModal}. */
export interface InviteFriendModalProps {
    isOpen: boolean
    onClose: () => void
}

/**
 * InviteFriendModal — Affiliate and referral management dialog.
 * Provides the user's personal referral code, shareable link, referral stats,
 * and an option to apply a friend's referral code.
 */
export const InviteFriendModal = ({ isOpen, onClose }: InviteFriendModalProps) => {
    const t = useTranslations("wallet.referral")
    const { data: referralData, isLoading, mutate: mutateReferral } = useGetMyReferralSwr()
    const { trigger: applyCode, isMutating: isApplying } = usePostApplyReferralCodeSwr()
    const runRest = useRestWithToast()

    const [hasCopiedCode, setHasCopiedCode] = useState(false)
    const [hasCopiedLink, setHasCopiedLink] = useState(false)
    const [inputReferralCode, setInputReferralCode] = useState("")
    const [applyError, setApplyError] = useState<string | null>(null)

    const referralCode = referralData?.referralCode || ""
    const referredCount = referralData?.referredCount ?? 0
    const totalBonus = referralData?.totalBonus ?? 0

    const origin = typeof window !== "undefined" ? window.location.origin : ""
    const referralLink = referralCode ? `${origin}/register?ref=${referralCode}` : ""

    const copyToClipboard = async (text: string, type: "code" | "link") => {
        if (!text) return
        try {
            await navigator.clipboard.writeText(text)
            if (type === "code") {
                setHasCopiedCode(true)
                setTimeout(() => setHasCopiedCode(false), 2000)
            } else {
                setHasCopiedLink(true)
                setTimeout(() => setHasCopiedLink(false), 2000)
            }
        } catch {
            // Fallback if clipboard API is not available
        }
    }

    const handleApplyCode = async (event: React.FormEvent) => {
        event.preventDefault()
        const trimmed = inputReferralCode.trim()
        if (!trimmed) return

        setApplyError(null)
        const result = await runRest(
            async () => {
                await applyCode({ referralCode: trimmed })
                return true
            },
            {
                successMessage: t("appliedSuccess"),
            },
        )

        if (result) {
            setInputReferralCode("")
            void mutateReferral()
        } else {
            setApplyError(t("appliedFailed"))
        }
    }

    return (
        <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
            <Modal.Backdrop>
                <Modal.Container>
                    <Modal.Dialog className="w-full max-w-lg">
                        <Modal.Header>
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                                    <GiftIcon className="size-5" />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <Typography type="h6" weight="bold">
                                        {t("inviteTitle")}
                                    </Typography>
                                    <Typography type="body-xs" color="muted">
                                        {t("inviteSubtitle")}
                                    </Typography>
                                </div>
                            </div>
                        </Modal.Header>

                        <Modal.Body className="flex flex-col gap-5 py-2">
                            {/* Referral Code & Link Box */}
                            <div className="flex flex-col gap-3 rounded-2xl border border-separator bg-default/30 p-4">
                                {/* Referral Code */}
                                <div className="flex flex-col gap-1.5">
                                    <Typography type="body-xs" color="muted" weight="medium">
                                        {t("yourCode")}
                                    </Typography>
                                    <div className="flex items-center justify-between gap-2 rounded-xl border border-separator bg-surface px-3 py-2">
                                        <Typography type="body" weight="bold" className="font-mono tracking-wider text-accent">
                                            {isLoading ? "..." : (referralCode || "—")}
                                        </Typography>
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            isDisabled={!referralCode}
                                            onPress={() => void copyToClipboard(referralCode, "code")}
                                        >
                                            {hasCopiedCode ? (
                                                <>
                                                    <CheckIcon className="size-4 text-success" />
                                                    <span className="text-success">{t("copiedCode")}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <CopyIcon className="size-4" />
                                                    {t("copyCode")}
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                {/* Referral Link */}
                                <div className="flex flex-col gap-1.5">
                                    <Typography type="body-xs" color="muted" weight="medium">
                                        {t("yourLink")}
                                    </Typography>
                                    <div className="flex items-center justify-between gap-2 rounded-xl border border-separator bg-surface px-3 py-2">
                                        <Typography type="body-xs" className="truncate font-mono text-muted" title={referralLink}>
                                            {isLoading ? "..." : (referralLink || "—")}
                                        </Typography>
                                        <Button
                                            size="sm"
                                            variant="primary"
                                            isDisabled={!referralLink}
                                            onPress={() => void copyToClipboard(referralLink, "link")}
                                        >
                                            {hasCopiedLink ? (
                                                <>
                                                    <CheckIcon className="size-4 text-white" />
                                                    <span>{t("copiedLink")}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <CopyIcon className="size-4" />
                                                    {t("copyLink")}
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Summary */}
                            <div className="flex flex-col gap-2">
                                <Typography type="body-xs" color="muted" weight="semibold">
                                    {t("statsTitle")}
                                </Typography>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex items-center gap-3 rounded-xl border border-separator bg-default/20 p-3">
                                        <div className="flex size-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                                            <UsersThreeIcon className="size-5" />
                                        </div>
                                        <div className="flex flex-col">
                                            <Typography type="body-xs" color="muted">
                                                {t("referredFriends")}
                                            </Typography>
                                            <Typography type="body" weight="bold" className="tabular-nums">
                                                {referredCount.toLocaleString()}
                                            </Typography>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 rounded-xl border border-separator bg-default/20 p-3">
                                        <div className="flex size-9 items-center justify-center rounded-lg bg-warning/10 text-warning">
                                            <CoinsIcon className="size-5" />
                                        </div>
                                        <div className="flex flex-col">
                                            <Typography type="body-xs" color="muted">
                                                {t("totalBonusEarned")}
                                            </Typography>
                                            <Typography type="body" weight="bold" className="tabular-nums text-warning">
                                                {totalBonus.toLocaleString()}
                                            </Typography>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* How it works */}
                            <div className="flex flex-col gap-2">
                                <Typography type="body-xs" color="muted" weight="semibold">
                                    {t("howItWorksTitle")}
                                </Typography>
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="flex flex-col items-center gap-1 rounded-xl bg-default/15 p-2.5">
                                        <PaperPlaneTiltIcon className="size-5 text-accent" />
                                        <Typography type="body-xs" weight="bold">
                                            {t("step1Title")}
                                        </Typography>
                                        <Typography type="body-xs" color="muted">
                                            {t("step1Desc")}
                                        </Typography>
                                    </div>

                                    <div className="flex flex-col items-center gap-1 rounded-xl bg-default/15 p-2.5">
                                        <UserCheckIcon className="size-5 text-success" />
                                        <Typography type="body-xs" weight="bold">
                                            {t("step2Title")}
                                        </Typography>
                                        <Typography type="body-xs" color="muted">
                                            {t("step2Desc")}
                                        </Typography>
                                    </div>

                                    <div className="flex flex-col items-center gap-1 rounded-xl bg-default/15 p-2.5">
                                        <SparkleIcon className="size-5 text-warning" />
                                        <Typography type="body-xs" weight="bold">
                                            {t("step3Title")}
                                        </Typography>
                                        <Typography type="body-xs" color="muted">
                                            {t("step3Desc")}
                                        </Typography>
                                    </div>
                                </div>
                            </div>

                            {/* Apply Referral Code Section */}
                            <div className="flex flex-col gap-2 border-t border-separator pt-4">
                                <div className="flex flex-col">
                                    <Typography type="body-xs" weight="semibold">
                                        {t("applyCodeTitle")}
                                    </Typography>
                                    <Typography type="body-xs" color="muted">
                                        {t("applyCodeSubtitle")}
                                    </Typography>
                                </div>
                                <form onSubmit={(e) => void handleApplyCode(e)} className="flex items-start gap-2">
                                    <TextField variant="secondary" className="flex-1" isInvalid={Boolean(applyError)}>
                                        <Input
                                            value={inputReferralCode}
                                            onChange={(e) => {
                                                setInputReferralCode(e.target.value)
                                                if (applyError) setApplyError(null)
                                            }}
                                            placeholder={t("applyCodePlaceholder")}
                                            className="font-mono text-sm uppercase"
                                        />
                                    </TextField>
                                    <Button
                                        type="submit"
                                        variant="secondary"
                                        size="sm"
                                        isDisabled={!inputReferralCode.trim() || isApplying}
                                        isPending={isApplying}
                                    >
                                        {({ isPending }) => (
                                            <>
                                                {isPending ? <Spinner color="current" size="sm" /> : null}
                                                {t("applyButton")}
                                            </>
                                        )}
                                    </Button>
                                </form>
                                {applyError ? (
                                    <Typography type="body-xs" className="text-danger" role="alert">
                                        {applyError}
                                    </Typography>
                                ) : null}
                            </div>
                        </Modal.Body>

                        <Modal.Footer className="justify-end">
                            <Button variant="ghost" size="sm" onPress={onClose}>
                                {t("close")}
                            </Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}
