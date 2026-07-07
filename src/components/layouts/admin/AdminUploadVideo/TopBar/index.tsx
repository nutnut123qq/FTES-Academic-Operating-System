"use client"

import { ArrowLeftIcon, CpuIcon } from "@phosphor-icons/react"
import React, {
    useCallback,
} from "react"
import {
    Button,
    cn,
} from "@heroui/react"
import {
    useRouter,
} from "next/navigation"
import {
    useTranslations,
} from "next-intl"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link TopBar}. */
export type TopBarProps = WithClassNames<undefined>

/**
 * Top navigation bar holding the "Back to admin" button.
 *
 * Self-contained section (single-use): owns its own back-navigation handler via
 * the router, so the container renders `<TopBar />` with no props. "use client"
 * for the HeroUI interactive Button and the router.
 * @param props - optional className forwarded to the wrapper div
 */
export const TopBar = ({
    className,
}: TopBarProps = {}) => {
    const router = useRouter()
    const t = useTranslations("admin.aiBalancer")

    /** Navigate back to the admin page. */
    const onBack = useCallback(
        () => {
            router.push("../../admin")
        },
        [router],
    )

    /** Open the AI balancer health dashboard. */
    const onOpenAiBalancer = useCallback(
        () => {
            router.push("../ai-balancer")
        },
        [
            router,
        ],
    )

    return (
        <div className={cn("flex flex-wrap items-center gap-3 pt-4", className)}>
            <Button
                id="admin-back-button"
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-white"
                onPress={onBack}
            >
                <ArrowLeftIcon
                    className="size-5"
                    aria-hidden="true"
                    focusable="false"
                />
                {t("backToAdmin")}
            </Button>
            <Button
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-white"
                onPress={onOpenAiBalancer}
            >
                <CpuIcon
                    className="size-5"
                    aria-hidden="true"
                    focusable="false"
                />
                {t("title")}
            </Button>
        </div>
    )
}
