"use client"

import React, {
    useCallback,
    useState,
} from "react"
import {
    cn,
    Button,
    Card,
    CardContent,
    Spinner,
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
    CircleCheck as CircleCheckIcon,
} from "@gravity-ui/icons"
import {
    pathConfig,
} from "@/resources/path"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { useMutateReviewFlashcardSwr } from "@/hooks/swr/api/graphql/mutations/useMutateReviewFlashcardSwr"
import { useQueryMyDueFlashcardsSwr } from "@/hooks/swr/api/graphql/queries/useQueryMyDueFlashcardsSwr"
import { useGraphQLWithToast } from "@/modules/toast/hooks"
import type { GraphQLResponse } from "@/modules/api/graphql/types"
import type { ReviewFlashcardData } from "@/modules/api/graphql/mutations/types/review-flashcard"

/** Props for {@link FlashcardReviewPage}. */
export type FlashcardReviewPageProps = WithClassNames<undefined>

/** SM-2 grade buttons (value + i18n key + tone), ordered worst → best. */
const GRADES: Array<{
    grade: number
    key: string
    variant: "danger" | "danger-soft" | "secondary" | "primary"
}> = [
    { grade: 0, key: "again", variant: "danger" },
    { grade: 1, key: "hard", variant: "danger-soft" },
    { grade: 2, key: "good", variant: "secondary" },
    { grade: 3, key: "easy", variant: "primary" },
]

/**
 * The `/review` flashcard-review session (SM-2). Fetches the viewer's due cards,
 * then walks them one at a time: shows the front, a "flip" button reveals the
 * back, and four grade buttons record the recall quality (`reviewFlashcard`) and
 * advance. When the queue is exhausted it shows a "done" state with a link back
 * to the dashboard. Current index + flipped state are local (presentational); the
 * grade mutation is owned here.
 * @param props - optional className for the root element.
 */
export const FlashcardReviewPage = ({
    className,
}: FlashcardReviewPageProps) => {
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()
    const { data, isLoading } = useQueryMyDueFlashcardsSwr()
    const { trigger: triggerReview } = useMutateReviewFlashcardSwr()
    const runGraphQL = useGraphQLWithToast()

    // index of the card currently shown
    const [index, setIndex] = useState(0)
    // whether the back of the current card is revealed
    const [flipped, setFlipped] = useState(false)
    // the grade being saved, or null when idle
    const [savingGrade, setSavingGrade] = useState<number | null>(null)

    const cards = data?.cards ?? []
    const current = cards[index]

    /** Grade the current card, then advance to the next one. */
    const onGrade = useCallback(
        async (grade: number) => {
            if (!current) {
                return
            }
            setSavingGrade(grade)
            try {
                const ok = await runGraphQL(
                    async (): Promise<GraphQLResponse<ReviewFlashcardData>> => {
                        const result = await triggerReview({
                            cardId: current.cardId,
                            grade,
                        })
                        const env = result?.data?.reviewFlashcard
                        // surface a non-success envelope as an error so the toast
                        // hook reports failure and we don't advance the queue
                        if (!env?.success) {
                            throw new Error(env?.message)
                        }
                        return env
                    },
                )
                // advance only when the grade was recorded
                if (ok) {
                    setIndex((value) => value + 1)
                    setFlipped(false)
                }
            } finally {
                setSavingGrade(null)
            }
        },
        [
            current,
            triggerReview,
            runGraphQL,
        ],
    )

    // still loading the queue → centred spinner
    if (isLoading || !data) {
        return (
            <div className={cn("flex min-h-[60vh] items-center justify-center", className)}>
                <Spinner size="lg" />
            </div>
        )
    }

    // queue exhausted (or empty from the start) → done / empty state
    if (!current) {
        const empty = cards.length === 0
        return (
            <div className={cn("mx-auto flex min-h-[60vh] w-full max-w-xl flex-col items-center justify-center gap-6 p-3", className)}>
                <CircleCheckIcon className="size-12 text-success" />
                <span className="text-center text-lg font-semibold text-foreground">
                    {empty
                        ? t("flashcardReview.empty")
                        : t("flashcardReview.done")}
                </span>
                <Button
                    variant="primary"
                    onPress={() => router.push(
                        pathConfig().locale(locale).dashboard().build(),
                    )}
                >
                    {t("flashcardReview.backToDashboard")}
                </Button>
            </div>
        )
    }

    return (
        <div className={cn("mx-auto flex w-full max-w-xl flex-col gap-6 p-3", className)}>
            {/* progress header: deck context + position in the queue */}
            <div className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-1.5">
                    <LayersIcon className="size-5 shrink-0 text-accent" />
                    <span className="truncate text-sm font-medium text-foreground">
                        {current.deckTitle}
                    </span>
                </span>
                <span className="shrink-0 text-sm text-muted">
                    {t("flashcardReview.progress", {
                        current: index + 1,
                        total: cards.length,
                    })}
                </span>
            </div>

            {/* the card: front always, back after flip */}
            <Card>
                <CardContent className="flex min-h-[16rem] flex-col items-center justify-center gap-6 text-center">
                    <span className="text-xl font-semibold text-foreground">
                        {current.front}
                    </span>
                    {flipped ? (
                        <>
                            <span className="h-px w-full bg-default" />
                            <span className="text-lg text-foreground">
                                {current.back}
                            </span>
                        </>
                    ) : null}
                </CardContent>
            </Card>

            {/* flip → reveal; revealed → grade buttons */}
            {flipped ? (
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                    {GRADES.map((item) => (
                        <Button
                            key={item.grade}
                            variant={item.variant}
                            isDisabled={savingGrade !== null}
                            isPending={savingGrade === item.grade}
                            onPress={() => void onGrade(item.grade)}
                        >
                            {t(`flashcardReview.${item.key}`)}
                        </Button>
                    ))}
                </div>
            ) : (
                <Button
                    variant="primary"
                    onPress={() => setFlipped(true)}
                >
                    {t("flashcardReview.flip")}
                </Button>
            )}
        </div>
    )
}
