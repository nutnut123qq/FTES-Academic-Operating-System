"use client"

import React, { useMemo, useState } from "react"
import { Button, Chip, Typography, cn } from "@heroui/react"
import { TableIcon, TreeStructureIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useTheme } from "next-themes"
import { MermaidDiagram } from "@/components/reuseable/MarkdownContent"
import type { SqlSchema, SqlSchemaTable } from "@/modules/api/rest/ai"

/** Props for {@link SqlSchemaPanel}. */
export interface SqlSchemaPanelProps {
    /** The introspected seed-dataset schema (tables / columns / foreign keys). */
    schema: SqlSchema
    /** Extra classes. */
    className?: string
}

/**
 * Turns a raw SQL identifier into a mermaid-safe token — mermaid `erDiagram` entity /
 * attribute names accept only word chars, so anything else collapses to `_`. Applied
 * consistently to table + column names (so FK relationships still line up).
 */
const safeIdentifier = (raw: string): string => raw.replace(/[^A-Za-z0-9_]/g, "_") || "col"

/**
 * Turns a SQL data type into a single mermaid-safe type token: drops the length/precision
 * parenthetical (`character varying(255)` → `character varying`) and folds whitespace /
 * punctuation to `_` so mermaid never chokes on a space in the attribute type.
 */
const safeType = (raw: string): string =>
    raw
        .replace(/\([^)]*\)/g, "")
        .replace(/\s+/g, "_")
        .replace(/[^A-Za-z0-9_[\]]/g, "")
        .replace(/^_+|_+$/g, "") || "value"

/**
 * Generates a mermaid `erDiagram` source from an introspected schema: one block per table
 * (each column as `type name` + a `PK` / `FK` key tag), then one relationship line per
 * foreign key (`REF_TABLE ||--o{ TABLE : column`). Names are sanitized identically on both
 * sides so relationships resolve.
 */
const buildErDiagram = (schema: SqlSchema): string => {
    const lines: Array<string> = ["erDiagram"]
    for (const table of schema.tables) {
        const fkColumns = new Set(table.foreignKeys.map((fk) => fk.column))
        lines.push(`  ${safeIdentifier(table.name)} {`)
        for (const column of table.columns) {
            const keys: Array<string> = []
            if (column.isPrimaryKey) keys.push("PK")
            if (fkColumns.has(column.name)) keys.push("FK")
            const suffix = keys.length > 0 ? ` ${keys.join(",")}` : ""
            lines.push(`    ${safeType(column.dataType)} ${safeIdentifier(column.name)}${suffix}`)
        }
        lines.push("  }")
    }
    for (const table of schema.tables) {
        for (const fk of table.foreignKeys) {
            lines.push(
                `  ${safeIdentifier(fk.refTable)} ||--o{ ${safeIdentifier(table.name)} : ${safeIdentifier(fk.column)}`,
            )
        }
    }
    return lines.join("\n")
}

/** One table card — its name + a row per column (name · type · PK/FK badges). */
const SchemaTableCard = ({ table }: { table: SqlSchemaTable }) => {
    const t = useTranslations("learn")
    const fkColumns = useMemo(
        () => new Set(table.foreignKeys.map((fk) => fk.column)),
        [table.foreignKeys],
    )
    return (
        <div className="flex flex-col gap-2 rounded-2xl border border-default bg-surface p-4">
            <div className="flex items-center gap-2">
                <TableIcon aria-hidden focusable="false" className="size-4 text-accent" />
                <Typography type="body-sm" weight="semibold" className="font-mono">
                    {table.name}
                </Typography>
            </div>
            <div className="flex flex-col gap-1">
                {table.columns.map((column) => (
                    <div
                        key={column.name}
                        className="flex flex-wrap items-center gap-2 border-b border-separator py-1 last:border-b-0"
                    >
                        <Typography type="body-sm" className="min-w-0 flex-1 truncate font-mono">
                            {column.name}
                        </Typography>
                        <Typography type="body-xs" color="muted" className="font-mono">
                            {column.dataType}
                        </Typography>
                        {column.isPrimaryKey ? (
                            <Chip size="sm" variant="soft" color="accent" className="shrink-0">
                                {t("codeGrading.pkBadge")}
                            </Chip>
                        ) : null}
                        {fkColumns.has(column.name) ? (
                            <Chip size="sm" variant="soft" className="shrink-0">
                                {t("codeGrading.fkBadge")}
                            </Chip>
                        ) : null}
                    </div>
                ))}
            </div>
        </div>
    )
}

/**
 * The seed-dataset schema surface shown in the SQL sandbox's problem column (contract
 * code-sandbox-ux §4C): a toggle between an ERD (a mermaid `erDiagram` rendered by the
 * shared {@link MermaidDiagram}) and a table-by-table column listing (name · type · PK/FK
 * badges), so a learner knows the tables/relationships to query. Presentational: only
 * UI-local hooks (theme + toggle) over the resolved schema passed in.
 */
export const SqlSchemaPanel = ({ schema, className }: SqlSchemaPanelProps) => {
    const t = useTranslations("learn")
    const theme = useTheme()
    const [view, setView] = useState<"erd" | "table">("erd")
    const erDiagram = useMemo(() => buildErDiagram(schema), [schema])
    // Only draw the ERD when there is at least one relationship OR table to show; an empty
    // schema is handled by the caller's AsyncContent empty state.
    const hasRelationships = schema.tables.some((table) => table.foreignKeys.length > 0)

    return (
        <div className={cn("flex flex-col gap-3 rounded-3xl border border-default bg-default/40 p-4", className)}>
            <div className="flex flex-wrap items-center justify-between gap-2">
                <Typography type="body-sm" weight="semibold">
                    {t("codeGrading.schemaTitle")}
                </Typography>
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant={view === "erd" ? "primary" : "ghost"}
                        onPress={() => setView("erd")}
                    >
                        <TreeStructureIcon aria-hidden focusable="false" className="size-4" />
                        {t("codeGrading.schemaViewErd")}
                    </Button>
                    <Button
                        size="sm"
                        variant={view === "table" ? "primary" : "ghost"}
                        onPress={() => setView("table")}
                    >
                        <TableIcon aria-hidden focusable="false" className="size-4" />
                        {t("codeGrading.schemaViewTable")}
                    </Button>
                </div>
            </div>

            {view === "erd" ? (
                <>
                    <MermaidDiagram
                        code={erDiagram}
                        theme={theme.theme === "dark" ? "dark" : "default"}
                        loadingLabel={t("codeGrading.erdRendering")}
                        expandLabel={t("codeGrading.erdExpand")}
                        fallbackLabel={t("codeGrading.erdFigureLabel")}
                    />
                    {!hasRelationships ? (
                        <Typography type="body-xs" color="muted">
                            {t("codeGrading.schemaNoRelationships")}
                        </Typography>
                    ) : null}
                </>
            ) : (
                <div className="flex flex-col gap-3">
                    {schema.tables.map((table) => (
                        <SchemaTableCard key={table.name} table={table} />
                    ))}
                </div>
            )}
        </div>
    )
}
