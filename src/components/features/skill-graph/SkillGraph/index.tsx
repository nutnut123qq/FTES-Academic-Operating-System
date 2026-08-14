"use client"

import React, { useCallback, useState } from "react"
import { Typography } from "@heroui/react"
import { GraphIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import type { WithClassNames } from "@/modules/types/base/class-name"
import type { SkillDomain, SkillGraphData, SkillNode } from "../hooks/useQuerySkillGraphSwr"
import { DomainFilter } from "./DomainFilter"
import { SkillDetailPanel } from "./SkillDetailPanel"
import { SkillGraphCanvas } from "./SkillGraphCanvas"
import { SkillGraphLegend } from "./SkillGraphLegend"

/** Props for {@link SkillGraphDiagram}. */
export interface SkillGraphDiagramProps extends WithClassNames<undefined> {
    /** Đồ thị đã tải xong — chủ sở hữu SWR là shell {@link import("../SkillsByDomain").SkillsByDomain}. */
    graph: SkillGraphData
    /** Canvas height, as a Tailwind class (default `h-[480px]`). */
    heightClassName?: string
}

/**
 * Tab "Sơ đồ" của Bản đồ kỹ năng (§21): mạng nhện force-directed — nút người học ở
 * giữa, cụm theo nhóm nghề, kích thước nút mã hoá mức thành thạo, cạnh tiên quyết/liên
 * quan. Giữ nguyên canvas React Flow + {@link SkillDetailPanel} như bản đầu; chỉ khác
 * là nó KHÔNG còn tự tải dữ liệu và KHÔNG còn nhánh fallback danh sách — shell sở hữu
 * SWR/trạng thái async, và view danh sách nay là mặt tiền chứ không phải bản dự phòng.
 *
 * Tab này chỉ được mount từ `sm` trở lên: React Flow không dùng được ở 380px.
 *
 * @param props - {@link SkillGraphDiagramProps}
 */
export const SkillGraphDiagram = ({
    graph,
    heightClassName = "h-[480px]",
    className,
}: SkillGraphDiagramProps) => {
    const t = useTranslations()
    const [activeDomains, setActiveDomains] = useState<Set<SkillDomain>>(new Set())
    const [selected, setSelected] = useState<SkillNode | null>(null)

    const toggleDomain = useCallback((domain: SkillDomain) => {
        setActiveDomains((prev) => {
            const next = new Set(prev)
            if (next.has(domain)) next.delete(domain)
            else next.add(domain)
            return next
        })
    }, [])
    const clearDomains = useCallback(() => setActiveDomains(new Set()), [])
    const closePanel = useCallback(() => setSelected(null), [])

    return (
        <div className={className}>
            <div className="flex flex-col gap-3">
                <DomainFilter active={activeDomains} onToggle={toggleDomain} onClear={clearDomains} />
                <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="min-w-0 flex-1">
                        <SkillGraphCanvas
                            graph={graph}
                            activeDomains={activeDomains}
                            heightClassName={heightClassName}
                            onSelect={setSelected}
                            selectedId={selected?.id}
                        />
                    </div>
                    <div className="flex w-full flex-col gap-3 sm:w-72">
                        {selected ? (
                            <SkillDetailPanel skill={selected} onClose={closePanel} />
                        ) : (
                            <>
                                <div className="hidden items-center gap-2 sm:flex">
                                    <GraphIcon aria-hidden focusable="false" className="size-4 text-muted" />
                                    <Typography type="body-xs" color="muted">
                                        {t("skillGraph.hint")}
                                    </Typography>
                                </div>
                                <SkillGraphLegend />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
