"use client"

import React from "react"
import { Chip, Typography, cn } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { CrownIcon } from "@phosphor-icons/react"
import { FrameAvatar } from "../AvatarFrames/FrameAvatar"
import { xpBreakdown, type SeasonBoardRow } from "./model"

/** Màu từng nguồn EXP trên thanh phân tách — cùng bảng màu với bảng khoá học đã có. */
const SOURCE_COLOR: Record<"course" | "community" | "workplace", string> = {
    course: "#378ADD",
    community: "#D85A30",
    workplace: "#1D9E75",
}

/** Thứ tự bục: 2 · 1 · 3 để #1 đứng giữa và cao nhất (port từ bảng khoá học). */
const PODIUM_ORDER = [2, 1, 3]
/** Chiều cao bục theo hạng. */
const PEDESTAL_HEIGHT: Record<number, string> = { 1: "h-20", 2: "h-14", 3: "h-10" }

/** Props for {@link SeasonBoardList}. */
export interface SeasonBoardListProps {
    rows: Array<SeasonBoardRow>
}

/**
 * Bảng xếp hạng một kì: bục top-3 (khi đủ 3 người) + danh sách xếp hạng bên dưới.
 *
 * Dùng lại NGUYÊN idiom của bảng khoá học đã có (`features/learn/Leaderboard`): bục
 * 2·1·3, vương miện cho hạng 1, thanh phân tách EXP mảnh dưới tên, chip "Bạn" trên
 * dòng của chính mình. Không port thẳng component cũ được vì component đó gắn cứng ba
 * nguồn EXP của KHOÁ (challenge/đọc bài/cột mốc), còn ở đây ba nguồn là
 * khoá/cộng đồng/workplace — cùng cách vẽ, khác lát cắt.
 *
 * Bục CHỈ dựng theo hạng máy chủ trả (1/2/3), không theo vị trí trong mảng: nếu người
 * xem đang ở cửa sổ giữa bảng thì không có ai hạng 1 trong mảng, và bục tự biến mất
 * thay vì phong hạng nhất cho người đứng đầu trang.
 */
export const SeasonBoardList = ({ rows }: SeasonBoardListProps) => {
    const podium = rows.filter((row) => row.rank <= 3)
    const showPodium = podium.length === 3
    const listRows = showPodium ? rows.filter((row) => row.rank > 3) : rows

    return (
        <div className="flex flex-col gap-6">
            {showPodium ? <SeasonPodium rows={podium} /> : null}
            <div className="flex flex-col gap-0.5">
                {listRows.map((row) => (
                    <SeasonBoardRowView key={row.userId} row={row} />
                ))}
            </div>
        </div>
    )
}

/** Bục top-3. */
const SeasonPodium = ({ rows }: { rows: Array<SeasonBoardRow> }) => {
    const t = useTranslations("gamification.seasonBoards")
    const locale = useLocale()
    const byRank = new Map(rows.map((row) => [row.rank, row]))

    return (
        <div className="flex items-end justify-center gap-3 sm:gap-4">
            {PODIUM_ORDER.map((rank) => {
                const row = byRank.get(rank)
                if (!row) {
                    return <div key={rank} className="w-24" />
                }
                const isLeader = rank === 1
                return (
                    <div key={rank} className="flex w-24 flex-col items-center gap-1.5">
                        <div className="relative">
                            {isLeader ? (
                                <CrownIcon
                                    aria-hidden
                                    focusable="false"
                                    weight="fill"
                                    className="absolute -top-4 left-1/2 size-5 -translate-x-1/2 text-warning"
                                />
                            ) : null}
                            <FrameAvatar
                                username={row.username}
                                avatar={row.avatar}
                                seed={row.userId}
                                size={isLeader ? "lg" : "md"}
                                frame={row.frame}
                                className={cn(row.isViewer && "ring-2 ring-accent rounded-full")}
                            />
                        </div>
                        <Typography
                            type="body-sm"
                            weight={row.isViewer ? "semibold" : "medium"}
                            className="line-clamp-1 text-center"
                        >
                            {row.isViewer ? t("you") : row.displayName}
                        </Typography>
                        <Typography
                            type="body-xs"
                            className={cn("shrink-0", row.isViewer ? "text-accent" : "text-muted")}
                        >
                            {t("xp", { xp: Math.round(row.xp).toLocaleString(locale) })}
                        </Typography>
                        <div
                            className={cn(
                                "flex w-full items-center justify-center rounded-t-xl bg-default text-sm font-medium text-muted",
                                PEDESTAL_HEIGHT[rank],
                            )}
                        >
                            {rank}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

/** Một dòng xếp hạng. */
const SeasonBoardRowView = ({ row }: { row: SeasonBoardRow }) => {
    const t = useTranslations("gamification.seasonBoards")
    const locale = useLocale()

    return (
        <div
            className={cn(
                "flex items-center gap-3 rounded-2xl px-2 py-2 transition-colors hover:bg-default/60",
                row.isViewer && "bg-accent/10",
            )}
        >
            <div className="flex w-6 shrink-0 justify-center">
                {row.rank === 1 ? (
                    <CrownIcon
                        aria-hidden
                        focusable="false"
                        weight="fill"
                        className="size-5 text-warning"
                    />
                ) : (
                    <Typography type="body-sm" weight="semibold" color="muted">
                        {row.rank}
                    </Typography>
                )}
            </div>

            <FrameAvatar
                username={row.username}
                avatar={row.avatar}
                seed={row.userId}
                size="sm"
                frame={row.frame}
            />

            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                    <Typography type="body-sm" weight="medium" className="line-clamp-1">
                        {row.displayName}
                    </Typography>
                    {row.isViewer ? (
                        <Chip size="sm" variant="soft" color="accent">
                            {t("you")}
                        </Chip>
                    ) : null}
                    {/* Huy hiệu cạnh tên: tối đa 3 để một người sưu tầm nhiều không đẩy
                        con số EXP ra khỏi màn hình. */}
                    {row.badges.slice(0, 3).map((badge) =>
                        badge.iconUrl ? (
                            <img
                                key={badge.code}
                                src={badge.iconUrl}
                                alt={badge.name}
                                title={badge.name}
                                className="size-4 shrink-0 object-contain"
                            />
                        ) : (
                            <Chip key={badge.code} size="sm" variant="soft" color="default">
                                {badge.name}
                            </Chip>
                        ),
                    )}
                </div>
                <XpSourceBar row={row} />
            </div>

            <Typography
                type="body-sm"
                weight="semibold"
                className={cn("shrink-0", row.isViewer ? "text-accent" : "text-foreground")}
            >
                {t("xp", { xp: Math.round(row.xp).toLocaleString(locale) })}
            </Typography>
        </div>
    )
}

/**
 * Thanh mảnh cho thấy EXP của dòng này đến từ đâu.
 *
 * Đây là câu trả lời trực quan cho "vì sao tôi hạng 3 bảng này mà hạng 40 bảng kia":
 * nhìn thanh là thấy người kia toàn EXP cộng đồng còn mình toàn EXP khoá học.
 * Tổng bằng 0 ⇒ vẽ rãnh trơn, KHÔNG chia ba phần bằng nhau (chia đều là bịa ra một
 * cơ cấu không có thật).
 */
const XpSourceBar = ({ row }: { row: SeasonBoardRow }) => {
    const t = useTranslations("gamification.seasonBoards")
    const locale = useLocale()
    const slices = xpBreakdown(row)
    const total = slices.reduce((sum, slice) => sum + slice.value, 0)

    if (total <= 0) {
        return <div className="h-1.5 w-4/5 rounded-full bg-default" />
    }

    const label = t("breakdownLabel", {
        parts: slices
            .filter((slice) => slice.value > 0)
            .map((slice) =>
                t("sourceValue", {
                    source: t(`sources.${slice.key}`),
                    xp: Math.round(slice.value).toLocaleString(locale),
                }),
            )
            .join(" · "),
    })

    return (
        <div className="flex h-1.5 w-4/5 overflow-hidden rounded-full bg-default" title={label}>
            {slices.map((slice) => (
                <div
                    key={slice.key}
                    style={{
                        width: `${(slice.value / total) * 100}%`,
                        backgroundColor: SOURCE_COLOR[slice.key],
                    }}
                />
            ))}
            <span className="sr-only">{label}</span>
        </div>
    )
}
