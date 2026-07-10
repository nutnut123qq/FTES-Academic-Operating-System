"use client"

import React, { useEffect, useState } from "react"
import { Button, Drawer, ScrollShadow } from "@heroui/react"
import { ListBulletsIcon, ListIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useSelectedLayoutSegments } from "next/navigation"
import { ContentMap } from "@/components/features/learn/ContentMap"
import { OnThisPage } from "@/components/features/learn/OnThisPage"

/**
 * Mobile bottom bar for the learn content routes (hidden from `lg` up).
 *
 * The content-map (left) and on-this-page (right) rails are `hidden lg:flex`, so
 * below `lg` a phone learner would be stranded on the linear pager. This fixed
 * footer bar surfaces both rails as slide-in drawers: "content-map" on every
 * content/modules route, "on this page" on the lesson reader only. Local open
 * state; the drawers render at body level (not from inside a popover), so the
 * HeroUI backdrop z-order is fine. Returns null off the content routes so the
 * shell can always mount it.
 */
export const LearnMobileBar = () => {
    const t = useTranslations("learn")
    const segments = useSelectedLayoutSegments()
    const segmentKey = segments.join("/")

    const isContentRoute = segments.includes("modules") || segments[0] === "content"
    const isChallenge = segments.includes("challenges")
    const isLessonReader = segments.includes("modules") && segments.includes("contents") && !isChallenge

    const [isMapOpen, setMapOpen] = useState(false)
    const [isOutlineOpen, setOutlineOpen] = useState(false)

    // close both drawers whenever the route changes (opened a new lesson)
    useEffect(() => {
        setMapOpen(false)
        setOutlineOpen(false)
    }, [segmentKey])

    if (!isContentRoute) {
        return null
    }

    return (
        <div className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center gap-3 border-t border-default bg-background/90 px-3 backdrop-blur-xl lg:hidden">
            <Button variant="ghost" size="sm" onPress={() => setMapOpen(true)}>
                <span className="flex items-center gap-2">
                    <ListIcon aria-hidden focusable="false" className="size-5" />
                    {t("contentMap.title")}
                </span>
            </Button>
            {isLessonReader ? (
                <Button variant="ghost" size="sm" onPress={() => setOutlineOpen(true)}>
                    <span className="flex items-center gap-2">
                        <ListBulletsIcon aria-hidden focusable="false" className="size-5" />
                        {t("onThisPage.title")}
                    </span>
                </Button>
            ) : null}

            {/* left drawer — the course content-map */}
            <Drawer.Backdrop isOpen={isMapOpen} onOpenChange={setMapOpen}>
                <Drawer.Content placement="left">
                    <Drawer.Dialog className="flex h-full w-full max-w-sm flex-col p-0">
                        <div className="p-3">
                            <Drawer.CloseTrigger />
                            <Drawer.Header>
                                <Drawer.Heading>{t("contentMap.title")}</Drawer.Heading>
                            </Drawer.Header>
                        </div>
                        <div className="border-b border-default" />
                        <Drawer.Body className="min-h-0 flex-1 p-0">
                            <ScrollShadow hideScrollBar className="h-full overflow-y-auto">
                                <ContentMap />
                            </ScrollShadow>
                        </Drawer.Body>
                    </Drawer.Dialog>
                </Drawer.Content>
            </Drawer.Backdrop>

            {/* right drawer — the on-this-page outline (lesson reader only) */}
            {isLessonReader ? (
                <Drawer.Backdrop isOpen={isOutlineOpen} onOpenChange={setOutlineOpen}>
                    <Drawer.Content placement="right">
                        <Drawer.Dialog className="flex h-full w-full max-w-sm flex-col p-0">
                            <div className="p-3">
                                <Drawer.CloseTrigger />
                                <Drawer.Header>
                                    <Drawer.Heading>{t("onThisPage.title")}</Drawer.Heading>
                                </Drawer.Header>
                            </div>
                            <div className="border-b border-default" />
                            <Drawer.Body className="min-h-0 flex-1 p-0">
                                <ScrollShadow hideScrollBar className="h-full overflow-y-auto">
                                    <OnThisPage mobile />
                                </ScrollShadow>
                            </Drawer.Body>
                        </Drawer.Dialog>
                    </Drawer.Content>
                </Drawer.Backdrop>
            ) : null}
        </div>
    )
}

export default LearnMobileBar
