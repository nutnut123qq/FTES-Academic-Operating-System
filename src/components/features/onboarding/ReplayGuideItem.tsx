"use client"

import React, { useCallback } from "react"
import { Dropdown, Label } from "@heroui/react"
import { CompassIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useAccountMenuOverlayState } from "@/hooks/zustand/overlay/hooks"
import { useTour } from "./TourContext"

/**
 * "Xem lại hướng dẫn" — the account-menu entry that REPLAYS the welcome tour on
 * demand (regardless of the one-time done flag). Closes the account dropdown
 * first so the tour's spotlight is not fighting the open popover, then starts the
 * tour. Rendered as a {@link Dropdown.Item} so it slots into `AccountMenuAuthed`.
 */
export const ReplayGuideItem = () => {
    const t = useTranslations()
    const { close } = useAccountMenuOverlayState()
    const { startTour } = useTour()

    const onReplay = useCallback(() => {
        close()
        // let the dropdown finish closing before the spotlight measures anchors
        window.setTimeout(() => startTour(), 150)
    }, [close, startTour])

    return (
        <Dropdown.Item
            id="replay-guide"
            textValue={t("onboarding.replay")}
            onPress={onReplay}
        >
            <CompassIcon className="size-5" />
            <Label>{t("onboarding.replay")}</Label>
        </Dropdown.Item>
    )
}
