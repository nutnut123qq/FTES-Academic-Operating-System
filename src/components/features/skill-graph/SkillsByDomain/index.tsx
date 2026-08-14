"use client"

import React, { useCallback, useMemo, useState } from "react"
import { Accordion, Tabs } from "@heroui/react"
import { GraphIcon, ListBulletsIcon, MagnifyingGlassIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Callout } from "@/components/blocks/feedback/Callout"
import { EmptyState } from "@/components/blocks/feedback/EmptyState"
import { ExtendedTabs } from "@/components/blocks/navigation/ExtendedTabs"
import { SearchInput } from "@/components/reuseable/SearchInput"
import { useSmViewpoint } from "@/hooks/reuseables/useSmViewpoint"
import { useQuerySkillGraphSwr } from "../hooks/useQuerySkillGraphSwr"
import {
    filterSkillsByQuery,
    groupSkillsByDomain,
    hasCourseMapping,
    nextUnlockOf,
    pendingPrerequisitesOf,
    summarizeSkills,
} from "../hooks/useQuerySkillGraphSwr"
import type { SkillDomain } from "../hooks/useQuerySkillGraphSwr"
import { skillGraphColorVars } from "../palette"
import { SkillGraphDiagram } from "../SkillGraph"
import { DomainGroup } from "./DomainGroup"
import { SkillSummaryBar } from "./SkillSummaryBar"
import { SkillsByDomainSkeleton } from "./SkillsByDomainSkeleton"

/** Props for {@link SkillsByDomain}. */
export interface SkillsByDomainProps extends WithClassNames<undefined> {
    /** When set, renders a subject-scoped subgraph (skills + 1-hop neighbors). */
    subjectId?: string
    /** Canvas height of the "Sơ đồ" tab, as a Tailwind class (default `h-[480px]`). */
    heightClassName?: string
}

/** Hai chế độ xem của Bản đồ kỹ năng. */
type SkillView = "list" | "graph"

/**
 * Bảng kỹ năng theo nhóm nghề (§21) — mặt tiền của Bản đồ kỹ năng.
 *
 * Trang mở ra là một thanh tổng kết bốn lát ("24 kỹ năng: 7 thành thạo · 5 đang học · 2
 * sắp mở · 10 chưa mở"), rồi tới các accordion theo nhóm nghề; mỗi thẻ kỹ năng trả lời
 * đúng ba câu trong ba giây: kỹ năng gì, tôi đang ở đâu, học khoá nào để mở. Đồ thị
 * mạng nhện lùi về tab phụ "Sơ đồ".
 *
 * Vì sao đổi: đồ thị bắt người đọc tự giải mã ba thứ cùng lúc (cụm nào là nghề gì, nút
 * to nhỏ nghĩa gì, đường nối nghĩa gì) mà vẫn không trả lời câu hỏi thật của sinh viên —
 * "học cái gì để mở cái này". Danh sách nói thẳng bằng chữ, và nó THẬT THÀ với dữ liệu
 * đang có: khi BE chưa nối course→skill, danh sách vẫn đọc được và nói rõ "chưa gắn khoá
 * học", còn đồ thị chỉ hiện một mớ nút xám.
 *
 * Tab "Sơ đồ" không render dưới `sm` (React Flow không dùng được ở 380px); còn một mục
 * thì cả thanh tab ẩn luôn.
 *
 * @param props - {@link SkillsByDomainProps}
 */
export const SkillsByDomain = ({ subjectId, heightClassName = "h-[480px]", className }: SkillsByDomainProps) => {
    const t = useTranslations()
    const { isMobile } = useSmViewpoint()
    const scope = useMemo(() => (subjectId ? { subjectId } : undefined), [subjectId])
    const { graph, progressUnavailable, error, mutate } = useQuerySkillGraphSwr(scope)

    const [view, setView] = useState<SkillView>("list")
    const [query, setQuery] = useState("")
    /**
     * Nhóm người dùng tự đóng/mở, gắn kèm CHUỖI TÌM KIẾM lúc thao tác. Gõ từ khoá mới là
     * override tự hết hiệu lực (không cần effect reset), nên "gõ vào thì mọi nhóm có kết
     * quả tự mở" vẫn đúng mà người dùng vẫn đóng được nhóm giữa lúc tìm.
     */
    const [override, setOverride] = useState<{ query: string; keys: Set<string> } | null>(null)

    // Bậc, bucket và thứ tự tính trên đồ thị ĐẦY ĐỦ — ô tìm kiếm chỉ ẩn thẻ, không bao
    // giờ làm kỹ năng nhảy nhóm hay đổi vị trí.
    const groups = useMemo(() => (graph ? groupSkillsByDomain(graph) : []), [graph])
    const summary = useMemo(() => summarizeSkills(graph?.nodes ?? []), [graph])
    const nextUp = useMemo(() => nextUnlockOf(graph?.nodes ?? []), [graph])
    const prerequisitesOf = useCallback(
        (skillId: string) => (graph ? pendingPrerequisitesOf(graph, skillId) : []),
        [graph],
    )

    const isSearching = query.trim().length > 0
    const filtered = useMemo(
        () => groups
            .map((group) => ({ ...group, visible: filterSkillsByQuery(group.skills, query) }))
            .filter((group) => group.visible.length > 0),
        [groups, query],
    )

    /** Mặc định mở: mọi nhóm có việc đang dở; không có thì mở nhóm đầu tiên. */
    const defaultKeys = useMemo(() => {
        const active = groups
            .filter((group) => group.skills.some((skill) => skill.status === "learning" || skill.unlocked))
            .map((group) => group.domain)
        if (active.length > 0) {
            return new Set<string>(active)
        }
        return new Set<string>(groups.length > 0 ? [groups[0].domain] : [])
    }, [groups])

    // Gõ tìm kiếm → MỌI nhóm có kết quả tự mở; xoá đi thì trả lại trạng thái mặc định.
    const autoKeys = isSearching
        ? new Set<string>(filtered.map((group) => group.domain))
        : defaultKeys
    const expandedKeys = override?.query === query ? override.keys : autoKeys

    const isEmpty = !!graph && graph.nodes.length === 0
    const showTabs = !isMobile
    const activeView: SkillView = isMobile ? "list" : view

    return (
        <div className={className} style={skillGraphColorVars()}>
            <AsyncContent
                isLoading={!graph && !error}
                skeleton={<SkillsByDomainSkeleton />}
                error={!graph ? error : undefined}
                errorContent={{
                    title: t("skillGraph.error"),
                    onRetry: () => void mutate(),
                    retryLabel: t("skillGraph.retry"),
                }}
                isEmpty={isEmpty}
                emptyContent={{
                    title: t("skillGraph.empty.title"),
                    description: t("skillGraph.empty.description"),
                }}
            >
                {graph ? (
                    <div className="flex flex-col gap-6">
                        {/* phiên hết hạn / khách: mọi thẻ đọc thành "chưa mở" — nói rõ vì sao,
                            đừng để người học nhìn màn 0% không lời giải thích */}
                        {progressUnavailable ? (
                            <Callout status="accent" title={t("skillGraph.guest.title")} />
                        ) : null}

                        <SkillSummaryBar summary={summary} nextUp={nextUp} />

                        <div className="flex flex-col gap-3">
                            {showTabs ? (
                                <ExtendedTabs selectedKey={activeView} onSelectionChange={(key) => setView(key as SkillView)}>
                                    <Tabs.ListContainer>
                                        <Tabs.List aria-label={t("skillGraph.list.tabsLabel")}>
                                            <Tabs.Tab id="list">
                                                <span className="flex items-center gap-2">
                                                    <ListBulletsIcon aria-hidden focusable="false" className="size-4" />
                                                    <span className="sr-only sm:not-sr-only">
                                                        {t("skillGraph.list.tabList")}
                                                    </span>
                                                </span>
                                            </Tabs.Tab>
                                            <Tabs.Tab id="graph">
                                                <span className="flex items-center gap-2">
                                                    <GraphIcon aria-hidden focusable="false" className="size-4" />
                                                    <span className="sr-only sm:not-sr-only">
                                                        {t("skillGraph.list.tabGraph")}
                                                    </span>
                                                </span>
                                            </Tabs.Tab>
                                        </Tabs.List>
                                    </Tabs.ListContainer>
                                </ExtendedTabs>
                            ) : null}

                            {activeView === "graph" ? (
                                <SkillGraphDiagram graph={graph} heightClassName={heightClassName} />
                            ) : (
                                <>
                                    {/* trạng thái MẶC ĐỊNH hôm nay: có danh mục kỹ năng nhưng chưa
                                        khoá nào khai báo kỹ năng → giải thích ở cấp trang, kẻo sinh
                                        viên tưởng hệ thống hỏng */}
                                    {!hasCourseMapping(graph.nodes) ? (
                                        <Callout
                                            status="warning"
                                            title={t("skillGraph.noCourseMapped.title")}
                                            description={t("skillGraph.noCourseMapped.description")}
                                        />
                                    ) : null}

                                    <div className="flex flex-wrap gap-3">
                                        <SearchInput
                                            value={query}
                                            onValueChange={setQuery}
                                            variant="secondary"
                                            placeholder={t("skillGraph.list.searchPlaceholder")}
                                            className="w-full sm:max-w-xs"
                                        />
                                    </div>

                                    {filtered.length === 0 ? (
                                        <EmptyState
                                            icon={<MagnifyingGlassIcon aria-hidden focusable="false" />}
                                            title={t("skillGraph.list.searchEmpty")}
                                        />
                                    ) : (
                                        <Accordion
                                            variant="surface"
                                            className="overflow-hidden border border-default"
                                            allowsMultipleExpanded
                                            expandedKeys={expandedKeys}
                                            onExpandedChange={(keys) =>
                                                setOverride({ query, keys: new Set(Array.from(keys, String)) })
                                            }
                                        >
                                            {filtered.map((group) => (
                                                <DomainGroup
                                                    key={group.domain}
                                                    domain={group.domain as SkillDomain}
                                                    skills={group.visible}
                                                    unlockedCount={group.unlockedCount}
                                                    totalCount={group.skills.length}
                                                    isExpanded={expandedKeys.has(group.domain)}
                                                    isSearching={isSearching}
                                                    pendingPrerequisitesOf={prerequisitesOf}
                                                />
                                            ))}
                                        </Accordion>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                ) : null}
            </AsyncContent>
        </div>
    )
}
