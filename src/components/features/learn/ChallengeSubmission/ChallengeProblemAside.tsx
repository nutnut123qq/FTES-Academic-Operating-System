"use client"

import React, { useEffect, useRef } from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import { usePostSqlSchemaSwr } from "@/hooks/swr/api/rest/mutations/usePostSqlSchemaSwr"
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
}

/**
 * The RIGHT column of the unified challenge solve split (contract): the problem statement
 * ("Đề bài" — title + description) and, for a SQL challenge, the seed-dataset schema/ERD
 * ({@link SqlSchemaPanel}) below it. Single source of the "de bai" for EVERY submission tab
 * (github / file / code) — the work area (left column) owns the tabs + active form.
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
}: ChallengeProblemAsideProps) => {
    const t = useTranslations("learn")
    const seedSqlValue = typeof seedSql === "string" ? seedSql.trim() : ""
    const hasSeed = isSql && seedSqlValue !== ""

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
                {description ? <MarkdownContent reading markdown={description} /> : null}
            </div>

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
