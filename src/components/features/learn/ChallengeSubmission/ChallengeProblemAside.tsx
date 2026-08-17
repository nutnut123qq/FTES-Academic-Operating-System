"use client"

import React, { useEffect, useRef } from "react"
import { Typography, cn } from "@heroui/react"
import { TimerIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import type { SampleTestCaseView } from "@/modules/api/rest/challenges"
import { usePostSqlSchemaSwr } from "@/hooks/swr/api/rest/mutations/usePostSqlSchemaSwr"
import { resolveChallengeLimitParts } from "./challenge-limits"
import { SqlSchemaPanel } from "./SqlSchemaPanel"

/** Props for {@link ChallengeProblemAside}. */
export interface ChallengeProblemAsideProps {
    /** Challenge title shown at the top of the problem card. */
    title: string
    /** Problem statement (markdown), rendered in reading mode. */
    description: string | null | undefined
    /** True for a SQL challenge → the seed-dataset schema/ERD is shown below the problem. */
    isSql: boolean
    /** The SQL seed dataset (VISIBLE to the learner) introspected for the schema/ERD. */
    seedSql: string | null | undefined
    /**
     * The learner-visible SAMPLE (non-hidden) test cases — rendered as read-only "Ví dụ"
     * examples (input → expected) so the learner sees what to expect. HIDDEN cases are never
     * here. Absent / empty → the examples section is hidden.
     */
    sampleTestCases?: Array<SampleTestCaseView>
    /**
     * Wall-clock budget one submission must fit, in milliseconds (BE
     * `challenge-testcase-samples` — the max across the challenge's test cases). Rendered as
     * the "Giới hạn" line under the statement, HackerRank-style. Nullish → no line.
     */
    timeLimitMs?: number | null
    /** Memory budget in megabytes; same source and nullability as {@link timeLimitMs}. */
    memoryLimitMb?: number | null
}

/**
 * The RIGHT column of the unified challenge solve split (contract): the problem statement
 * ("Đề bài" — title + description + the challenge's time/memory budget) and, for a SQL
 * challenge, the seed-dataset schema/ERD ({@link SqlSchemaPanel}) below it. Single source of
 * the "de bai" for EVERY submission tab (github / file / code) — the work area (left column)
 * owns the tabs + active form.
 *
 * Owns the schema introspection SWR: whenever the challenge is SQL and ships a seed, the
 * dataset is introspected once (per seed) so the learner sees the tables/relationships they
 * query, regardless of which submission tab is active. No seed → a plain "no dataset" note.
 */
export const ChallengeProblemAside = ({
    title,
    description,
    isSql,
    seedSql,
    sampleTestCases,
    timeLimitMs,
    memoryLimitMb,
}: ChallengeProblemAsideProps) => {
    const t = useTranslations("learn")
    const seedSqlValue = typeof seedSql === "string" ? seedSql.trim() : ""
    const hasSeed = isSql && seedSqlValue !== ""
    const samples = sampleTestCases ?? []
    // "Giới hạn: 2s · 256MB" — only what the BE actually reports. The unit wording lives in
    // i18n, the pure mapper only decides seconds-vs-ms and drops anything unusable, so an
    // older deployment (or a challenge with no test cases) renders no line at all.
    const limitParts = resolveChallengeLimitParts(timeLimitMs, memoryLimitMb)
    const limitsLabel = limitParts
        .map((part) =>
            part.kind === "timeSeconds"
                ? t("exercises.challenge.limitTimeSeconds", { seconds: part.value })
                : part.kind === "timeMs"
                    ? t("exercises.challenge.limitTimeMs", { ms: part.value })
                    : t("exercises.challenge.limitMemory", { mb: part.value }),
        )
        .join(" · ")

    const {
        trigger: triggerSchema,
        data: schemaData,
        error: schemaError,
        isMutating: schemaLoading,
    } = usePostSqlSchemaSwr()
    // Introspect the seed once per distinct seed. The schema is part of the problem column,
    // so it loads for any SQL challenge that carries a seed — not gated on a specific tab.
    const fetchedSeedRef = useRef<string | null>(null)
    useEffect(() => {
        if (hasSeed && fetchedSeedRef.current !== seedSqlValue) {
            fetchedSeedRef.current = seedSqlValue
            void triggerSchema({ setupSql: seedSqlValue }).catch(() => {})
        }
    }, [hasSeed, seedSqlValue, triggerSchema])

    return (
        <aside className="flex min-w-0 flex-col gap-4">
            <div className="flex flex-col gap-3 rounded-3xl border border-default bg-surface p-6">
                <Typography type="body-xs" weight="medium" color="muted">
                    {t("exercises.challenge.problemHeading")}
                </Typography>
                <Typography type="body" weight="semibold">
                    {title}
                </Typography>
                {/* The budget the solution must fit — stated WITH the problem, because it is
                    what decides which algorithm is viable. Hidden when the BE reports none. */}
                {limitsLabel !== "" ? (
                    <div className="flex items-center gap-2">
                        <TimerIcon
                            aria-hidden
                            focusable="false"
                            className="size-4 shrink-0 text-muted"
                        />
                        <Typography type="body-xs" color="muted">
                            {t("exercises.challenge.limitsLine", { limits: limitsLabel })}
                        </Typography>
                    </div>
                ) : null}
                {/* Đề bài từ admin soạn bằng rich-text editor → lưu HTML (`<ul><li>`, `<pre
                    class="ql-syntax">`). Không bật allowHtml thì react-markdown in thẻ ra dạng
                    text. rehype-raw + sanitize lo XSS; markdown thuần không đổi. */}
                {description ? <MarkdownContent reading allowHtml markdown={description} /> : null}
            </div>

            {samples.length > 0 ? (
                <div className="flex flex-col gap-2">
                    <Typography type="body-xs" weight="medium" color="muted">
                        {t("exercises.challenge.examplesHeading")}
                    </Typography>
                    <div className="flex flex-col gap-3">
                        {samples.map((sample, index) => (
                            <div
                                key={index}
                                className="flex flex-col gap-2 rounded-2xl border border-default bg-surface p-4"
                            >
                                <Typography type="body-xs" weight="medium">
                                    {sample.name && sample.name.trim() !== ""
                                        ? sample.name
                                        : t("exercises.challenge.exampleLine", { number: index + 1 })}
                                </Typography>
                                <SampleField
                                    label={t("exercises.challenge.exampleInput")}
                                    value={sample.input}
                                    empty={t("exercises.challenge.exampleEmpty")}
                                />
                                <SampleField
                                    label={t("exercises.challenge.exampleExpected")}
                                    value={sample.expected}
                                    empty={t("exercises.challenge.exampleEmpty")}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}

            {isSql ? (
                <div className="flex flex-col gap-2">
                    <Typography type="body-xs" weight="medium" color="muted">
                        {t("exercises.challenge.datasetHeading")}
                    </Typography>
                    {!hasSeed ? (
                        <div className="rounded-2xl border border-default bg-default/40 p-4">
                            <Typography type="body-sm" color="muted">
                                {t("codeGrading.schemaNoSeed")}
                            </Typography>
                        </div>
                    ) : (
                        <AsyncContent
                            isLoading={schemaLoading && !schemaData && !schemaError}
                            skeleton={<Skeleton className="h-40 w-full rounded-3xl" />}
                            isEmpty={Boolean(schemaData) && (schemaData?.tables.length ?? 0) === 0}
                            emptyContent={{ title: t("codeGrading.schemaEmpty") }}
                            error={!schemaData ? schemaError : undefined}
                            errorContent={{
                                title: t("codeGrading.schemaError"),
                                onRetry: () => {
                                    void triggerSchema({ setupSql: seedSqlValue }).catch(() => {})
                                },
                                retryLabel: t("codeGrading.retry"),
                            }}
                        >
                            {schemaData ? <SqlSchemaPanel schema={schemaData} /> : null}
                        </AsyncContent>
                    )}
                </div>
            ) : null}
        </aside>
    )
}

/**
 * One labelled read-only field of a sample example (input / expected). Renders the raw
 * value in monospace, or a muted placeholder when the case carries none (e.g. a no-stdin
 * exercise).
 */
const SampleField = ({
    label,
    value,
    empty,
}: {
    label: string
    value: string
    empty: string
}) => {
    const hasValue = value.trim() !== ""
    return (
        <div className="flex flex-col gap-1">
            <Typography type="body-xs" color="muted" weight="medium">
                {label}
            </Typography>
            <div className="overflow-x-auto rounded-xl border border-default bg-default/40 p-2">
                <pre
                    className={cn(
                        "whitespace-pre-wrap break-words font-mono text-xs",
                        hasValue ? "text-foreground" : "text-muted",
                    )}
                >
                    {hasValue ? value : empty}
                </pre>
            </div>
        </div>
    )
}
