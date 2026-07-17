"use client"

import React, { useState } from "react"
import { Tabs } from "@heroui/react"
import { useTranslations } from "next-intl"
import { submitCvReviewJob } from "@/modules/api/rest/ai"
import { ExtendedTabs } from "@/components/blocks/navigation/ExtendedTabs"
import { useAiToolJob } from "../../hooks/useAiToolJob"
import { AiToolShell } from "../AiToolShell"
import { AiJobFeedback } from "../AiToolResult"
import type { CvReviewResult } from "../types"
import { CvBuilderForm } from "./CvBuilderForm"
import { CvUploadTab } from "./CvUploadTab"
import { CvReviewResultPanel } from "./CvReviewResultPanel"

type CvTab = "builder" | "upload"

/**
 * `/ai/tools/cv-review` — the Harvard CV builder + AI review tool. Two sources
 * feed one shared review job: the builder saves and submits `{cvProfileId}`, the
 * upload tab submits `{storageKey}`. The job feedback + structured result render
 * once below the tabs regardless of source.
 */
export const CvReviewTool = () => {
    const t = useTranslations("aiPlatform.toolPages.cvReview")
    const [tab, setTab] = useState<CvTab>("builder")
    const job = useAiToolJob<CvReviewResult>()
    const [lastBody, setLastBody] = useState<Record<string, unknown> | null>(null)

    const submitReview = (body: Record<string, unknown>) => {
        setLastBody(body)
        void job.run(() => submitCvReviewJob(body))
    }

    const result = job.poll.result

    return (
        <AiToolShell toolKey="cvReview">
            <ExtendedTabs selectedKey={tab} onSelectionChange={(key) => setTab(key as CvTab)}>
                <Tabs.ListContainer>
                    <Tabs.List aria-label={t("tabsLabel")}>
                        <Tabs.Tab key="builder" id="builder">
                            {t("tabBuilder")}
                        </Tabs.Tab>
                        <Tabs.Tab key="upload" id="upload">
                            {t("tabUpload")}
                        </Tabs.Tab>
                    </Tabs.List>
                </Tabs.ListContainer>
            </ExtendedTabs>

            <div className="mt-2">
                {tab === "builder" ? (
                    <CvBuilderForm
                        onReview={(cvProfileId) => submitReview({ cvProfileId })}
                        isReviewBusy={job.isBusy}
                    />
                ) : (
                    <CvUploadTab
                        onReview={(storageKey) => submitReview({ storageKey })}
                        isReviewBusy={job.isBusy}
                    />
                )}
            </div>

            <AiJobFeedback job={job} onRetry={() => lastBody && submitReview(lastBody)} />

            {result ? <CvReviewResultPanel result={result} /> : null}
        </AiToolShell>
    )
}
