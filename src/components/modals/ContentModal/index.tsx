"use client"

import React from "react"
import { cn, Modal, ScrollShadow } from "@heroui/react"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import { useContentOverlayState } from "@/hooks/zustand/overlay/hooks"
import { useAppSelector } from "@/redux/hooks"
import { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link ContentModal}. */
type ContentModalProps = WithClassNames<undefined>

export const ContentModal = ({ className }: ContentModalProps = {}) => {
    const { isOpen, setOpen } = useContentOverlayState()
    const content = useAppSelector((state) => state.content.entity)
    return (
        <Modal isOpen={isOpen} onOpenChange={setOpen}>
            <Modal.Backdrop>
                <Modal.Container size="full" scroll="inside">
                    <Modal.Dialog className={cn(className)}>
                        <Modal.CloseTrigger />
                        <Modal.Header>
                            <div className="text-2xl font-bold text-center">
                                {content?.title ?? ""}
                            </div>
                        </Modal.Header>
                        <Modal.Body>
                            <ScrollShadow hideScrollBar={true} className="px-3">   
                                <MarkdownContent markdown={content?.body ?? ""} />
                                <div className="h-6"/>
                            </ScrollShadow>
                        </Modal.Body>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}
