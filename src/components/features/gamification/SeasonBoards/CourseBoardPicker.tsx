"use client"

import React, { useState } from "react"
import { Dropdown, Label, Typography, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import type { Selection } from "@heroui/react"
import { ArrowSquareOutIcon, CaretDownIcon } from "@phosphor-icons/react"
import { Link } from "@/i18n/navigation"
import type { MyCourse } from "@/components/features/course/hooks/useQueryMyCoursesSwr"

/** Props for {@link CourseBoardPicker}. */
export interface CourseBoardPickerProps {
    courses: Array<MyCourse>
}

/**
 * LỐI VÀO bảng xếp hạng của một khoá — KHÔNG phải một bảng.
 *
 * ★ Bảng khoá học ĐÃ CÓ ở `/courses/{slug}/learn/leaderboard`, chạy bằng GraphQL
 * `courseLeaderboard` với công thức riêng (điểm challenge + số bài đã đọc + % hoàn
 * thành). Backend TỪ CHỐI phục vụ `board=course` qua endpoint bảng theo kỳ đúng vì lý do
 * đó. Vẽ lại bảng ấy ở trang này bằng một nguồn dữ liệu thứ hai sẽ cho cùng một người,
 * cùng một khoá, hai thứ hạng khác nhau — và cái nút "mở bảng đầy đủ" lại nối thẳng hai
 * con số mâu thuẫn ấy với nhau.
 *
 * Nên chỗ này chỉ làm đúng một việc: chọn khoá rồi đi sang bảng đã có.
 */
export const CourseBoardPicker = ({ courses }: CourseBoardPickerProps) => {
    const t = useTranslations("gamification.seasonBoards.coursePicker")
    // Chọn sẵn khoá đầu (thứ tự của `useQueryMyCoursesSwr`) để cái link có đích ngay.
    const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
    const selected =
        courses.find((course) => course.slug === selectedSlug) ?? courses[0] ?? null

    const onSelectionChange = (keys: Selection) => {
        if (keys === "all") {
            return
        }
        const next = [...keys][0]
        if (next !== undefined) {
            setSelectedSlug(String(next))
        }
    }

    if (courses.length === 0) {
        // Chưa đăng ký khoá nào: KHÔNG phải lỗi. Ẩn hẳn lối vào thay vì mời người dùng
        // bấm vào một trang họ chưa có quyền xem.
        return null
    }

    return (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-separator p-4">
            <Typography type="body-sm" className="shrink-0">
                {t("entryLabel")}
            </Typography>

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
                        selectedKeys={selected ? new Set([selected.slug]) : new Set<string>()}
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
