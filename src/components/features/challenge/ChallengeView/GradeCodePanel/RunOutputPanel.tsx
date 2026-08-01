"use client"

import React from "react"
import { Chip, Typography, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import type { CodeExecuteResult } from "@/modules/api/rest/ai"

/** Props for {@link RunOutputPanel}. */
export interface RunOutputPanelProps {
    /** One sandbox run's streams (`stdout`/`stderr`/`exit_code`/`time_ms`/`compile_output`). */
    result: CodeExecuteResult
    /** Extra classes. */
    className?: string
}

/** Tone → text color class for one output block. */
const toneClass = (tone: "default" | "muted" | "danger"): string => {
    if (tone === "danger") return "text-danger"
    if (tone === "muted") return "text-muted"
    return "text-foreground"
}

/** One labelled monospace output block (compile / stdout / stderr). */
const OutputBlock = ({
    label,
    text,
    tone,
}: {
    label: string
    text: string
    tone: "default" | "muted" | "danger"
}) => (
    <div className="flex flex-col gap-1">
        <Typography type="body-xs" color="muted" weight="medium">
            {label}
        </Typography>
        <div className="overflow-x-auto rounded-2xl border border-default bg-surface p-3">
            <pre className={cn("whitespace-pre-wrap break-words font-mono text-xs", toneClass(tone))}>
                {text}
            </pre>
        </div>
    </div>
)

/**
 * The output of a single sandbox run (PIN §7.1): an exit-code + runtime header, then
 * compile output / stdout / stderr blocks. Streams render in monospace; stderr and a
 * non-zero exit tint danger so failures stand out. No test-case grid — running is now
 * "execute the program and show what it printed", not objective scoring.
 */
export const RunOutputPanel = ({ result, className }: RunOutputPanelProps) => {
    const t = useTranslations("learn")
    const exitCode = result.exit_code
    const failed = typeof exitCode === "number" && exitCode !== 0
    const stdout = result.stdout ?? ""
    const stderr = result.stderr ?? ""
    const compileOutput = result.compile_output ?? ""

    return (
        <div className={cn("flex flex-col gap-3", className)}>
            <div className="flex flex-wrap items-center gap-2">
                <Typography type="body-sm" weight="semibold">
                    {t("codeGrading.outputTitle")}
                </Typography>
                {typeof exitCode === "number" ? (
                    <Chip size="sm" variant="soft" color={failed ? "danger" : "success"}>
                        {t("codeGrading.exitCode", { code: exitCode })}
                    </Chip>
                ) : null}
                {typeof result.time_ms === "number" ? (
                    <Chip size="sm" variant="soft">
                        {t("codeGrading.runtimeMs", { ms: result.time_ms })}
                    </Chip>
                ) : null}
            </div>

            {compileOutput.trim() !== "" ? (
                <OutputBlock
                    label={t("codeGrading.compileOutputLabel")}
                    text={compileOutput}
                    tone="muted"
                />
            ) : null}

            <OutputBlock
                label={t("codeGrading.stdoutLabel")}
                text={stdout.trim() !== "" ? stdout : t("codeGrading.noOutput")}
                tone={stdout.trim() !== "" ? "default" : "muted"}
            />

            {stderr.trim() !== "" ? (
                <OutputBlock label={t("codeGrading.stderrLabel")} text={stderr} tone="danger" />
            ) : null}
        </div>
    )
}
