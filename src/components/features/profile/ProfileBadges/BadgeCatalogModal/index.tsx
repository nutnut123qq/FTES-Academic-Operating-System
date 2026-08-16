"use client"

import React from "react"
import { Button, Modal, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { TrophyIcon } from "@phosphor-icons/react"
import { useGetBadgeCatalogSwr } from "@/hooks/swr/api/rest/queries/useGetBadgeCatalogSwr"
import { BadgeCatalogList } from "./BadgeCatalogList"

/** Props for {@link BadgeCatalogModal}. */
export interface BadgeCatalogModalProps {
    isOpen: boolean
    onClose: () => void
}

/**
 * "All badges" dialog — the WHOLE catalog from `GET /api/v1/gamification/badges`,
 * not just what the viewer earned: every badge with its human name, how to earn
 * it, and an earned/locked state (with the award date, or the progress toward
 * the threshold when the badge is measurable).
 *
 * The request is gated on `isOpen`, so a profile tab that never opens the dialog
 * pays nothing for it. The async-state switch lives in {@link BadgeCatalogList}.
 */
export const BadgeCatalogModal = ({ isOpen, onClose }: BadgeCatalogModalProps) => {
    const t = useTranslations("profile.badgeCatalog")
    const { data, isLoading, error, mutate } = useGetBadgeCatalogSwr(isOpen)

    const items = data?.items ?? []

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={(open) => {
                if (!open) onClose()
            }}
        >
            <Modal.Backdrop>
                <Modal.Container>
                    <Modal.Dialog className="w-full max-w-xl">
                        <Modal.Header>
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                                    <TrophyIcon className="size-5" weight="fill" aria-hidden focusable="false" />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <Typography type="h6" weight="bold">
                                        {t("title")}
                                    </Typography>
                                    <Typography type="body-xs" color="muted">
                                        {data
                                            ? t("summary", {
                                                earned: data.earnedCount,
                                                total: data.totalCount,
                                            })
                                            : t("subtitle")}
                                    </Typography>
                                </div>
                            </div>
                        </Modal.Header>

                        <Modal.Body className="max-h-[60vh] overflow-y-auto py-2">
                            <BadgeCatalogList
                                isLoading={isLoading && !data}
                                // Cached catalog on screen ⇒ a failed revalidation must not
                                // replace it with an error page.
                                error={data ? undefined : error}
                                items={items}
                                onRetry={() => void mutate()}
                            />
                        </Modal.Body>

                        <Modal.Footer className="justify-end">
                            <Button variant="ghost" size="sm" onPress={onClose}>
                                {t("close")}
                            </Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}
