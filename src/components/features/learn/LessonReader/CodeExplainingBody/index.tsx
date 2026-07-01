"use client"

import React, { useMemo } from "react"
import { cn } from "@heroui/react"
import { CodeBodySkeleton } from "../CodeBodySkeleton"
import { ExplainingCard } from "./ExplainingCard"
import { CodeExplainingEmpty } from "./Empty"
import { useAppSelector } from "@/redux/hooks"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { getContentCodeExplainings } from "@/modules/types/entities/content"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { useQueryContentSwr } from "@/hooks/swr/api/graphql/queries/useQueryContentSwr"

export type CodeExplainingBodyProps = WithClassNames<undefined>

/**
 * Tab body: critical code snippets with explanations (`content.codeExplainings`).
 * @param props.className - Optional wrapper class.
 */
export const CodeExplainingBody = ({ className }: CodeExplainingBodyProps) => {
    const queryContentSwr = useQueryContentSwr()
    const content = useAppSelector((state) => state.content.entity)

    const items = useMemo(
        () => getContentCodeExplainings(content)
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
            <CodeExplainingEmpty />
        </div>
    ) : (
        <div className={cn("flex flex-col gap-6", className)}>
            {items.map((item) => (
                <ExplainingCard key={item.id} item={item} />
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
