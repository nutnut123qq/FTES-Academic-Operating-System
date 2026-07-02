"use client"

import React, { useEffect, useState } from "react"
import { Modal, Typography, toast } from "@heroui/react"
import { useTranslations } from "next-intl"
import { ConfettiIcon, LightningIcon, StarIcon } from "@phosphor-icons/react"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { subscribeGamificationEvents, type GamificationEvent } from "../engine"

/** A pending "moment" (level-up or milestone) to render as a dismissible overlay. */
type Moment =
    | { kind: "levelUp"; level: number }
    | { kind: "milestone"; days: number; badgeKey: string; coin: number }

/**
 * Listens to mock-engine events and surfaces them: a non-blocking `+XP` toast
 * (role="status", auto-queued by HeroUI so awards never overlap) for every XP
 * award, and a celebratory MOMENT overlay for level-ups and streak milestones.
 *
 * The moment is a HeroUI `Modal` — it closes on Esc / backdrop / the close
 * trigger (keyboard-dismissable per spec). Purely feedback: no data, no engine
 * mutation. Mount once alongside any gamification surface (LeaderboardShell,
 * guide) so awards fired there are shown.
 *
 * @param props - Optional className.
 */
export const GamificationEventHost = ({ className }: WithClassNames<undefined>) => {
    const t = useTranslations("gamification")
    const [moment, setMoment] = useState<Moment | null>(null)

    useEffect(() => {
        const handle = (event: GamificationEvent) => {
            if (event.kind === "xp") {
                // Non-blocking +XP toast. HeroUI queues toasts so rapid awards
                // stack rather than overlap; the toast region is an aria-live
                // status landmark so screen readers announce each award.
                toast.success(t("toast.xp", { xp: event.amount }), {
                    description: t(event.reasonKey),
                })
                return
            }
            if (event.kind === "levelUp") {
                setMoment({ kind: "levelUp", level: event.level })
                return
            }
            setMoment({ kind: "milestone", days: event.days, badgeKey: event.badgeKey, coin: event.coin })
        }
        return subscribeGamificationEvents(handle)
    }, [t])

    return (
        <div className={className}>
            <Modal isOpen={moment !== null} onOpenChange={(open) => !open && setMoment(null)}>
                <Modal.Backdrop>
                    <Modal.Container>
                        <Modal.Dialog>
                            <Modal.CloseTrigger />
                            <Modal.Body className="flex flex-col items-center gap-3 py-8 text-center">
                                {moment?.kind === "levelUp" ? (
                                    <>
                                        <StarIcon
                                            className="size-10 text-accent"
                                            weight="fill"
                                            aria-hidden
                                            focusable="false"
                                        />
                                        <Typography type="h5" weight="bold">
                                            {t("moment.levelUpTitle")}
                                        </Typography>
                                        <Typography type="body" color="muted">
                                            {t("moment.levelUpBody", { level: moment.level })}
                                        </Typography>
                                    </>
                                ) : null}
                                {moment?.kind === "milestone" ? (
                                    <>
                                        <ConfettiIcon
                                            className="size-10 text-accent"
                                            weight="fill"
                                            aria-hidden
                                            focusable="false"
                                        />
                                        <Typography type="h5" weight="bold">
                                            {t("moment.milestoneTitle")}
                                        </Typography>
                                        <Typography type="body" weight="medium">
                                            {t(`milestones.${moment.badgeKey}.name`)}
                                        </Typography>
                                        <Typography type="body-sm" color="muted" className="flex items-center gap-1">
                                            <LightningIcon className="size-4" aria-hidden focusable="false" />
                                            {t("moment.milestoneReward", { days: moment.days, coin: moment.coin })}
                                        </Typography>
                                    </>
                                ) : null}
                            </Modal.Body>
                        </Modal.Dialog>
                    </Modal.Container>
                </Modal.Backdrop>
            </Modal>
        </div>
    )
}
