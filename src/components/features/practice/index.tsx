"use client"

import React from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/blocks/layout/PageHeader"
import { ResizableRail } from "@/components/blocks/layout/ResizableRail"
import { ResponsiveBreadcrumb } from "@/components/blocks/navigation/ResponsiveBreadcrumb"
import { pathConfig } from "@/resources/path"
import { PracticeRail } from "./PracticeRail"
import { PracticeMobileNav } from "./PracticeRail/PracticeMobileNav"
import { ProgressCockpit } from "./ProgressCockpit"
import { PracticeFilters } from "./PracticeFilters"
import { ProblemCatalog } from "./ProblemCatalog"
import { CodingLeaderboard } from "./CodingLeaderboard"
import { usePracticeView } from "./hooks/usePracticeView"

/**
 * `/practice` — the LeetCode-style coding-practice page, laid out docs-style: a
 * persistent left {@link PracticeRail} (the mode switch Problems ⇄ Leaderboard +
 * the course-domain topics as a nav list) beside a padded work pane. The rail and
 * the pane share one source of truth through the URL (the {@link usePracticeView}
 * mode + the {@link PracticeFilters} topic), so navigation is shareable. Below
 * `lg` the rail folds into the in-pane {@link PracticeMobileNav} chip rows.
 *
 * The pane stacks: a {@link PageHeader}, the {@link ProgressCockpit} (the viewer's
 * solve standing, shown for BOTH views), then the active view — **Problems** (the
 * {@link PracticeFilters} bar + {@link ProblemCatalog}) or the global
 * **Leaderboard** ({@link CodingLeaderboard}). Pure composition — each child reads
 * its own SWR / URL state; this root only places them and owns the shell.
 */
export const Practice = () => {
    const t = useTranslations()
    const router = useRouter()
    const { view } = usePracticeView()

    return (
        // single column on mobile/tablet; rail + content side-by-side from lg up
        <div className="flex w-full flex-col items-start lg:flex-row">
            {/* docs-style left rail — sticks under the navbar, viewport-tall, drag-resizable */}
            <ResizableRail
                className="hidden shrink-0 lg:sticky lg:top-16 lg:flex lg:h-[calc(100dvh-4rem)] lg:flex-col lg:self-start"
                storageKey="starci.practice.rail.width"
                defaultWidth={300}
                minWidth={256}
                maxWidth={420}
                ariaLabel={t("practice.rail.modeAria")}
            >
                <PracticeRail className="min-h-0 lg:flex-1" />
            </ResizableRail>

            {/* content column — owns the canonical p-6 reading padding */}
            <div className="min-h-0 min-w-0 flex-1 p-6">
                <div className="mx-auto flex max-w-5xl flex-col gap-10">
                    <PageHeader
                        breadcrumb={(
                            <ResponsiveBreadcrumb
                                items={[
                                    {
                                        key: "home",
                                        label: t("nav.home"),
                                        onPress: () => router.push(pathConfig().locale().build()),
                                    },
                                    {
                                        key: "current",
                                        label: t("codingPractice.title"),
                                    },
                                ]}
                            />
                        )}
                        title={t("codingPractice.title")}
                        description={t("codingPractice.subtitle")}
                    />

                    <div className="flex flex-col gap-6">
                        {/* mobile: mode + topic chips (the rail is desktop-only) */}
                        <PracticeMobileNav />

                        {/* the viewer's own standing — stays above both views */}
                        <ProgressCockpit />

                        {/* only the active view mounts, so the idle one's query stays idle */}
                        {view === "problems" ? (
                            <>
                                {/* filter bar sticks below the navbar while scrolling the catalog */}
                                <PracticeFilters className="sticky top-16 z-40 bg-background py-2" />
                                <ProblemCatalog />
                            </>
                        ) : (
                            <CodingLeaderboard />
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
