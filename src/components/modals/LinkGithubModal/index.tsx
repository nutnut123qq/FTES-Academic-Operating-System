import { Button, cn, Modal } from "@heroui/react"
import { useTranslations } from "next-intl"
import React from "react"
import { useRouter } from "next/navigation"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { GithubIcon } from "@/components/svg/GithubIcon"
import { useLinkGithubOverlayState } from "@/hooks/zustand/overlay/hooks"
import { githubRedirect } from "@/modules/api/redirect/github"

export const LinkGithubModal = ({ className }: WithClassNames<undefined>) => {
    const { isOpen, setOpen } = useLinkGithubOverlayState()
    const t = useTranslations()
    const router = useRouter()
    return (
        <Modal
            isOpen={isOpen} 
            onOpenChange={setOpen}>
            <Modal.Backdrop>
                <Modal.Container size="xs">
                    <Modal.Dialog className={cn(className)}>
                        <Modal.CloseTrigger />
                        <Modal.Header>
                            <div className="font-semibold text-lg">{t("linkGithub.title")}</div>
                        </Modal.Header>
                        <Modal.Body>
                            <div className="flex items-center justify-center">
                                <div className="flex flex-col items-center gap-3 justify-center">
                                    <GithubIcon className="w-16 h-16" />
                                    <div className="text-sm text-muted">
                                        {t("linkGithub.description")}
                                    </div>
                                </div>
                            </div>
                            <div className="h-3" />
                            <Button
                                type="button"
                                className="w-full"
                                size="lg"
                                onPress={
                                    () => {
                                        const url = githubRedirect.redirect
                                        url.searchParams.set(
                                            "redirectUri", 
                                            window.location.href
                                        )
                                        router.push(url.toString())
                                    }
                                }
                            >
                                {t("linkGithub.button")}
                            </Button>

                        </Modal.Body>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}