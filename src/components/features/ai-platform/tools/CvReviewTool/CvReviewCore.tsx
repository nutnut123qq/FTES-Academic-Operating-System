"use client"

import React, { useState } from "react"
import { Tabs } from "@heroui/react"
import { useTranslations } from "next-intl"
import { submitCvReviewJob } from "@/modules/api/rest/ai"
import { ExtendedTabs } from "@/components/blocks/navigation/ExtendedTabs"
import { useAiToolJob } from "../../hooks/useAiToolJob"
import { AiJobFeedback } from "../AiToolResult"
import type { CvReviewResult } from "../types"
import { CvLiveEditor } from "./CvLiveEditor"
import { CvUploadTab } from "./CvUploadTab"
import { CvReviewResultPanel } from "./CvReviewResultPanel"

type CvTab = "builder" | "upload"

/**
 * The reusable CV-review core: the Harvard builder / upload-file tabs, the shared
 * job feedback, and the structured result panel. Two sources feed one review job —
 * the builder saves and submits `{cvProfileId}`, the upload tab submits
 * `{storageKey}` — and the feedback + result render once below the tabs regardless
 * of source.
 *
 * This carries no page chrome so both entry points can wrap it in their own:
 * `/ai/tools/cv-review` wraps it in {@link AiToolShell}, and `/profile/cv` renders
 * it inside the profile section column. Keep the two callers on this one core so
 * the builder/upload/review UI never forks.
 */
export const CvReviewCore = () => {
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
        <div className="flex flex-col gap-4">
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
                    <CvLiveEditor
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
        </div>
    )
}
