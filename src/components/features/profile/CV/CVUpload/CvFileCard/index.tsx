"use client"

import { ClockIcon, DownloadSimpleIcon, FilePdfIcon } from "@phosphor-icons/react"
import React from "react"
import {
    Button,
    Card,
    CardContent,
    cn,
    Label,
    Link,
    Typography,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link CvFileCard}. */
export interface CvFileCardProps extends WithClassNames<undefined> {
    /** URL the stored/selected CV file resolves to (empty when none). */
    currentCvLink: string
    /** Display label for the CV file link. */
    currentCvLinkLabel: string
    /** Human-readable submission time. */
    submittedAtLabel: string
    /** Fired when the user wants to open the CV update upload modal. */
    onOpenUpdate: () => void
}

/**
 * Stored CV file card: file link, submitted time, download link, and update action.
 *
 * Presentational: renders the provided file metadata, no logic.
 * @param props - {@link CvFileCardProps}
 */
export const CvFileCard = ({
    currentCvLink,
    currentCvLinkLabel,
    submittedAtLabel,
    onOpenUpdate,
    className,
}: CvFileCardProps) => {
    const t = useTranslations()
    return (
        <div className={cn("flex flex-col gap-3", className)}>
            <Label>{t("cv.submission.fileCardTitle")}</Label>
            <Card className="shadow-none">
                <CardContent className="flex items-center">
                    <div className="flex w-full items-center justify-between gap-3">
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                            <FilePdfIcon aria-hidden className="size-10 text-muted" />
                            <div className="flex min-w-0 flex-1 flex-col gap-2" title={currentCvLinkLabel}>
                                {
                                    currentCvLink ? (
                                        <Link
                                            href={currentCvLink}
                                            target="_blank"
                                            className="block w-full"
                                        >
                                            <Typography type="body-sm" truncate className="text-accent underline">
                                                {currentCvLinkLabel}
                                            </Typography>
                                        </Link>
                                    ) : (
                                        <Typography type="body-sm" color="muted" truncate>
                                            {currentCvLinkLabel}
                                        </Typography>
                                    )}
                                <div className="flex items-center gap-2">
                                    <ClockIcon aria-hidden className="size-5 text-muted" />
                                    <Typography type="body-xs" color="muted">
                                        {submittedAtLabel}
                                    </Typography>
                                </div>
                            </div>
                        </div>
                        {
                            currentCvLink && (
                                <Link
                                    href={currentCvLink}
                                    target="_blank"
                                >
                                    <DownloadSimpleIcon aria-hidden className="size-5 text-muted" />
                                </Link>
                            )
                        }
                    </div>
                </CardContent>
            </Card>
            <Button variant="secondary" onPress={onOpenUpdate}>
                {t("cv.submission.updateAction")}
            </Button>
        </div>
    )
}
