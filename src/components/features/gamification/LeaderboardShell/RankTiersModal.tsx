"use client"

import React from "react"
import Image from "next/image"
import { Button, Chip, Modal, Typography, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { LockSimpleIcon } from "@phosphor-icons/react"
import { formatXpShort } from "@/utils/xp-format"
import { RANK_TIERS, tierFromXp } from "../leaderboardTiers"

/** Props for {@link RankTiersModal}. */
export interface RankTiersModalProps {
    isOpen: boolean
    onClose: () => void
    /**
     * TỔNG EXP của người xem — cùng con số mà khối "Hạng hiện tại" đang vẽ, nên thang
     * hạng không bao giờ nói khác cái huy hiệu vừa được bấm.
     *
     * `null` = CHƯA BIẾT (khách vãng lai, hoặc snapshot `/me/*` chưa về). Đây KHÔNG phải
     * "0 EXP": 0 EXP vẫn mở khoá hạng Đồng, còn `null` thì không hạng nào được đánh dấu
     * và cũng KHÔNG hạng nào bị khoá — xem chú thích ở thân hàm.
     */
    viewerXp: number | null
}

/**
 * Thang hạng CỦA CẢ HỆ THỐNG — mở ra từ chính cái huy hiệu hạng ở `/leaderboard`.
 *
 * <p><b>Vì sao cần.</b> Trang chỉ hiện MỘT huy hiệu (hạng đang đứng) kèm thanh tiến độ tới
 * hạng kế. Người xem không có đường nào biết hệ thống có mấy hạng, hạng cuối là gì, và mỗi
 * hạng đòi bao nhiêu EXP — trong khi đó chính là thứ quyết định họ có cày tiếp hay không.
 * Bảng ngưỡng có sẵn ở trang "Cách tính điểm", nhưng đó là một trang khác và không ai rời
 * bảng xếp hạng để đi tra.
 *
 * <p><b>KHOÁ ≠ CHƯA BIẾT.</b> Ổ khoá chỉ được vẽ khi đã biết chắc người xem còn thiếu EXP
 * (`viewerXp !== null && viewerXp < minXp`). Với khách vãng lai (`viewerXp === null`) thì
 * cả năm hạng hiện SÁNG, không hạng nào khoá và không hạng nào là "hiện tại": khoá sạch
 * năm hạng sẽ đọc thành "phải đăng nhập mới xem được thang hạng", tức là nói sai — thang
 * hạng là thông tin công khai, chỉ có VỊ TRÍ của người xem trên đó mới cần đăng nhập.
 *
 * <p>Danh sách đi theo đúng thứ tự tăng dần của {@link RANK_TIERS} (nguồn duy nhất của cả
 * ngưỡng lẫn art), nên thêm/sửa một hạng ở đó là cả thang tự đúng.
 */
export const RankTiersModal = ({ isOpen, onClose, viewerXp }: RankTiersModalProps) => {
    const t = useTranslations("gamification")

    // `null` ⇒ KHÔNG suy ra hạng nào cả (đừng gọi `tierFromXp(0)` cho tiện: nó sẽ đánh dấu
    // Đồng là "hạng hiện tại" của một người mình còn chưa biết là ai).
    const currentKey = viewerXp === null ? null : tierFromXp(viewerXp).tier.key

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={(open) => {
                if (!open) onClose()
            }}
        >
            <Modal.Backdrop>
                <Modal.Container>
                    <Modal.Dialog className="w-full max-w-md">
                        <Modal.Header>
                            <div className="flex flex-col gap-0.5">
                                <Typography type="h6" weight="bold">
                                    {t("rankTiers.title")}
                                </Typography>
                                <Typography type="body-xs" color="muted">
                                    {viewerXp === null
                                        ? t("rankTiers.guestHint")
                                        : t("rankTiers.subtitle")}
                                </Typography>
                            </div>
                        </Modal.Header>

                        <Modal.Body className="max-h-[60vh] overflow-y-auto py-2">
                            <ul className="flex flex-col gap-2">
                                {RANK_TIERS.map((tier) => {
                                    const name = t(`tiers.${tier.key}`)
                                    const locked = viewerXp !== null && viewerXp < tier.minXp
                                    const isCurrent = tier.key === currentKey
                                    // Một câu cho MỖI trạng thái. Câu này đi vào NỘI DUNG hàng
                                    // (một `span.sr-only`), KHÔNG vào `aria-label` của `<li>`:
                                    // với `role="listitem"` — phần tử không tương tác — chuyện
                                    // trình đọc màn hình có tôn trọng `aria-label` (thay thế
                                    // nội dung) hay bỏ qua nó là KHÔNG thống nhất giữa
                                    // NVDA/JAWS/VoiceOver. Ở nhánh bỏ qua, trạng thái khoá biến
                                    // mất sạch: ảnh mờ và ổ khoá đều `aria-hidden`, nên người
                                    // dùng nghe "Bạc, Từ 25K XP" giống hệt hàng đã mở khoá.
                                    // Nhãn sr-only thì luôn được đọc. Cùng pattern với tab
                                    // icon-only ở `SeasonBoards/index.tsx`.
                                    const ariaLabel = locked
                                        ? t("rankTiers.lockedAria", {
                                            tier: name,
                                            xp: formatXpShort(tier.minXp),
                                        })
                                        : isCurrent
                                            ? t("rankTiers.currentAria", { tier: name })
                                            : t("rankTiers.unlockedAria", { tier: name })

                                    return (
                                        <li
                                            key={tier.key}
                                            className={cn(
                                                "flex items-center gap-3 rounded-2xl border p-3",
                                                isCurrent
                                                    ? "border-accent bg-accent/5"
                                                    : "border-default",
                                            )}
                                        >
                                            {/* Trạng thái hàng nằm ở đây — trong nội dung, đọc
                                                được ở mọi trình đọc màn hình. Phần nhìn thấy
                                                (ảnh mờ + ổ khoá) là trang trí và `aria-hidden`. */}
                                            <span className="sr-only">{ariaLabel}</span>
                                            <div className="relative shrink-0">
                                                {/* `next/image` chứ không phải `<img>` thô: art
                                                    huy hiệu là PNG ~250 KB/tấm mà ô vẽ chỉ 48px,
                                                    nên năm hạng vẽ thô là ~1,3 MB tải về cho một
                                                    danh sách icon. Ảnh nằm trong `public/` nên
                                                    không cần khai `remotePatterns`. */}
                                                <Image
                                                    src={tier.badgeSrc}
                                                    alt=""
                                                    aria-hidden
                                                    width={48}
                                                    height={48}
                                                    className={cn(
                                                        "size-12 object-contain",
                                                        locked && "opacity-40 grayscale",
                                                    )}
                                                />
                                                {locked ? (
                                                    <span className="absolute inset-0 flex items-center justify-center">
                                                        <LockSimpleIcon
                                                            weight="fill"
                                                            aria-hidden
                                                            focusable="false"
                                                            className="size-5 text-muted"
                                                        />
                                                    </span>
                                                ) : null}
                                            </div>

                                            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                                <Typography type="body-sm" weight="semibold">
                                                    {name}
                                                </Typography>
                                                <Typography type="body-xs" color="muted">
                                                    {t("rankTiers.threshold", {
                                                        xp: formatXpShort(tier.minXp),
                                                    })}
                                                </Typography>
                                            </div>

                                            {isCurrent ? (
                                                <Chip size="sm" variant="soft" color="accent">
                                                    {t("rankTiers.current")}
                                                </Chip>
                                            ) : null}
                                        </li>
                                    )
                                })}
                            </ul>
                        </Modal.Body>

                        <Modal.Footer className="justify-end">
                            <Button variant="ghost" size="sm" onPress={onClose}>
                                {t("rankTiers.close")}
                            </Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}
