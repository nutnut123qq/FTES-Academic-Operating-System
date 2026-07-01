"use client"

import React, {
    useCallback,
    useState,
} from "react"
import {
    Card,
    CardContent,
    Link,
    Typography,
    cn,
} from "@heroui/react"
import {
    useLocale,
    useTranslations,
} from "next-intl"
import {
    useRouter,
} from "next/navigation"
import {
    CaretRightIcon,
    PuzzlePieceIcon,
    BookOpenIcon,
} from "@phosphor-icons/react"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { queryResolveRoute } from "@/modules/api/graphql/queries/query-resolve-route"

/** Kind of resume target — drives the chip icon + label. */
export type ResumeKind = "challenge" | "lesson"

/** One "pick up where you left off" card item. */
export interface ResumeItem {
    /** Opaque global id — resolved to a route on click. */
    globalId: string
    /** Title to show. */
    label: string
    /** Challenge vs lesson (chip styling). */
    kind: ResumeKind
}

/** Props for {@link ResumeCard}. */
export interface ResumeCardProps extends WithClassNames<undefined> {
    /** The resume target rendered by this card. */
    item: ResumeItem
}

/**
 * A "continue" card — a STATIC frame (not whole-card pressable); the "Tiếp tục ›"
 * caret link is the action: it resolves the entity's canonical route via the index
 * on click, then navigates. The caret slides right on hover (see-more pattern).
 * @param props - the resume target
 */
export const ResumeCard = ({
    className,
    item,
}: ResumeCardProps) => {
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()
    const [pending, setPending] = useState(false)

    /** Resolve this entity's route, then push to it. */
    const onPress = useCallback(
        async () => {
            if (pending) {
                return
            }
            setPending(true)
            try {
                const response = await queryResolveRoute({
                    request: {
                        globalId: item.globalId,
                    },
                })
                const path = response.data?.resolveRoute?.data?.path
                if (path) {
                    router.push(`/${locale}${path}`)
                }
            } finally {
                setPending(false)
            }
        },
        [
            item.globalId,
            locale,
            pending,
            router,
        ],
    )

    const ChipIcon = item.kind === "challenge" ? PuzzlePieceIcon : BookOpenIcon

    return (
        <Card className={cn("h-full", className)}>
            <CardContent className="flex h-full flex-col items-start gap-3">
                <ChipIcon aria-hidden focusable="false" className="size-5 shrink-0 text-muted" />
                <div className="flex w-full min-w-0 flex-1 flex-col gap-0">
                    <Typography type="body-sm" weight="semibold" truncate>
                        {item.label}
                    </Typography>
                    <Typography type="body-xs" color="muted">
                        {t(`dashboard.continueKind.${item.kind}`)}
                    </Typography>
                </div>
                {/* the only action — caret slides right on hover (see-more pattern) */}
                <Link
                    onPress={onPress}
                    isDisabled={pending}
                    className="group inline-flex cursor-pointer items-center gap-2 text-accent"
                >
                    {t("dashboard.continue")}
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
