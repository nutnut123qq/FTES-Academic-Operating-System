"use client"

import React from "react"
import { Chip, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { formatXpShort } from "@/utils/xp-format"
import { AvatarWithFrame } from "../AvatarWithFrame"

/** Props for {@link ViewerRankCard}. */
export interface ViewerRankCardProps {
    /** Tên hiển thị của người xem (đã rơi về mã rút gọn nếu chưa có hồ sơ). */
    name: string
    avatar: string | null
    /** Hạt giống sinh ảnh mặc định — dùng userId để trùng với dòng của họ trong bảng. */
    seed: string
    /** Mã khung viền đang đeo; `null` = không đeo / chưa lấy được. */
    frameCode: string | null
    /**
     * Hạng trong kỳ đang xem. `null` (hoặc ≤ 0) = ĐÃ ĐĂNG NHẬP nhưng chưa có EXP trong kỳ —
     * KHÁC hẳn "chưa đăng nhập", xem doc-comment bên dưới.
     */
    rank: number | null
    /** EXP trong lát cắt đang xem; `null` = chưa biết. */
    xp: number | null
}

/**
 * Thẻ HỒ SƠ CỦA CHÍNH NGƯỜI XEM, ghim ở đáy bảng xếp hạng.
 *
 * <p><b>Vì sao ghim.</b> Bảng mở rộng được tới 100 dòng. Người đứng hạng 87 phải cuộn qua
 * 86 người lạ mới thấy mình, và cuộn tiếp một dòng là mất dấu. Thẻ ghim giữ "mình đang ở
 * đâu" luôn trên màn trong suốt lúc đọc bảng — đúng cách mọi bảng xếp hạng có phần thưởng
 * làm.
 *
 * <p><b>BA trạng thái, KHÔNG được gộp</b> (cùng tinh thần bốn-kết-cục của
 * {@link ../SeasonBoards/model}):
 * <ol>
 *   <li><b>Chưa đăng nhập</b> — thẻ này KHÔNG render. Câu đúng là lời mời đăng nhập
 *       (`seasonBoards.guest`) do khối cha nói, không phải một thẻ hồ sơ rỗng.</li>
 *   <li><b>Đã đăng nhập, chưa có hạng</b> (`rank == null`) — nói thẳng "bạn chưa có hạng
 *       trong kỳ này". Vẽ `#—` ở đây sẽ đọc thành "hệ thống chưa tải xong".</li>
 *   <li><b>Có hạng</b> — `#hạng` + EXP.</li>
 * </ol>
 */
export const ViewerRankCard = ({ name, avatar, seed, frameCode, rank, xp }: ViewerRankCardProps) => {
    const t = useTranslations("gamification.seasonBoards")
    const ranked = rank !== null && rank > 0

    return (
        <div className="flex items-center gap-3 rounded-2xl border border-accent/40 bg-surface p-3">
            <AvatarWithFrame
                username={name}
                avatar={avatar}
                seed={seed}
                size="md"
                frameCode={frameCode}
                highlighted
            />

            <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
                <Typography type="body-sm" weight="semibold" className="line-clamp-1">
                    {name}
                </Typography>
                <Chip size="sm" variant="soft" color="accent">
                    {t("you")}
                </Chip>
            </div>

            {ranked ? (
                <div className="flex shrink-0 flex-col items-end gap-0.5">
                    <Typography type="h6" weight="bold">
                        {`#${rank}`}
                    </Typography>
                    {xp !== null ? (
                        <Typography type="body-xs" color="muted">
                            {t("xp", { xp: formatXpShort(xp) })}
                        </Typography>
                    ) : null}
                </div>
            ) : (
                <Typography type="body-xs" color="muted" className="max-w-56 text-right">
                    {t("myRankUnranked")}
                </Typography>
            )}
        </div>
    )
}
