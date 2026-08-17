"use client"

import React from "react"
import { Dropdown, Label, Typography, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import type { Selection } from "@heroui/react"
import { ArrowSquareOutIcon, CaretDownIcon } from "@phosphor-icons/react"
import { Link } from "@/i18n/navigation"
import type { MyCourse } from "@/components/features/course/hooks/useQueryMyCoursesSwr"

/** Props for {@link CourseBoardPicker}. */
export interface CourseBoardPickerProps {
    courses: Array<MyCourse>
    /** Khoá đang chọn (slug); `null` khi chưa có khoá nào. */
    selectedSlug: string | null
    onSelect: (slug: string) => void
}

/**
 * Chọn khoá cho bảng "Khoá học".
 *
 * VÌ SAO cần bộ chọn: bảng khoá học xếp hạng NỘI BỘ một khoá — nó không phải một bảng
 * toàn sàn. Không chọn khoá thì câu hỏi "hạng mấy" chưa có nghĩa, nên thà hỏi thẳng
 * còn hơn hiện một bảng gộp mà người dùng tưởng là hạng của mình.
 *
 * Bảng chi tiết của khoá vẫn ở nguyên chỗ cũ (`/courses/{slug}/learn/leaderboard`) —
 * chỗ này chỉ là lối vào, không dựng lại bảng đó.
 */
export const CourseBoardPicker = ({ courses, selectedSlug, onSelect }: CourseBoardPickerProps) => {
    const t = useTranslations("gamification.seasonBoards.coursePicker")
    const selected = courses.find((course) => course.slug === selectedSlug) ?? null

    const onSelectionChange = (keys: Selection) => {
        if (keys === "all") {
            return
        }
        const next = [...keys][0]
        if (next !== undefined) {
            onSelect(String(next))
        }
    }

    if (courses.length === 0) {
        return (
            <div className="flex flex-col gap-1 rounded-2xl border border-dashed border-separator p-4">
                <Typography type="body-sm" weight="medium">
                    {t("empty")}
                </Typography>
                <Typography type="body-xs" color="muted">
                    {t("emptyHint")}
                </Typography>
            </div>
        )
    }

    return (
        <div className="flex flex-wrap items-center gap-3">
            <Dropdown>
                <Dropdown.Trigger
                    // Tên trợ năng phải CHỨA đúng chữ đang hiện trên nút (WCAG 2.5.3),
                    // nếu không thì điều khiển bằng giọng nói đọc một đằng bấm một nẻo.
                    aria-label={selected ? `${t("label")}: ${selected.title}` : t("label")}
                    className={cn(
                        "shrink-0 cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors",
                        selected
                            ? "border-accent bg-accent/10 font-medium text-accent"
                            : "border-separator text-muted hover:text-foreground",
                    )}
                >
                    <div className="flex items-center gap-1.5">
                        <span className="max-w-56 truncate">{selected?.title ?? t("label")}</span>
                        <CaretDownIcon aria-hidden focusable="false" className="size-3.5" />
                    </div>
                </Dropdown.Trigger>
                <Dropdown.Popover className="min-w-56">
                    <Dropdown.Menu
                        aria-label={t("label")}
                        selectionMode="single"
                        disallowEmptySelection
                        selectedKeys={selectedSlug ? new Set([selectedSlug]) : new Set<string>()}
                        onSelectionChange={onSelectionChange}
                    >
                        <Dropdown.Section>
                            {courses.map((course) => (
                                <Dropdown.Item
                                    key={course.slug}
                                    id={course.slug}
                                    textValue={course.title}
                                >
                                    <Dropdown.ItemIndicator />
                                    <Label>{course.title}</Label>
                                </Dropdown.Item>
                            ))}
                        </Dropdown.Section>
                    </Dropdown.Menu>
                </Dropdown.Popover>
            </Dropdown>

            {selected ? (
                <Link
                    // Locale-less: `Link` của `@/i18n/navigation` tự gắn tiền tố locale.
                    href={`${selected.href}/leaderboard`}
                    className="flex items-center gap-1 text-sm font-medium text-accent no-underline hover:underline"
                >
                    {t("openFull")}
                    <ArrowSquareOutIcon className="size-4" aria-hidden focusable="false" />
                </Link>
            ) : null}
        </div>
    )
}
