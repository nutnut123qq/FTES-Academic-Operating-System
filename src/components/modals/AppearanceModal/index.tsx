"use client"

import React from "react"
import { Modal, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { useAppearanceOverlayState } from "@/hooks/zustand/overlay/hooks"
import { ModeSection } from "./ModeSection"
import { AccentSection } from "./AccentSection"
import { EffectSection } from "./EffectSection"

/**
 * AppearanceModal — global appearance-settings modal (opened by the palette
 * button that replaced the navbar dark/light switch). Three live-preview groups:
 * theme mode (light/dark/system via next-themes), accent colour (curated swatch
 * grid → `data-accent` on `<html>`), and the ambient background effect (on/off +
 * rise/fall direction). Every control applies immediately and persists on its
 * own (next-themes / zustand persist) — no save button. Mounted once in
 * `ModalContainer`, controlled by the `appearance` overlay key.
 */
export const AppearanceModal = ({ className }: WithClassNames<undefined>) => {
    const { isOpen, setOpen } = useAppearanceOverlayState()
    const t = useTranslations()
    return (
        <Modal isOpen={isOpen} onOpenChange={setOpen}>
            <Modal.Backdrop>
                <Modal.Container>
                    <Modal.Dialog className={cn(className)}>
                        <Modal.CloseTrigger />
                        <Modal.Header>
                            <div className="text-2xl font-bold">{t("appearance.title")}</div>
                        </Modal.Header>
                        <Modal.Body className="flex flex-col gap-6">
                            <ModeSection />
                            <AccentSection />
                            <EffectSection />
                        </Modal.Body>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}
