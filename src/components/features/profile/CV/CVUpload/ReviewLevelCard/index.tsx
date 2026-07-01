"use client"

import React from "react"
import {
    Button,
    Card,
    CardContent,
    cn,
    Label,
    Typography,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link ReviewLevelCard}. */
export interface ReviewLevelCardProps extends WithClassNames<undefined> {
    /** Title of the selected rubric template (if any). */
    templateTitle?: string | null
    /** Description of the selected rubric template (if any). */
    templateDescription?: string | null
    /** Whether the update action is disabled (submitting/loading). */
    isUpdateDisabled: boolean
    /** Fired when the user wants to open the rubric level details / picker modal. */
    onOpenReviewLevelDetails: () => void
}

/**
 * Rubric review-level card: selected template title/description + update action.
 *
 * Presentational: renders the provided template metadata, no logic.
 * @param props - {@link ReviewLevelCardProps}
 */
export const ReviewLevelCard = ({
    templateTitle,
    templateDescription,
    isUpdateDisabled,
    onOpenReviewLevelDetails,
    className,
}: ReviewLevelCardProps) => {
    const t = useTranslations()
    return (
        <div className={cn("flex flex-col gap-3", className)}>
            <Label>{t("cv.submission.reviewLevelLabel")}</Label>
            <Card className="shadow-none">
                <CardContent className="flex flex-col gap-2">
                    <Typography type="body">{templateTitle}</Typography>
                    <Typography type="body-sm" color="muted">
                        {templateDescription}
                    </Typography>
                </CardContent>
            </Card>
            <Button
                variant="secondary"
                isDisabled={isUpdateDisabled}
                onPress={onOpenReviewLevelDetails}
            >
                {t("cv.submission.reviewLevelUpdate")}
            </Button>
        </div>
    )
}
