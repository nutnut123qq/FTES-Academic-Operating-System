"use client"

import React, {
    useMemo,
} from "react"
import {
    useLocale,
    useTranslations,
} from "next-intl"
import {
    cn,
} from "@heroui/react"
import {
    ContentBodySkeleton,
} from "../../ContentBodySkeleton"
import {
    useAutoMarkContentRead,
} from "../useAutoMarkContentRead"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import { useAppSelector } from "@/redux/hooks"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { listContentBodyLangs, pickContentBodyByLang, resolveContentBody } from "@/modules/types/entities/content-body"
import { resolveActiveProgrammingLang } from "@/modules/types/utils/programming-language"
import { type WithClassNames } from "@/modules/types/base/class-name"
import { useQueryContentStatusSwr } from "@/hooks/swr/api/graphql/queries/useQueryContentStatusSwr"
import { useQueryContentSwr } from "@/hooks/swr/api/graphql/queries/useQueryContentSwr"

export type ContentBodyV2Props = WithClassNames<undefined>

/**
 * SCHEMA V2 content body. Selected by {@link ContentBody} when the content is verified. Shares the
 * toolbar / favorite / mark-as-read behaviour with the legacy body; the body itself is the V2 entry
 * point and will render the per-language `@starci/replace` payload once that format lands. For now
 * it renders the resolved markdown body.
 *
 * @param props.className - Optional wrapper class.
 */
export const ContentBodyV2 = ({ className }: ContentBodyV2Props) => {
    const t = useTranslations()
    const locale = useLocale()
    const queryContentSwr = useQueryContentSwr()
    const contentFromRedux = useAppSelector((state) => state.content.entity)
    const routeContentId = useAppSelector((state) => state.content.id)
    const contentSnapshot = contentFromRedux ?? queryContentSwr.data
    const content =
        contentSnapshot?.id && routeContentId && contentSnapshot.id === routeContentId
            ? contentSnapshot
            : undefined
    const queryContentStatusSwr = useQueryContentStatusSwr()
    const isLoading = queryContentSwr.isLoading && !content

    // SCHEMA V2 lesson body: all languages fetched up-front as `bodies`; a tab switches which one
    // is rendered, resolved to the active locale.
    const langs = useMemo(
        () => listContentBodyLangs(content?.bodies),
        [content?.bodies],
    )
    const selectedLang = useAppSelector((state) => state.content.selectedProgrammingLang)
    const activeLang = useMemo(
        () => resolveActiveProgrammingLang(selectedLang, langs),
        [
            selectedLang,
            langs,
        ],
    )
    const activeBody = useMemo(
        () => resolveContentBody(pickContentBodyByLang(content?.bodies, activeLang), locale),
        [content?.bodies, activeLang, locale],
    )

    // Auto mark-as-read on scroll: silent progress tick at the bottom sentinel,
    // dwell-gated XP + feed grant. Returns the ref for the sentinel element below.
    const sentinelRef = useAutoMarkContentRead({
        contentId: content?.id,
        isRead: queryContentStatusSwr.data?.isRead,
        isLoading,
    })

    const body = (
        <div className={cn("text-sm text-muted overflow-x-auto", className)}>
            {/* the per-language switcher now lives in the tab toolbar (LessonReader →
                ContentTabBar rightSlot); this body just renders the active language. */}
            <MarkdownContent reading markdown={activeBody || t("content.empty")} />
            {/* Mark-as-read sentinel only — reactions + comments are rendered OUTSIDE this reading
                card by LessonReader (their own blocks below). Hidden for premium (paywall follows). */}
            {contentFromRedux?.isPremium ? null : (
                // gap-6 = khoảng thở giữa body bài và sentinel mark-as-read
                <div className="flex flex-col gap-6">
                    {/* Sentinel element for IntersectionObserver — triggers mark-as-read */}
                    <div ref={sentinelRef} className="h-1" />
                </div>
            )}
        </div>
    )

    return (
        <AsyncContent
            isLoading={isLoading}
            skeleton={<ContentBodySkeleton className={className} variant="v2" />}
        >
            {body}
        </AsyncContent>
    )
}
