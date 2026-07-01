"use client"

import React, { useMemo } from "react"
import { cn } from "@heroui/react"
import { CodeBodySkeleton } from "../CodeBodySkeleton"
import { ImplementationCard } from "./ImplementationCard"
import { CodeImplementationEmpty } from "./Empty"
import { useAppSelector } from "@/redux/hooks"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { getContentCodeImplementations } from "@/modules/types/entities/content"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { useQueryContentSwr } from "@/hooks/swr/api/graphql/queries/useQueryContentSwr"

export type CodeImplementationBodyProps = WithClassNames<undefined>

/**
 * Tab body: per-language implementation guides (`content.codeImplementations`).
 * @param props.className - Optional wrapper class.
 */
export const CodeImplementationBody = ({ className }: CodeImplementationBodyProps) => {
    const queryContentSwr = useQueryContentSwr()
    const content = useAppSelector((state) => state.content.entity)

    const items = useMemo(
        () => getContentCodeImplementations(content)
            .slice()
            .sort((prev, next) => prev.sortIndex - next.sortIndex),
        [content],
    )

    // loading gate: render content only when the content query has settled with
    // data and no error; otherwise show the code-shaped skeleton.
    const ready = !queryContentSwr.isLoading
        && !!queryContentSwr.data
        && !queryContentSwr.error

    const body = !items.length ? (
        <div className={cn("", className)}>
            <CodeImplementationEmpty />
        </div>
    ) : (
        <div className={cn("flex flex-col gap-6", className)}>
            {items.map((item) => (
                <ImplementationCard key={item.id} item={item} />
            ))}
        </div>
    )

    return (
        <AsyncContent
            isLoading={!ready}
            skeleton={<CodeBodySkeleton className={className} />}
        >
            {body}
        </AsyncContent>
    )
}
