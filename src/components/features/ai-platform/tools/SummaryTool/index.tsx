"use client"

import React, { useState } from "react"
import { Button, Chip, Typography } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { submitSummaryJob } from "@/modules/api/rest/ai"
import { useAiToolJob } from "../../hooks/useAiToolJob"
import { AiToolShell, AiToolModelNote } from "../AiToolShell"
import { AiJobFeedback } from "../AiToolResult"
import {
    LearningInput,
    emptyLearningInput,
    resolveLearningInputRef,
    isLearningInputReady,
    type LearningInputValue,
} from "../LearningInput"
import type { SummaryResult } from "../types"

/**
 * `/ai/tools/summary` — turn a pasted passage or a studied lesson into a TL;DR,
 * key points, and a glossary. Submits the summary job, polls it, and renders the
 * structured result.
 */
export const SummaryTool = () => {
    const t = useTranslations("aiPlatform.toolPages")
    const locale = useLocale()
    const [input, setInput] = useState<LearningInputValue>(emptyLearningInput)
    const job = useAiToolJob<SummaryResult>()

    const submit = () =>
        void job.run(async () => {
            const ref = await resolveLearningInputRef(input)
            return submitSummaryJob({ ...ref, language: locale })
        })

    const result = job.poll.result
    const ready = isLearningInputReady(input) && !job.isBusy

    return (
        <AiToolShell toolKey="summary">
            <LearningInput value={input} onChange={setInput} isDisabled={job.isBusy} />
            <Button variant="primary" onPress={submit} isDisabled={!ready} isPending={job.isBusy}>
                {job.isBusy ? t("running") : t("run")}
            </Button>

            <AiJobFeedback job={job} onRetry={submit} />

            {result ? (
                <div className="flex flex-col gap-5">
                    {result.tldr ? (
                        <section className="flex flex-col gap-2 rounded-2xl border border-separator p-4">
                            <Typography type="body-sm" weight="semibold" className="text-accent">
                                {t("summary.tldr")}
                            </Typography>
                            <Typography type="body">{result.tldr}</Typography>
                            {result.estimated_read_min ? (
                                <Chip variant="secondary" size="sm" className="self-start">
                                    {t("summary.readMin", { count: result.estimated_read_min })}
                                </Chip>
                            ) : null}
                        </section>
                    ) : null}

                    {result.key_points?.length ? (
                        <section className="flex flex-col gap-2">
                            <Typography type="body-sm" weight="semibold">
                                {t("summary.keyPoints")}
                            </Typography>
                            <ul className="flex list-disc flex-col gap-1.5 pl-5">
                                {result.key_points.map((point, index) => (
                                    <li key={index}>
                                        <Typography type="body-sm">{point}</Typography>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ) : null}

                    {result.glossary?.length ? (
                        <section className="flex flex-col gap-2">
                            <Typography type="body-sm" weight="semibold">
                                {t("summary.glossary")}
                            </Typography>
                            <dl className="flex flex-col gap-2">
                                {result.glossary.map((entry, index) => (
                                    <div key={index} className="flex flex-col gap-0.5">
                                        <dt>
                                            <Typography type="body-sm" weight="medium">
                                                {entry.term}
                                            </Typography>
                                        </dt>
                                        <dd>
                                            <Typography type="body-sm" color="muted">
                                                {entry.definition}
                                            </Typography>
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </section>
                    ) : null}

                    <AiToolModelNote model={result.model} />
                </div>
            ) : null}
        </AiToolShell>
    )
}
