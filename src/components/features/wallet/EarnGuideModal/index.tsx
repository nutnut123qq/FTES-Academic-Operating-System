"use client"

import React from "react"
import { Button, Modal, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import {
    ArrowRightIcon,
    CoinsIcon,
    LightbulbIcon,
    TargetIcon,
    UploadSimpleIcon,
    UsersThreeIcon,
} from "@phosphor-icons/react"
import { FtesMascot, type MascotPose } from "@/components/reuseable/FtesMascot"
import { pathConfig } from "@/resources/path"

/** Props for {@link EarnGuideModal}. */
export interface EarnGuideModalProps {
    isOpen: boolean
    onClose: () => void
    /** Opens the referral dialog — the "invite a friend" way is acted on there, not here. */
    onInviteFriend: () => void
    /** Opens the top-up dialog. */
    onTopup: () => void
}

/**
 * How the reader can actually get coins.
 *
 * Every entry below is a mechanism that EXISTS in the backend today, with the amount read
 * from the code that pays it — nothing aspirational, because a guide that promises coins
 * the system never credits is worse than no guide:
 *
 *  - `quests`      — `gamification.quests` seed (V221): six daily quests paying 50 or 100
 *                    coins each, credited through `ftes.wallet.credit-requests`.
 *  - `contribute`  — `ContributionRewardService` + `ResourceRewardProperties`: 500 coins
 *                    when a submitted resource is APPROVED, once per resource
 *                    (idempotency key `resource-approved:{id}`).
 *  - `invite`      — `ReferralService.qualifyOnPaidOrder` + `wallet.referral-bonus` (500):
 *                    paid to BOTH sides, and only once the invited friend has PAID for a
 *                    course. Signing up alone does not pay — the copy says so.
 *  - `topup`       — not earning at all; listed last and labelled as a purchase so the
 *                    reader is never left thinking a transfer counts as a reward.
 *
 * The gamification reward pool (`claimRewardPool`) can also pay coins, but no screen in
 * this app opens one, so listing it would be a dead end. Left out on purpose.
 */
type EarnWayId = "quests" | "contribute" | "invite" | "topup"

interface EarnWay {
    id: EarnWayId
    /**
     * Illustration slot. Today it is a FrosTES pose from `public/mascot/*.webp`; when the
     * designed artwork set arrives, swapping these four poses for the new images (or
     * replacing this field with an `imageUrl`) re-skins the whole guide from one place.
     */
    pose: MascotPose
    icon: React.ComponentType<{ className?: string }>
    accent: string
}

const EARN_WAYS: Array<EarnWay> = [
    { id: "quests", pose: "point", icon: TargetIcon, accent: "text-accent" },
    { id: "contribute", pose: "explain", icon: UploadSimpleIcon, accent: "text-success" },
    { id: "invite", pose: "cheer", icon: UsersThreeIcon, accent: "text-warning" },
    { id: "topup", pose: "greeting", icon: CoinsIcon, accent: "text-muted" },
]

/**
 * "Bí Kíp Cày Xu" — the lightbulb guide listing every real way to get FCoin.
 *
 * Each way is one card: illustration slot + icon, what it pays, and a CTA that takes the
 * reader to the surface where it happens (quest board, resource hub) or opens the dialog
 * that does it (invite, top-up).
 */
export const EarnGuideModal = ({
    isOpen,
    onClose,
    onInviteFriend,
    onTopup,
}: EarnGuideModalProps) => {
    const t = useTranslations("wallet.earnGuide")
    const router = useRouter()

    /** Where each card's CTA leads. Navigation closes the guide first, so the reader
     *  does not come back to a dialog stacked over a page they already left. */
    const act = (id: EarnWayId) => {
        switch (id) {
        case "quests":
            onClose()
            router.push(pathConfig().locale().quests().build())
            break
        case "contribute":
            onClose()
            router.push(pathConfig().locale().resources().build())
            break
        case "invite":
            onClose()
            onInviteFriend()
            break
        case "topup":
            onClose()
            onTopup()
            break
        }
    }

    return (
        <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
            <Modal.Backdrop>
                <Modal.Container>
                    <Modal.Dialog className="w-full max-w-2xl">
                        <Modal.Header>
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-xl bg-warning/10 text-warning">
                                    <LightbulbIcon className="size-5" />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <Typography type="h6" weight="bold">
                                        {t("title")}
                                    </Typography>
                                    <Typography type="body-xs" color="muted">
                                        {t("subtitle")}
                                    </Typography>
                                </div>
                            </div>
                        </Modal.Header>

                        <Modal.Body className="flex flex-col gap-3 py-2">
                            {EARN_WAYS.map(({ id, pose, icon: Icon, accent }) => (
                                <div
                                    key={id}
                                    className="flex items-start gap-4 rounded-2xl border border-separator p-4"
                                >
                                    {/* Illustration slot — placeholder art, see `EarnWay.pose`. */}
                                    <FtesMascot pose={pose} size="sm" className="hidden sm:inline-flex" />
                                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Icon className={`size-5 shrink-0 ${accent}`} aria-hidden="true" />
                                            <Typography type="body-sm" weight="bold">
                                                {t(`ways.${id}.title`)}
                                            </Typography>
                                            <Typography
                                                type="body-xs"
                                                weight="semibold"
                                                className={`rounded-full bg-default/40 px-2 py-0.5 ${accent}`}
                                            >
                                                {t(`ways.${id}.reward`)}
                                            </Typography>
                                        </div>
                                        <Typography type="body-xs" color="muted">
                                            {t(`ways.${id}.description`)}
                                        </Typography>
                                        <div className="pt-1">
                                            <Button
                                                size="sm"
                                                variant="tertiary"
                                                onPress={() => act(id)}
                                            >
                                                {t(`ways.${id}.cta`)}
                                                <ArrowRightIcon className="size-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <Typography type="body-xs" color="muted">
                                {t("footnote")}
                            </Typography>
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
