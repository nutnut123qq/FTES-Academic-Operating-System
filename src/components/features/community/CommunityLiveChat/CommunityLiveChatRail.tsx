"use client"

import React, { useState } from "react"
import { Modal, Typography } from "@heroui/react"
import { useMediaQuery } from "usehooks-ts"
import { useTranslations } from "next-intl"
import { CommunityLiveChatThread } from "./CommunityLiveChatThread"
import { OnlinePresence } from "./OnlinePresence"

/** Tailwind `xl` breakpoint (1280px) — the rail only fetches/streams while it is visible. */
const XL_QUERY = "(min-width: 1280px)"

/**
 * Preview height in the rail. Taller than the old `clamp(240px,38vh,420px)` (which only
 * fitted ~3 rows and cut messages off) but still clamped to the viewport so the whole
 * right rail (quick poll + chat) fits on common laptop heights. The thread scrolls
 * internally and follows new messages to the bottom.
 */
const CHAT_HEIGHT = "h-[clamp(320px,48vh,540px)]"

/**
 * Community live-chat rail (xl+) in the right `DiscoveryRail`: the online indicator
 * ({@link OnlinePresence}) as a plain line ABOVE / OUTSIDE the chat box, then the chat
 * panel (title + thread) in a bordered card below it. Rendered inside the
 * `hidden xl:block` aside, so it is in the DOM at every breakpoint; `enabled` is gated
 * on the real `xl` media query so it never fetches or seeds while the aside is hidden
 * (< xl uses the floating fab instead).
 *
 * ponytail: the rail card is a PREVIEW — clicking (or Enter/Space on) it opens a roomy
 * HeroUI {@link Modal} where the actual chatting happens (composer + reply actions),
 * instead of squeezing them into the narrow rail. Esc / backdrop close the modal
 * (HeroUI default via `onOpenChange`), and the online list is shown in both places.
 * The SSE stream is untouched — it is still owned once by
 * {@link import("./CommunityLiveChatSse").CommunityLiveChatSse} and runs on `xl+`
 * regardless of the modal, so opening/closing it changes nothing but the shell.
 */
export const CommunityLiveChatRail = () => {
    const t = useTranslations("communityLiveChat")
    const isDesktop = useMediaQuery(XL_QUERY)
    const [isOpen, setOpen] = useState(false)

    return (
        <div className="flex flex-col gap-2">
            {/* online indicator — a plain line ABOVE / OUTSIDE the chat box (no card) */}
            <OnlinePresence enabled={isDesktop} className="px-1" />
            {/* preview card — the whole card is the click target that opens the modal */}
            <section
                role="button"
                tabIndex={0}
                aria-label={t("expand")}
                onClick={() => setOpen(true)}
                onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        setOpen(true)
                    }
                }}
                className="flex cursor-pointer flex-col gap-2 rounded-3xl border border-separator bg-surface p-4 transition-colors hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
                <Typography type="body-sm" weight="semibold">
                    {t("title")}
                </Typography>
                <CommunityLiveChatThread readOnly enabled={isDesktop} className={CHAT_HEIGHT} />
                <Typography type="body-xs" color="muted">
                    {t("expandHint")}
                </Typography>
            </section>

            {/* roomy chat modal — Esc + backdrop close it (HeroUI default) */}
            <Modal isOpen={isOpen} onOpenChange={setOpen}>
                <Modal.Backdrop>
                    <Modal.Container className="p-3 sm:p-6">
                        <Modal.Dialog className="flex h-[85vh] max-h-[85vh] w-[95vw] max-w-3xl flex-col overflow-hidden">
                            <Modal.CloseTrigger aria-label={t("close")} />
                            <Modal.Header className="flex-col items-start gap-1">
                                <div className="text-xl font-bold">{t("title")}</div>
                                {/* online list stays visible inside the popup */}
                                <OnlinePresence enabled={isOpen} />
                            </Modal.Header>
                            <Modal.Body className="flex min-h-0 flex-1 flex-col">
                                <CommunityLiveChatThread
                                    enabled={isOpen}
                                    className="min-h-0 flex-1"
                                />
                            </Modal.Body>
                        </Modal.Dialog>
                    </Modal.Container>
                </Modal.Backdrop>
            </Modal>
        </div>
    )
}
