"use client"

import React, {
    useEffect,
} from "react"
import {
    cn,
    Modal,
} from "@heroui/react"
import {
    AiQuotaBody,
} from "./Body"
import {
    AiQuotaHeader,
} from "./Header"
import {
    AiQuotaFullConfigLink,
} from "./FullConfigLink"
import {
    AiQuotaTabBar,
} from "./TabBar"
import { useAiQuotaOverlayState } from "@/hooks/zustand/overlay/hooks"
import { useAppDispatch } from "@/redux/hooks"
import { resetAiQuotaTab } from "@/redux/slices/tabs"
import { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link AiQuotaModal}. */
type AiQuotaModalProps = WithClassNames<undefined>

/**
 * AI quota modal shell — overlay state, Redux tabs, nested tab panels own SWR.
 * Opened via {@link useAiQuotaOverlayState}.
 */
export const AiQuotaModal = ({ className }: AiQuotaModalProps = {}) => {
    const dispatch = useAppDispatch()
    const { isOpen, setOpen } = useAiQuotaOverlayState()

    useEffect(() => {
        if (!isOpen) {
            dispatch(resetAiQuotaTab())
        }
    }, [
        isOpen,
        dispatch,
    ])

    return (
        <Modal isOpen={isOpen} onOpenChange={setOpen}>
            <Modal.Backdrop>
                <Modal.Container>
                    <Modal.Dialog className={cn(className)}>
                        <Modal.CloseTrigger />
                        <AiQuotaHeader />
                        <Modal.Body>
                            <AiQuotaTabBar />
                            <div className="h-4.5"/>
                            <AiQuotaBody />
                            <div className="h-4.5"/>
                            <AiQuotaFullConfigLink />
                        </Modal.Body>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}
