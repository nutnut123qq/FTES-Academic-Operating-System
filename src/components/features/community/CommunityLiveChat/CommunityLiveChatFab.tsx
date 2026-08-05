"use client"

import React from "react"
import { Button, Drawer, Popover, PopoverContent, Typography } from "@heroui/react"
import { ChatCircleDotsIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useMediaQuery } from "usehooks-ts"
import { useSmViewpoint } from "@/hooks/reuseables/useSmViewpoint"
import { FloatingActionButton } from "@/components/blocks/buttons/FloatingActionButton"
import { useCommunityLiveChatOverlayState } from "@/hooks/zustand/overlay/hooks"
import { CommunityLiveChatThread } from "./CommunityLiveChatThread"

/** Tailwind `xl` breakpoint (1280px) — the fab is the < xl entry point (xl+ uses the rail). */
const XL_QUERY = "(min-width: 1280px)"

/**
 * Floating community live-chat entry point for `< xl` (the rail replaces it at `xl+`).
 * A bottom-right floating button opens the chat: a bottom-sheet Drawer on mobile (a
 * popover is too cramped on a phone), a left-anchored Popover on tablet — mirroring
 * `ContentAiFab`. OPENING the panel flips the shared `communityLiveChat` overlay,
 * which is what {@link import("./CommunityLiveChatSse").CommunityLiveChatSse} watches
 * to open the SSE + start the heartbeat; CLOSING it tears both down.
 */
export const CommunityLiveChatFab = () => {
    const t = useTranslations("communityLiveChat")
    const isDesktop = useMediaQuery(XL_QUERY)
    const { isMobile } = useSmViewpoint()
    const { isOpen, setOpen, open } = useCommunityLiveChatOverlayState()

    // xl+ shows the rail panels instead; the fab is < xl only.
    if (isDesktop) {
        return null
    }

    // MOBILE — a fixed fab opening a bottom-sheet drawer
    if (isMobile) {
        return (
            <>
                <FloatingActionButton onPress={open} ariaLabel={t("open")}>
                    <ChatCircleDotsIcon aria-hidden focusable="false" />
                </FloatingActionButton>
                <Drawer.Backdrop isOpen={isOpen} onOpenChange={setOpen}>
                    <Drawer.Content placement="bottom">
                        <Drawer.Dialog className="flex h-[80vh] flex-col">
                            <Drawer.CloseTrigger />
                            <Drawer.Header>
                                <Drawer.Heading>{t("title")}</Drawer.Heading>
                            </Drawer.Header>
                            <Drawer.Body className="flex min-h-0 flex-1 flex-col gap-3 pb-6">
                                <CommunityLiveChatThread enabled={isOpen} className="min-h-0 flex-1" />
                            </Drawer.Body>
                        </Drawer.Dialog>
                    </Drawer.Content>
                </Drawer.Backdrop>
            </>
        )
    }

    // TABLET (640–1279) — fab anchoring a chat popover
    return (
        <Popover isOpen={isOpen} onOpenChange={setOpen}>
            <Button
                isIconOnly
                variant="primary"
                aria-label={t("open")}
                className="fixed bottom-6 right-6 z-40 !size-14 rounded-full shadow-lg"
            >
                <ChatCircleDotsIcon aria-hidden focusable="false" className="size-6" />
            </Button>
            <PopoverContent placement="left bottom" className="w-[380px] p-0">
                <div className="flex items-center gap-2 border-b border-separator p-3">
                    <Typography type="body-sm" weight="semibold" className="shrink-0">
                        {t("title")}
                    </Typography>
                </div>
                <div className="p-3">
                    <CommunityLiveChatThread enabled={isOpen} className="h-[420px]" />
                </div>
            </PopoverContent>
        </Popover>
    )
}
