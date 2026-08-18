"use client"

import React from "react"
import { Chip, Typography, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { CrownIcon } from "@phosphor-icons/react"
import { AvatarWithFrame } from "../AvatarWithFrame"
import { formatXpShort } from "@/utils/xp-format"
import { shortUserLabel, type SeasonBoardRow } from "./model"

/** Thứ tự bục: 2 · 1 · 3 để #1 đứng giữa và cao nhất (port từ bảng khoá học). */
const PODIUM_ORDER = [2, 1, 3]
/** Chiều cao bục theo hạng. */
const PEDESTAL_HEIGHT: Record<number, string> = { 1: "h-20", 2: "h-14", 3: "h-10" }

/** Props for {@link SeasonBoardList}. */
export interface SeasonBoardListProps {
    rows: Array<SeasonBoardRow>
    /** Tên người xem (từ store) — dòng của chính họ là dòng DUY NHẤT FE biết tên. */
    viewerName?: string | null
    viewerAvatar?: string | null
}

/**
 * Bảng xếp hạng một kỳ: bục top-3 (khi đủ 3 người) + danh sách xếp hạng bên dưới.
 *
 * ⚠️ Contract backend (`SeasonBoardController.EntryView`) chỉ mang `(userId, xp, rank)`.
 * Nên bảng này KHÔNG có tên, avatar, huy hiệu hay khung của người khác — và không được
 * bịa ra: dòng của người khác hiện mã rút gọn, dòng của chính người xem hiện tên thật
 * lấy từ store. Khi lane backend gắn hồ sơ vào `EntryView`, chỗ cần sửa là ở đây.
 *
 * Bục CHỈ dựng theo hạng máy chủ trả (1/2/3), không theo vị trí trong mảng: nếu người
 * xem đang ở cửa sổ giữa bảng thì không có ai hạng 1 trong mảng, và bục tự biến mất
 * thay vì phong hạng nhất cho người đứng đầu trang.
 */
export const SeasonBoardList = ({ rows, viewerName, viewerAvatar }: SeasonBoardListProps) => {
    const podium = rows.filter((row) => row.rank <= 3)
    const showPodium = podium.length === 3
    const listRows = showPodium ? rows.filter((row) => row.rank > 3) : rows

    return (
        <div className="flex flex-col gap-6">
            {showPodium ? (
                <SeasonPodium rows={podium} viewerName={viewerName} viewerAvatar={viewerAvatar} />
            ) : null}
            <div className="flex flex-col gap-0.5">
                {listRows.map((row) => (
                    <SeasonBoardRowView
                        key={row.userId}
                        row={row}
                        viewerName={viewerName}
                        viewerAvatar={viewerAvatar}
                    />
                ))}
            </div>
        </div>
    )
}

/**
 * Nhãn của một dòng.
 *
 * Thứ tự ưu tiên có lý do: tên backend gắn (V356) đi TRƯỚC tên trong store của người xem,
 * để cả bảng dùng chung MỘT nguồn tên — hai nguồn sẽ cho ra cảnh dòng của mình hiện tên
 * khác với dòng của mình ở bảng khác. Store chỉ là lưới đỡ cho lúc backend chưa deploy
 * V356; mã rút gọn là lưới đỡ cuối cho người chưa lập hồ sơ.
 */
const rowLabel = (row: SeasonBoardRow, viewerName?: string | null): string => {
    if (row.name) {
        return row.name
    }
    if (row.isViewer && viewerName) {
        return viewerName
    }
    return shortUserLabel(row.userId)
}

/** Ảnh của một dòng — cùng luật ưu tiên với {@link rowLabel}. */
const rowAvatar = (row: SeasonBoardRow, viewerAvatar?: string | null): string | null =>
    row.avatarUrl ?? (row.isViewer ? viewerAvatar ?? null : null)

/** Bục top-3. */
const SeasonPodium = ({
    rows,
    viewerName,
    viewerAvatar,
}: {
    rows: Array<SeasonBoardRow>
    viewerName?: string | null
    viewerAvatar?: string | null
}) => {
    const t = useTranslations("gamification.seasonBoards")
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
                            <AvatarWithFrame
                                username={rowLabel(row, viewerName)}
                                avatar={rowAvatar(row, viewerAvatar)}
                                seed={row.userId}
                                size={isLeader ? "lg" : "md"}
                                frameCode={row.avatarFrame}
                                highlighted={row.isViewer}
                            />
                        </div>
                        <Typography
                            type="body-sm"
                            weight={row.isViewer ? "semibold" : "medium"}
                            className="line-clamp-1 text-center"
                        >
                            {row.isViewer ? t("you") : rowLabel(row, viewerName)}
                        </Typography>
                        <Typography
                            type="body-xs"
                            className={cn("shrink-0", row.isViewer ? "text-accent" : "text-muted")}
                        >
                            {t("xp", { xp: formatXpShort(row.xp) })}
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
const SeasonBoardRowView = ({
    row,
    viewerName,
    viewerAvatar,
}: {
    row: SeasonBoardRow
    viewerName?: string | null
    viewerAvatar?: string | null
}) => {
    const t = useTranslations("gamification.seasonBoards")
    const label = rowLabel(row, viewerName)

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

            <AvatarWithFrame
                username={label}
                avatar={rowAvatar(row, viewerAvatar)}
                seed={row.userId}
                size="sm"
                frameCode={row.avatarFrame}
            />

            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                <Typography type="body-sm" weight="medium" className="line-clamp-1">
                    {label}
                </Typography>
                {row.isViewer ? (
                    <Chip size="sm" variant="soft" color="accent">
                        {t("you")}
                    </Chip>
                ) : null}
            </div>

            <Typography
                type="body-sm"
                weight="semibold"
                className={cn("shrink-0", row.isViewer ? "text-accent" : "text-foreground")}
            >
                {t("xp", { xp: formatXpShort(row.xp) })}
            </Typography>
        </div>
    )
}
