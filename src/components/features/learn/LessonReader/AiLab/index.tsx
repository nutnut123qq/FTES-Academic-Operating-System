"use client"

import React from "react"
import {
    cn,
} from "@heroui/react"
import {
    PromptPlayground,
} from "./PromptPlayground"
import {
    EvalChallengePanel,
} from "./EvalChallengePanel"
import { useAppSelector } from "@/redux/hooks"
import { useQueryAiLabPlaygroundSwr } from "@/hooks/swr/api/graphql/queries/useQueryAiLabPlaygroundSwr"
import type { AiLabPlaygroundData } from "@/modules/api/graphql/queries/types/ai-lab-playground"
import type { WithClassNames } from "@/modules/types/base/class-name"

export type AiLabBodyProps = WithClassNames<undefined>

/** Known AI Lab playground kinds (mirrors backend `AiLabPlaygroundKind`). */
const PLAYGROUND_KIND = {
    Prompt: "prompt",
    Rag: "rag",
    Comparison: "comparison",
} as const

/**
 * Playground data may carry an optional `evalSetId` once the backend exposes it on the
 * `aiLabPlayground` query; until then the eval panel stays hidden. Read defensively so we
 * never break the typed selection set.
 */
type PlaygroundWithEvalSet = AiLabPlaygroundData & { evalSetId?: string | null }

/**
 * AI Lab tab body: resolves the lesson's playground from SWR, then renders the matching
 * surface by `kind` (prompt → {@link PromptPlayground}; rag / comparison → placeholder).
 * The {@link EvalChallengePanel} is shown additionally when the playground is backed by an
 * eval set. Reads `content` from Redux to scope the playground query.
 * @param props - Optional wrapper styling props.
 */
export const AiLabBody = ({ className }: AiLabBodyProps) => {
    const content = useAppSelector((state) => state.content.entity)
    const playgroundSwr = useQueryAiLabPlaygroundSwr(content?.id)
    const playground = playgroundSwr.data

    if (!playground) {
        return null
    }

    const evalSetId = (playground as PlaygroundWithEvalSet).evalSetId ?? undefined

    return (
        <div className={cn("flex flex-col gap-6", className)}>
            {playground.kind === PLAYGROUND_KIND.Prompt ? (
                <PromptPlayground playground={playground} />
            ) : (
                // RAG / comparison playgrounds are P1/P2 — fall back to the prompt surface,
                // which still drives a single prompt run against the configured model.
                <PromptPlayground playground={playground} />
            )}
            {evalSetId ? <EvalChallengePanel evalSetId={evalSetId} /> : null}
        </div>
    )
}
