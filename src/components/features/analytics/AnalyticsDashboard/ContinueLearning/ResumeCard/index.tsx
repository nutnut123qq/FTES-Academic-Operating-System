"use client"

import React from "react"
import { Card, CardContent, Link, Typography, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { CaretRightIcon, PuzzlePieceIcon, BookOpenIcon } from "@phosphor-icons/react"
import { useRouter } from "@/i18n/navigation"
import type { WithClassNames } from "@/modules/types/base/class-name"
import type { ResumeItem } from "../../../hooks/useQueryContinueLearningSwr"

/** Props for {@link ResumeCard}. */
export interface ResumeCardProps extends WithClassNames<undefined> {
    /** The resume target rendered by this card. */
    item: ResumeItem
}

/**
 * A "continue" card — a STATIC frame (not whole-card pressable); the "Học tiếp ›"
 * caret link is the action, sliding right on hover (see-more pattern). Faithful
 * port of StarCI's ResumeCard: icon chip · title · kind caption · caret link.
 * @param props - the resume target
 */
export const ResumeCard = ({ className, item }: ResumeCardProps) => {
    const t = useTranslations("analytics")
    const router = useRouter()
    const ChipIcon = item.kind === "challenge" ? PuzzlePieceIcon : BookOpenIcon

    return (
        <Card className={cn("h-full", className)}>
            <CardContent className="flex h-full flex-col items-start gap-3">
                <ChipIcon aria-hidden focusable="false" className="size-5 shrink-0 text-muted" />
                <div className="flex w-full min-w-0 flex-1 flex-col">
                    <Typography type="body-sm" weight="semibold" truncate>
                        {item.label}
                    </Typography>
                    <Typography type="body-xs" color="muted">
                        {t(`overview.continue.kind.${item.kind}`)}
                    </Typography>
                </div>
                {/* the only action — caret slides right on hover (see-more pattern) */}
                <Link
                    onPress={() => router.push(item.href)}
                    className="group inline-flex cursor-pointer items-center gap-2 text-accent"
                >
                    {t("overview.continue.resume")}
                    <CaretRightIcon
                        aria-hidden
                        focusable="false"
                        className="size-4 transition-transform group-hover:translate-x-1"
                    />
                </Link>
            </CardContent>
        </Card>
    )
}
