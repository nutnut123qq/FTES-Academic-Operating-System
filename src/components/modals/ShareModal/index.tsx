"use client"

import { SiFacebook as FacebookLogoIcon, SiTelegram as TelegramLogoIcon, SiX as TwitterLogoIcon } from "@icons-pack/react-simple-icons"
import { FaLinkedin as LinkedinLogoIcon } from "react-icons/fa6"
import React, { useMemo } from "react"
import { cn, Modal, Surface } from "@heroui/react"
import { pathConfig } from "@/resources/path"
import { useTranslations } from "next-intl"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { useShareOverlayState } from "@/hooks/zustand/overlay/hooks"
import { useAppSelector } from "@/redux/hooks"
import { QRCode } from "@/components/reuseable/QRCode"
import { SnippetIcon } from "@/components/reuseable/SnippetIcon"

export const ShareModal = ({ className }: WithClassNames<undefined>) => {
    const t = useTranslations()
    const { isOpen, setOpen } = useShareOverlayState()
    const content = useAppSelector((state) => state.content.entity)

    const shareUrl = useMemo(() => {
        if (!content?.displayId) return ""
        return `${typeof window !== "undefined" ? window.location.origin : ""}${pathConfig().locale().publicContent(content.displayId).build()}`
    }, [content?.displayId])

    const shareTitle = content?.title ?? ""

    const socialLinks = useMemo(() => [
        {
            label: "Facebook",
            icon: <FacebookLogoIcon className="size-6 text-[#1877F2]" />,
            url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
        },
        {
            label: "Twitter",
            icon: <TwitterLogoIcon className="size-6 text-[#1DA1F2]" />,
            url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`,
        },
        {
            label: "Telegram",
            icon: <TelegramLogoIcon className="size-6 text-[#0088cc]" />,
            url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`,
        },
        {
            label: "LinkedIn",
            icon: <LinkedinLogoIcon className="size-6 text-[#0A66C2]" />,
            url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
        },
    ], [shareUrl, shareTitle])

    return (
        <Modal isOpen={isOpen} onOpenChange={setOpen}>
            <Modal.Backdrop>
                <Modal.Container size="md">
                    <Modal.Dialog className={cn(className)}>
                        <Modal.CloseTrigger />
                        <Modal.Header>
                            <div className="text-2xl font-bold text-center">
                                {t("content.share")}
                            </div>
                        </Modal.Header>
                        <Modal.Body>
                            <div className="flex flex-col items-center gap-6 pb-4">
                                {shareUrl && (
                                    <div className="flex flex-col items-center gap-3">
                                        <Surface variant="secondary" className="rounded-xl p-2">
                                            <QRCode size={160} data={shareUrl} />
                                        </Surface>
                                        <div className="text-xs text-muted">
                                            {t("content.scanQr")}
                                        </div>
                                    </div>
                                )}
                                <div className="flex gap-1.5 items-center">
                                    <div className="text-sm text-muted">
                                        {shareUrl}
                                    </div>
                                    <SnippetIcon copyString={shareUrl} />
                                </div>
                                <div className="flex items-center gap-3">
                                    {socialLinks.map((socialLink) => (
                                        <SnippetIcon key={socialLink.label} copyString={socialLink.url} />
                                    ))}
                                </div>
                            </div>
                        </Modal.Body>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}
