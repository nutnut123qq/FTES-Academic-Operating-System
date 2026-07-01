"use client"

import React, { useMemo, useState } from "react"
import { Accordion } from "@heroui/react"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import { useAppSelector } from "@/redux/hooks"
import { ProgrammingLanguageTabs } from "@/components/reuseable/ProgrammingLanguageTabs"
import { ProgrammingLanguageTabsVariant } from "@/components/reuseable/ProgrammingLanguageTabs/enums/programming-language-tabs-variant"

/** One captured E2E flow (shape mirrors the seeded content.e2eFlows jsonb). */
interface E2eFlow {
    id: string
    title: string
    lang?: string
    status: string
    /** Full proof markdown (commands, real output, conclusion) from .e2e/<lang>/flow-*.md. */
    markdown?: string
}

/**
 * E2eBody — the "E2E" tab. Renders each lesson's recorded Playwright proof
 * (`.e2e/<lang>/flow-*.md`) as read-only markdown: per-flow status badge, title
 * and the full proof (commands + real output + conclusion). When flows carry
 * multiple languages (websocket / file-upload run all four stacks) a language
 * filter is shown so learners can read each stack's real run.
 */
export const E2eBody = (): React.JSX.Element => {
    const content = useAppSelector((state) => state.content.entity)
    const flows = (content?.e2eFlows as Array<E2eFlow> | null | undefined) ?? []

    const langs = useMemo(() => {
        const set = new Set(flows.map((f) => f.lang ?? "agnostic"))
        return Array.from(set)
    }, [flows])
    const hasLangFilter = langs.length > 1
    const [activeLang, setActiveLang] = useState<string>(langs[0] ?? "agnostic")

    const visible = hasLangFilter
        ? flows.filter((f) => (f.lang ?? "agnostic") === activeLang)
        : flows
    const passed = visible.filter((f) => f.status === "passed").length

    if (flows.length === 0) {
        return (
            <div className="py-10 text-center text-sm text-default-500">
                Chưa có dữ liệu E2E cho bài học này.
            </div>
        )
    }

    return (
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
            <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold">Kiểm thử end-to-end (Playwright)</p>
                <p className="text-sm text-default-500">
                    {passed}/{visible.length} luồng pass — log thật ghi lại từ lần chạy E2E trên backend & UI thật.
                </p>
            </div>

            {hasLangFilter && (
                <ProgrammingLanguageTabs
                    variant={ProgrammingLanguageTabsVariant.Secondary}
                    availableLangs={langs}
                    selectedLang={activeLang}
                    onSelectLang={setActiveLang}
                    ariaLabel="E2E languages"
                    surfaceBorder={false}
                />
            )}

            <Accordion variant="surface">
                {visible.map((flow) => {
                    const ok = flow.status === "passed"
                    return (
                        <Accordion.Item
                            key={`${flow.lang ?? "agnostic"}-${flow.id}`}
                            aria-label={flow.title}
                        >
                            <Accordion.Heading>
                                <Accordion.Trigger>
                                    <span className="flex items-center gap-2 text-start">
                                        <span
                                            className={[
                                                "inline-flex h-5 shrink-0 items-center rounded-full px-2 text-[11px] font-semibold",
                                                ok ? "bg-success/15 text-success" : "bg-danger/15 text-danger",
                                            ].join(" ")}
                                        >
                                            {ok ? "PASS" : "FAIL"}
                                        </span>
                                        <span className="text-sm font-medium">{flow.title}</span>
                                    </span>
                                </Accordion.Trigger>
                            </Accordion.Heading>
                            <Accordion.Panel>
                                <Accordion.Body>
                                    {flow.markdown && <MarkdownContent markdown={flow.markdown} />}
                                </Accordion.Body>
                            </Accordion.Panel>
                        </Accordion.Item>
                    )
                })}
            </Accordion>
        </div>
    )
}
