"use client"

import React, { useState } from "react"
import {
    Button,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownPopover,
    DropdownTrigger,
    TextArea,
    TextField,
    Typography,
    cn,
} from "@heroui/react"
import { CaretDownIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { submitCodeReviewJob } from "@/modules/api/rest/ai"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import { useAiToolJob } from "../../hooks/useAiToolJob"
import { AiToolShell, AiToolModelNote } from "../AiToolShell"
import { AiJobFeedback } from "../AiToolResult"
import type { DebugResult } from "../types"

/** Languages the debugger offers (value = worker language key = display label). */
const LANGUAGES = [
    "python",
    "javascript",
    "typescript",
    "java",
    "csharp",
    "cpp",
    "go",
    "rust",
    "sql",
    "php",
    "ruby",
    "kotlin",
] as const

/**
 * `/ai/tools/debug` — paste code plus a description of the bug and get an AI code
 * review back as markdown. Submits the code-review job, polls it, and renders the
 * `output` (or a bare markdown string) through the shared markdown renderer.
 */
export const DebugTool = () => {
    const t = useTranslations("aiPlatform.toolPages")
    const [code, setCode] = useState("")
    const [language, setLanguage] = useState<string>("python")
    const [question, setQuestion] = useState("")
    const job = useAiToolJob<DebugResult | string>()

    const submit = () =>
        void job.run(() =>
            submitCodeReviewJob({ code: code.trim(), language, question: question.trim() }),
        )

    const raw = job.poll.result
    const output = typeof raw === "string" ? raw : raw?.output
    const model = typeof raw === "string" ? undefined : raw?.model
    const ready = code.trim().length > 0 && !job.isBusy

    return (
        <AiToolShell toolKey="debug">
            <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <Typography type="body-sm" weight="medium">
                        {t("debug.codeLabel")}
                    </Typography>
                    <Dropdown>
                        <DropdownTrigger
                            isDisabled={job.isBusy}
                            className={cn(
                                "flex cursor-pointer items-center gap-2 rounded-2xl border border-default px-3 py-1.5",
                            )}
                        >
                            <span className="text-sm font-medium">{language}</span>
                            <CaretDownIcon aria-hidden focusable="false" className="size-4" />
                        </DropdownTrigger>
                        <DropdownPopover className="min-w-40">
                            <DropdownMenu aria-label={t("debug.language")}>
                                {LANGUAGES.map((lang) => (
                                    <DropdownItem
                                        key={lang}
                                        textValue={lang}
                                        onPress={() => setLanguage(lang)}
                                    >
                                        {lang}
                                    </DropdownItem>
                                ))}
                            </DropdownMenu>
                        </DropdownPopover>
                    </Dropdown>
                </div>
                <TextField variant="primary" className="w-full">
                    <TextArea
                        rows={10}
                        value={code}
                        onChange={(event) => setCode(event.target.value)}
                        placeholder={t("debug.codePlaceholder")}
                        className="resize-y font-mono text-xs"
                        disabled={job.isBusy}
                    />
                </TextField>
            </div>

            <div className="flex flex-col gap-2">
                <Typography type="body-sm" weight="medium">
                    {t("debug.question")}
                </Typography>
                <TextField variant="primary" className="w-full">
                    <TextArea
                        rows={3}
                        value={question}
                        onChange={(event) => setQuestion(event.target.value)}
                        placeholder={t("debug.questionPlaceholder")}
                        className="resize-y"
                        disabled={job.isBusy}
                    />
                </TextField>
            </div>

            <Button variant="primary" onPress={submit} isDisabled={!ready} isPending={job.isBusy}>
                {job.isBusy ? t("running") : t("run")}
            </Button>

            <AiJobFeedback job={job} onRetry={submit} />

            {output ? (
                <div className="flex flex-col gap-3 rounded-2xl border border-separator p-4">
                    <MarkdownContent markdown={output} />
                    <AiToolModelNote model={model} />
                </div>
            ) : null}
        </AiToolShell>
    )
}
