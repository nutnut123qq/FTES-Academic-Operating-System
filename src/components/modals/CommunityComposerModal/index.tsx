"use client"

import React from "react"
import { Modal, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { useCommunityComposerOverlayState } from "@/hooks/zustand/overlay/hooks"
import { CommunityComposerForm } from "@/components/features/community/CommunityComposer"

/**
 * CommunityComposerModal — the Threads-style modal composer opened by the
 * feed's "Có gì mới?" trigger row. Reuses the exact `/community/new` form
 * (kind chips + title + body), autofocused on the title field. Mounted once in
 * `ModalContainer`, controlled by the `communityComposer` overlay key.
 */
export const CommunityComposerModal = ({ className }: WithClassNames<undefined>) => {
    const { isOpen, setOpen, close, quote, setQuote } = useCommunityComposerOverlayState()
    const t = useTranslations("communityHub")

    // Dismissing the modal (X / ESC / backdrop) must drop any stashed repost quote —
    // it lives in the shared overlay store, so a leftover quote would otherwise hijack
    // the next plain compose (modal AND the /community/new page read the same store).
    // A successful share already clears it; this covers the abandon paths.
    const onOpenChange = (next: boolean) => {
        setOpen(next)
        if (!next) {
            setQuote(null)
        }
    }

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
            <Modal.Backdrop>
                <Modal.Container>
                    <Modal.Dialog className={cn(className)}>
                        <Modal.CloseTrigger />
                        <Modal.Header>
                            <div className="text-2xl font-bold">
                                {quote ? t("composer.repostTitle") : t("composer.title")}
                            </div>
                        </Modal.Header>
                        <Modal.Body>
                            <CommunityComposerForm autoFocusTitle onSubmitted={close} />
                        </Modal.Body>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}
