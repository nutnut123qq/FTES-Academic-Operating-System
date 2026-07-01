"use client"

import React from "react"
import {
    Drawer,
    ScrollShadow,
} from "@heroui/react"
import { useSmViewpoint } from "@/hooks/reuseables/useSmViewpoint"
import { E2eBody } from "@/components/features/learn/LessonReader/E2eBody"
import { useAppSelector } from "@/redux/hooks"
import { useE2eResultOverlayState } from "@/hooks/zustand/overlay/hooks"

/**
 * Global E2E-result drawer — the PANEL half of the lesson "view E2E proof" feature
 * (the trigger is {@link import("@/components/features/learn/LessonReader/E2eResultButton").E2eResultButton}
 * in the lesson footer). Open-state lives in the shared overlay store (`e2eResult` key) instead of
 * local `useState`; the recorded per-language Playwright proofs are read from the active lesson in
 * redux and rendered via {@link E2eBody}. Mounted once by {@link import("./../DrawerContainer").DrawerContainer}.
 */
export const E2eResultDrawer = () => {
    const { isOpen, setOpen } = useE2eResultOverlayState()
    const { isMobile } = useSmViewpoint()
    const content = useAppSelector((state) => state.content.entity)
    const flows = content?.e2eFlows ?? []
    // Nothing recorded → keep the drawer inert (the trigger is hidden in this case anyway).
    if (flows.length === 0) return null

    return (
        <Drawer>
            <Drawer.Backdrop isOpen={isOpen} onOpenChange={setOpen}>
                <Drawer.Content placement={isMobile ? "bottom" : "right"}>
                    <Drawer.Dialog className="p-0 sm:max-w-2xl">
                        <div className="p-3">
                            <Drawer.CloseTrigger />
                            <Drawer.Header>
                                <Drawer.Heading>E2E result</Drawer.Heading>
                            </Drawer.Header>
                        </div>
                        <Drawer.Body>
                            <ScrollShadow className="h-full p-3" hideScrollBar>
                                <E2eBody />
                            </ScrollShadow>
                        </Drawer.Body>
                    </Drawer.Dialog>
                </Drawer.Content>
            </Drawer.Backdrop>
        </Drawer>
    )
}
