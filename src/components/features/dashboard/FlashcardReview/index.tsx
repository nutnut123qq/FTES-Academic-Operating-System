"use client"

import React from "react"
import {
    cn,
    Button,
} from "@heroui/react"
import {
    useLocale,
    useTranslations,
} from "next-intl"
import {
    useRouter,
} from "next/navigation"
import {
    Layers as LayersIcon,
} from "@gravity-ui/icons"
import {
    pathConfig,
} from "@/resources/path"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { useQueryMyDueFlashcardsSwr } from "@/hooks/swr/api/graphql/queries/useQueryMyDueFlashcardsSwr"

/** Props for {@link FlashcardReview}. */
export type FlashcardReviewProps = WithClassNames<undefined>

/**
 * Centre-column "flashcards due today" nudge. Surfaces the SM-2 spaced-repetition
 * backlog (`dueCount`) right on the home surface with a primary CTA into the
 * dedicated review page. Self-fetches its own leaf query and hides entirely when
 * nothing is due (or while the count is still loading).
 * @param props - optional className for the root element.
 */
export const FlashcardReview = ({
    className,
}: FlashcardReviewProps) => {
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()
    const { data } = useQueryMyDueFlashcardsSwr()

    // not loaded yet, or nothing due → no widget
    if (!data || data.dueCount === 0) {
        return null
    }

    return (
        <div className={cn("flex items-center justify-between gap-3 p-3", className)}>
            <div className="flex min-w-0 items-center gap-1.5">
                <LayersIcon className="size-5 shrink-0 text-accent" />
                <span className="truncate text-sm font-medium text-foreground">
                    {t("flashcardReview.due", {
                        count: data.dueCount,
                    })}
                </span>
            </div>
            <Button
                variant="primary"
                size="sm"
                onPress={() => router.push(
                    pathConfig().locale(locale).review().build(),
                )}
            >
                {t("flashcardReview.start")}
            </Button>
        </div>
    )
}
