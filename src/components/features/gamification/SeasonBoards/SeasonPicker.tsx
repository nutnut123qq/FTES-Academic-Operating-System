"use client"

import React from "react"
import type { Selection } from "@heroui/react"
import { CalendarBlankIcon, CaretDownIcon } from "@phosphor-icons/react"
import { Dropdown, Label, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { LIFETIME_SEASON, type SeasonOptionView } from "@/modules/api/rest/gamification"
import { seasonDisplayName } from "./model"

/** Props for {@link SeasonPicker}. */
export interface SeasonPickerProps {
    seasons: Array<SeasonOptionView>
    /** Mã kỳ đang chọn, hoặc {@link LIFETIME_SEASON}. `null` = kỳ đang chạy (mặc định). */
    value: string | null
    onChange: (next: string | null) => void
    /** Nhãn kỳ backend đã phục vụ — dùng khi `value` là `null` (chưa chọn gì). */
    currentLabel: string | null
}

/** Khoá nội bộ cho mục "kỳ đang chạy"; không gửi lên máy chủ (bỏ trống `season` là đủ). */
const CURRENT = "__current__"

/**
 * Ô CHỌN MÙA — một trong hai nút điều khiển duy nhất của trang xếp hạng.
 *
 * <p><b>Vì sao "tích luỹ" nằm TRONG ô này thay vì là một nút riêng.</b> Tích luỹ = "mọi kỳ
 * cộng lại". Nó trả lời cùng một câu hỏi mà ô này đang hỏi — <i>đếm trong khoảng thời gian
 * nào</i> — chứ không phải câu hỏi <i>đếm nguồn EXP nào</i> mà thanh chọn bảng hỏi. Tách nó
 * ra thành nút thứ ba là bắt người dùng học một trục điều khiển mới cho một thứ vốn cùng
 * trục; gộp vào đây thì cả trang chỉ còn hai nút.
 *
 * <p>Dùng đúng idiom chọn-một của nhà (`selectionMode="single"` + `Dropdown.ItemIndicator`,
 * như `LanguageDropdown`/`FilterMenu`) nên mỗi dòng là `menuitemradio` thật, có
 * `aria-checked` — không phải một danh sách nút tự vẽ.
 */
export const SeasonPicker = ({ seasons, value, onChange, currentLabel }: SeasonPickerProps) => {
    const t = useTranslations("gamification.seasonBoards.picker")

    const selectedKey = value ?? CURRENT
    const isLifetime = value === LIFETIME_SEASON

    /**
     * Nhãn của một kỳ. Đi qua {@link seasonDisplayName} nên KHÔNG bao giờ in mã thô; kỳ chưa
     * đồng bộ tên (V356) hiện phần mã kỳ cắt ra ("SU26") thay vì "T-SU26-bfd6f768".
     */
    const seasonLabel = (season: SeasonOptionView) =>
        seasonDisplayName(season.name, season.code) ?? t("current")

    const triggerLabel = isLifetime
        ? t("lifetime")
        : value === null
            ? seasonDisplayName(null, currentLabel) ?? t("current")
            : seasonLabel(seasons.find((s) => s.code === value) ?? ({ code: value, name: null } as SeasonOptionView))

    const onSelectionChange = (keys: Selection) => {
        const next = keys === "all" ? undefined : [...keys][0]
        if (next === undefined) {
            return
        }
        onChange(next === CURRENT ? null : String(next))
    }

    const running = seasons.find((s) => s.status === "RUNNING")
    const past = seasons.filter((s) => s.status !== "RUNNING")

    return (
        <Dropdown>
            <Dropdown.Trigger
                /* Tên khả truy cập phải CHỨA chữ đang hiện (WCAG 2.5.3): nút hiện "Kỳ
                   Summer 2026" mà tên lại chỉ là "Chọn kỳ" thì lệnh giọng nói đọc đúng chữ
                   trên màn hình sẽ không khớp được với gì cả. */
                aria-label={`${t("label")}: ${triggerLabel}`}
                className={cn(
                    "shrink-0 cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors",
                    isLifetime
                        ? "border-accent bg-accent/10 font-medium text-accent"
                        : "border-separator text-foreground hover:border-accent",
                )}
            >
                <div className="flex items-center gap-1.5">
                    <CalendarBlankIcon aria-hidden focusable="false" className="size-4" />
                    <span className="max-w-44 truncate">{triggerLabel}</span>
                    <CaretDownIcon aria-hidden focusable="false" className="size-3.5" />
                </div>
            </Dropdown.Trigger>
            <Dropdown.Popover className="min-w-60">
                <Dropdown.Menu
                    aria-label={t("label")}
                    selectionMode="single"
                    disallowEmptySelection
                    selectedKeys={new Set([selectedKey])}
                    onSelectionChange={onSelectionChange}
                >
                    <Dropdown.Section>
                        <Dropdown.Item id={CURRENT} textValue={running ? seasonLabel(running) : t("current")}>
                            <Dropdown.ItemIndicator />
                            <Label>
                                {running ? seasonLabel(running) : t("current")}
                                <span className="ml-1.5 text-xs text-muted">{t("runningHint")}</span>
                            </Label>
                        </Dropdown.Item>
                        {past.map((season) => (
                            <Dropdown.Item
                                key={season.code}
                                id={season.code}
                                textValue={seasonLabel(season)}
                            >
                                <Dropdown.ItemIndicator />
                                <Label>{seasonLabel(season)}</Label>
                            </Dropdown.Item>
                        ))}
                        {/* Tích luỹ đứng CUỐI có chủ đích: nó không phải một kỳ, nên đặt nó
                            lẫn giữa các kỳ sẽ đọc thành "có một kỳ tên là Tích luỹ". */}
                        <Dropdown.Item id={LIFETIME_SEASON} textValue={t("lifetime")}>
                            <Dropdown.ItemIndicator />
                            <Label>
                                {t("lifetime")}
                                <span className="ml-1.5 text-xs text-muted">{t("lifetimeHint")}</span>
                            </Label>
                        </Dropdown.Item>
                    </Dropdown.Section>
                </Dropdown.Menu>
            </Dropdown.Popover>
        </Dropdown>
    )
}
