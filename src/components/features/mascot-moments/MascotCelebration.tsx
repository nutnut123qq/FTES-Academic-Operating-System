"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@heroui/react"
import { useTranslations } from "next-intl"
import { XIcon } from "@phosphor-icons/react"
import { useTour } from "@/components/features/onboarding"
import { MascotBubble } from "@/components/reuseable/FtesMascot"
import { isCelebrationShownToday, markCelebrationShownToday } from "./persistence"

/** Props for {@link MascotCelebration}. */
export interface MascotCelebrationProps {
    /**
     * Stable id for the once-per-day guard (localStorage
     * `ftes.mascot.celebration.<id>`). A new calendar day re-arms it.
     */
    id: string
    /** Bold lead line (already translated). */
    title: React.ReactNode
    /** Supporting congratulations copy (already translated). */
    body: React.ReactNode
}

/**
 * A cheering-mascot congratulations banner that fires AT MOST ONCE PER DAY per
 * device (guarded by {@link isCelebrationShownToday}) and can be dismissed. Built
 * on the shared {@link MascotBubble} (cheer pose) so the celebration reads in the
 * mascot's voice and its copy is announced via the bubble's `aria-live` region.
 *
 * Renders nothing on the server, when already shown today, or after dismissal —
 * keeping the anti-nag guarantee (one mascot, one time). See
 * `openspec/changes/onboarding-mascot-guide` (mascot moments).
 *
 * @param props - {@link MascotCelebrationProps}
 */
export const MascotCelebration = ({ id, title, body }: MascotCelebrationProps) => {
    const t = useTranslations()
    // Anti-nag: never stack on top of a running guided tour (one mascot on screen).
    const { isActive: tourActive } = useTour()
    // Start hidden so SSR and the "already shown today" case render nothing; the
    // effect decides on the client and stamps the day so it never repeats.
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        // While a tour is active, hold off WITHOUT stamping the day, so the
        // celebration can still fire once the tour ends (the effect re-runs when
        // `tourActive` flips to false).
        if (tourActive) return
        if (isCelebrationShownToday(id)) return
        markCelebrationShownToday(id)
        setVisible(true)
    }, [id, tourActive])

    if (!visible) return null

    return (
        <div className="rounded-2xl border border-success/40 bg-success/5 p-3">
            <MascotBubble
                pose="cheer"
                title={title}
                actions={
                    <Button
                        size="sm"
                        variant="tertiary"
                        isIconOnly
                        aria-label={t("mascot.dismiss")}
                        onPress={() => setVisible(false)}
                    >
                        <XIcon className="size-4" aria-hidden focusable="false" />
                    </Button>
                }
            >
                {body}
            </MascotBubble>
        </div>
    )
}
