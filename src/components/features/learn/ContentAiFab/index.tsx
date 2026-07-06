"use client"

import React from "react"
import {
    Button,
    Drawer,
    Popover,
    PopoverContent,
    Typography,
} from "@heroui/react"
import { SparkleIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useSmViewpoint } from "@/hooks/reuseables/useSmViewpoint"
import { FloatingActionButton } from "@/components/blocks/buttons/FloatingActionButton"
import { useContentAiChatOverlayState } from "@/hooks/zustand/overlay/hooks"
import { ContentAiChat } from "@/components/features/learn/ContentAiChat"

/**
 * Floating "Ask FTES AI" button (StarCI port). Shown only while a lesson is open
 * (a `contentId` route param). Desktop: the FAB anchors the AI chat in a Popover
 * beside the bubble (read the lesson + chat side by side). Mobile: it opens the
 * chat in a bottom-sheet Drawer (a popover is too cramped on a phone).
 *
 * Open state lives in the shared overlay store (`contentAiChat` key); the thread +
 * composer are rendered by {@link ContentAiChat}. Mounted once by the learn layout
 * alongside {@link import("../LessonReader/ContentAiSelectionAsk").ContentAiSelectionAsk}.
 */
export const ContentAiFab = () => {
    const t = useTranslations("learn")
    const { contentId } = useParams<{ contentId?: string }>()
    const { isOpen, setOpen, open } = useContentAiChatOverlayState()
    const { isMobile } = useSmViewpoint()

    // the FAB is only meaningful while a lesson is open
    if (!contentId) {
        return null
    }

    // MOBILE — a fixed FAB that opens the bottom-sheet drawer
    if (isMobile) {
        return (
            <>
                <FloatingActionButton onPress={open} ariaLabel={t("reader.ai.open")}>
                    <SparkleIcon aria-hidden focusable="false" weight="fill" />
                </FloatingActionButton>
                <Drawer.Backdrop isOpen={isOpen} onOpenChange={setOpen}>
                    <Drawer.Content placement="bottom">
                        <Drawer.Dialog className="flex h-[80vh] flex-col">
                            <Drawer.CloseTrigger />
                            <Drawer.Header>
                                <Drawer.Heading>{t("reader.ai.title")}</Drawer.Heading>
                            </Drawer.Header>
                            <Drawer.Body className="min-h-0 flex-1 pb-6">
                                <ContentAiChat />
                            </Drawer.Body>
                        </Drawer.Dialog>
                    </Drawer.Content>
                </Drawer.Backdrop>
            </>
        )
    }

    // DESKTOP — right-edge FAB anchoring the chat popover
    return (
        <Popover isOpen={isOpen} onOpenChange={setOpen}>
            <Button
                isIconOnly
                variant="primary"
                aria-label={t("reader.ai.open")}
                className="fixed bottom-24 right-4 z-40 rounded-full shadow-lg"
            >
                <SparkleIcon aria-hidden focusable="false" weight="fill" />
            </Button>
            <PopoverContent placement="left bottom" className="w-[380px] p-0">
                <div className="flex items-center gap-2 p-3">
                    <SparkleIcon aria-hidden focusable="false" weight="fill" className="size-5 text-accent" />
                    <Typography type="body" weight="semibold">
                        {t("reader.ai.title")}
                    </Typography>
                </div>
                <div className="p-3 pt-0">
                    <ContentAiChat />
                </div>
            </PopoverContent>
        </Popover>
    )
}

export default ContentAiFab
