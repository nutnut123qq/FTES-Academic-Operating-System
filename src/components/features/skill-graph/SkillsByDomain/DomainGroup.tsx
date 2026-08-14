"use client"

import React, { useState } from "react"
import { Accordion, Button, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { ProgressMeter } from "@/components/blocks/stats/ProgressMeter"
import { bucketOf } from "../hooks/useQuerySkillGraphSwr"
import type { SkillDomain, SkillNode } from "../hooks/useQuerySkillGraphSwr"
import { domainVar } from "../palette"
import { SkillRow } from "./SkillRow"

/** Props for {@link DomainGroup}. */
export interface DomainGroupProps {
    /** Nhóm nghề của accordion này (cũng là `id` của item). */
    domain: SkillDomain
    /** Kỹ năng đã lọc + đã sắp xếp, thứ tự tính trên đồ thị ĐẦY ĐỦ. */
    skills: Array<SkillNode>
    /** Số kỹ năng đã mở trên TỔNG của nhóm (không đổi khi tìm kiếm). */
    unlockedCount: number
    /** Tổng số kỹ năng của nhóm (không đổi khi tìm kiếm). */
    totalCount: number
    /** Nhóm này đang mở hay không — accordion do component cha điều khiển. */
    isExpanded: boolean
    /** Đang tìm kiếm → bung hết, không thu gọn phần "chưa mở". */
    isSearching: boolean
    /** Tra tên tiên quyết chưa đạt của một kỹ năng (tính trên đồ thị đầy đủ). */
    pendingPrerequisitesOf: (skillId: string) => Array<string>
}

/**
 * Một nhóm nghề = một item accordion.
 *
 * - Trigger: chấm màu nhóm + tên nhóm; khi ĐÓNG kèm chữ muted "7/12 đã mở", khi MỞ thì
 *   con số đó nhường chỗ cho một {@link ProgressMeter} mảnh ngay đầu panel — đúng luật
 *   "one progress bar at a time".
 * - Màu nhóm nghề CHỈ xuất hiện ở chấm này; bên trong thẻ tuyệt đối không dùng, để cả
 *   trang chỉ còn một ngôn ngữ màu (bốn tone trạng thái).
 * - Với danh mục mà gần như 100% kỹ năng đang khoá, phần "chưa mở" được gom lại sau một
 *   hàng "+N kỹ năng chưa mở" để nhóm không thành một danh sách xám dài vô nghĩa.
 *
 * @param props - {@link DomainGroupProps}
 */
export const DomainGroup = ({
    domain,
    skills,
    unlockedCount,
    totalCount,
    isExpanded,
    isSearching,
    pendingPrerequisitesOf,
}: DomainGroupProps) => {
    const t = useTranslations()
    const [showLocked, setShowLocked] = useState(false)

    const domainName = t(`skillGraph.domains.${domain}`)
    const actionable = skills.filter((skill) => bucketOf(skill) !== "locked")
    const locked = skills.filter((skill) => bucketOf(skill) === "locked")
    // Khi đang tìm kiếm thì mọi kết quả khớp đều phải thấy được, không giấu sau "+N".
    const revealLocked = isSearching || showLocked
    const visible = revealLocked ? [...actionable, ...locked] : actionable

    return (
        <Accordion.Item id={domain} aria-label={domainName}>
            <Accordion.Heading>
                {/* chỉ set typography — padding của trigger do `.accordion__trigger` lo,
                    utility padding cùng layer không thắng chắc chắn */}
                <Accordion.Trigger className="text-base font-semibold">
                    <div className="flex w-full min-w-0 items-center gap-2">
                        <span
                            className="size-3 shrink-0 rounded-full"
                            style={{ backgroundColor: domainVar(domain) }}
                            aria-hidden
                        />
                        <span className="min-w-0 flex-1 truncate text-left">{domainName}</span>
                        {/* con số chỉ hiện khi ĐÓNG; mở ra thì thanh tiến độ nói thay */}
                        {!isExpanded ? (
                            <Typography type="body-xs" color="muted" className="shrink-0">
                                {t("skillGraph.list.groupProgress", { done: unlockedCount, total: totalCount })}
                            </Typography>
                        ) : null}
                        <Accordion.Indicator className="shrink-0" />
                    </div>
                </Accordion.Trigger>
            </Accordion.Heading>
            <Accordion.Panel>
                <Accordion.Body className="p-0">
                    <div className="flex flex-col">
                        <div className="px-4 pb-3">
                            <ProgressMeter
                                value={unlockedCount}
                                max={totalCount}
                                aria-label={t("skillGraph.list.groupProgress", {
                                    done: unlockedCount,
                                    total: totalCount,
                                })}
                            />
                        </div>
                        <div className="flex flex-col [&>*+*]:border-t [&>*+*]:border-separator">
                            {visible.map((skill) => (
                                <SkillRow
                                    key={skill.id}
                                    skill={skill}
                                    pendingPrerequisites={pendingPrerequisitesOf(skill.id)}
                                />
                            ))}
                            {!revealLocked && locked.length > 0 ? (
                                <div className="px-4 py-2">
                                    <Button
                                        variant="tertiary"
                                        size="sm"
                                        onPress={() => setShowLocked(true)}
                                    >
                                        {t("skillGraph.list.showLocked", { count: locked.length })}
                                    </Button>
                                </div>
                            ) : null}
                            {!isSearching && showLocked && locked.length > 0 ? (
                                <div className="px-4 py-2">
                                    <Button
                                        variant="tertiary"
                                        size="sm"
                                        onPress={() => setShowLocked(false)}
                                    >
                                        {t("skillGraph.list.hideLocked")}
                                    </Button>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </Accordion.Body>
            </Accordion.Panel>
        </Accordion.Item>
    )
}
