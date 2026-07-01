"use client"

import { CaretRightIcon } from "@phosphor-icons/react"
import React, { useCallback } from "react"
import { useLocale } from "next-intl"
import { useRouter } from "next/navigation"
import { FoundationCategoryThumbnail } from "../FoundationCategoryThumbnail"
import { resolveFoundationLogo } from "../shared/foundation-logo"
import type { FoundationCategoryEntity } from "@/modules/types/entities/foundation-category"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { pathConfig } from "@/resources/path"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { setFoundation, setFoundationCategory, setFoundationCategoryId, setFoundationId, setFoundations } from "@/redux/slices/foundation"
import { SurfaceListCardRow } from "@/components/blocks/cards/SurfaceListCard"

export interface FoundationCategoryCardProps extends WithClassNames<undefined> {
    /** Foundation category from API. */
    category: FoundationCategoryEntity
}

/**
 * One foundation category as a link-and-caret list row (block {@link ListRow}).
 *
 * Replaces the former heavy pressable card: a small brand thumbnail, the title +
 * one-line description, and a trailing caret signalling "drills in". The feature
 * only owns the selection dispatch + navigation; the row owns all styling.
 * @param props.category - Category row (title, description, thumbnail).
 * @param props.divider - Bottom border for all but the last row in the joined list.
 * @param props.className - Optional root class names.
 */
export const FoundationCategoryCard = ({
    category,
    className,
}: FoundationCategoryCardProps) => {
    const locale = useLocale()
    const router = useRouter()
    const dispatch = useAppDispatch()
    const courseDisplayId = useAppSelector((state) => state.course.displayId)

    /** Select this category: persist to store, reset foundation state, navigate. */
    const onPress = useCallback(() => {
        dispatch(setFoundationCategoryId(category.id))
        dispatch(setFoundationCategory(category))
        dispatch(setFoundationId(undefined))
        dispatch(setFoundation(undefined))
        dispatch(setFoundations(undefined))

        if (!courseDisplayId) {
            return
        }
        router.push(
            pathConfig()
                .locale(locale)
                .course(courseDisplayId)
                .learn()
                .foundations(category.id)
                .build(),
        )
    }, [
        category,
        courseDisplayId,
        dispatch,
        locale,
        router,
    ])

    // prefer a crisp local square brand logo; fall back to the synced banner inside the thumbnail box
    const logoSrc = resolveFoundationLogo(category.title)

    return (
        <SurfaceListCardRow
            leading={(
                <FoundationCategoryThumbnail
                    logoSrc={logoSrc}
                    thumbnailUrl={category.thumbnailUrl}
                    title={category.title}
                    className="size-10 aspect-square rounded-md"
                />
            )}
            title={category.title}
            subtitle={category.description ?? undefined}
            trailing={(
                <CaretRightIcon
                    aria-hidden
                    focusable="false"
                    className="size-4 text-muted"
                />
            )}
            onPress={onPress}
            className={className}
        />
    )
}
