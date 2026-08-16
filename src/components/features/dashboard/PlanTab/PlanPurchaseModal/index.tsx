"use client"

import React from "react"
import { Button, Modal, Slider, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { CheckCircleIcon, ClockIcon, CoinsIcon, XCircleIcon } from "@phosphor-icons/react"
import { QRCode } from "@/components/reuseable/QRCode"
import { formatVnd } from "@/components/blocks/commerce/PriceTag"
import type { PlanOrderPhase } from "../planOrderPhase"
import type { PlanPurchaseTicket } from "../usePlanPurchase"

/**
 * Phần "dùng Xu" của hộp thoại. Vắng ⇒ màn đó không bán bằng Xu và không có gì đổi so với
 * trước. Mọi con số ở đây do backend cấp (báo giá `GET /commerce/coin/quote`), component
 * chỉ vẽ lại.
 */
export interface PlanPurchaseCoinProps {
    /** Đang hỏi báo giá. */
    isLoading: boolean
    /** Không hỏi được báo giá — vẫn trả đủ bằng chuyển khoản được. */
    hasError: boolean
    /** Số dư Xu của người mua. */
    balance: number
    /** Tỉ lệ quy đổi: 1 Xu = bao nhiêu VND. */
    vndPerCoin: number
    /** TRẦN Xu áp được cho đơn này (`0` ⇒ không có gì để chọn). */
    maxCoin: number
    /** Số Xu đang chọn. */
    coin: number
    /** Số VND đang được giảm nhờ lựa chọn hiện tại. */
    discountVnd: number
    /** Số VND còn phải trả sau khi trừ Xu. */
    payableVnd: number
    /** Lựa chọn hiện tại phủ trọn đơn (không còn gì để chuyển khoản). */
    coversAll: boolean
    /** Đổi số Xu muốn dùng. */
    onChange: (coin: number) => void
    /** Huỷ đơn đang chờ để lấy lại Xu đã trừ. */
    onCancelOrder?: () => void
    /** Đang gọi huỷ đơn. */
    isCancelling?: boolean
}

/** Props for {@link PlanPurchaseModal}. */
export interface PlanPurchaseModalProps {
    /** Whether the dialog is open. */
    isOpen: boolean
    /** Close the dialog (backdrop, Esc, cancel). Ignored while the order is being created. */
    onClose: () => void
    /** What is being bought, already localized (plan / membership name). */
    planLabel: string
    /** The amount that will be charged, already formatted (e.g. `199.000₫`). */
    amountLabel: string
    /** Optional extra line under the amount (e.g. how long one purchase lasts). */
    amountHint?: string | null
    /** True while the create-order mutation is in flight. */
    isStarting: boolean
    /** Localized failure line for a checkout that never started; `null` clears it. */
    errorMessage?: string | null
    /** The live order, once one exists. */
    ticket: PlanPurchaseTicket | null
    /** Settled state of {@link ticket}; `null` while still on the confirm step. */
    phase: PlanOrderPhase | null
    /** Create the order (confirm step). */
    onConfirm: () => void
    /** Throw the dead order away and return to the confirm step. */
    onRetry: () => void
    /** Bật phần "dùng Xu"; vắng ⇒ màn này không dùng Xu. */
    coin?: PlanPurchaseCoinProps
}

/**
 * The buy dialog shared by both plan screens of the dashboard "My Plan" tab — the same
 * two beats the course checkout uses: **confirm what you are buying, then pay a bank QR
 * while the order is polled.**
 *
 * There is no payment gateway to be sent to, so the dialog never navigates: the buyer
 * stays here from confirm → QR → settled, and every outcome is stated in place.
 *
 * - **Confirm** — plan, amount, chỗ chọn số Xu muốn dùng, and a notice that nothing is
 *   charged yet. This step is what makes the purchase deliberate; the order is created
 *   only by the confirm press.
 * - **Awaiting** — the VietQR payload plus the order id (which is also the transfer
 *   reference). It says the screen updates itself, because the usual reaction to silence
 *   on this screen is to transfer a second time.
 * - **Paid / expired / failed** — the settled outcome. Expired is kept separate from
 *   failed: the hold ran out, nothing broke, and a late transfer can still be reconciled.
 *
 * **Xu trên đường tiền.** Số Xu là thứ bị TRỪ NGAY khi đơn được tạo, nên: (1) sau khi có
 * đơn, ô chọn Xu biến mất — số Xu đã áp là con số của backend trong `ticket`, không phải
 * lựa chọn đang treo ở FE; (2) đơn đang chờ mà có Xu thì luôn kèm nút huỷ, vì đó là đường
 * duy nhất lấy Xu về ví; (3) Xu phủ trọn đơn ⇒ không có QR nào để hiện, và màn hình nói
 * thẳng là không cần chuyển khoản.
 *
 * A checkout that fails to start keeps the dialog open with the failure and an explicit
 * "nothing was charged" line, rather than closing or routing away.
 *
 * @param props - {@link PlanPurchaseModalProps}
 */
export const PlanPurchaseModal = ({
    isOpen,
    onClose,
    planLabel,
    amountLabel,
    amountHint = null,
    isStarting,
    errorMessage = null,
    ticket,
    phase,
    onConfirm,
    onRetry,
    coin,
}: PlanPurchaseModalProps) => {
    const t = useTranslations()

    /** Xu đã áp THẬT vào đơn (số của backend) — chỉ có khi đơn đã tồn tại. */
    const appliedCoin = ticket?.coinApplied ?? 0
    /** Lựa chọn đang treo ở bước xác nhận (chưa có đơn ⇒ chưa trừ gì). */
    const pendingCoin = phase === null ? (coin?.coin ?? 0) : 0

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={(open) => {
                if (!open && !isStarting) {
                    onClose()
                }
            }}
        >
            <Modal.Backdrop>
                <Modal.Container>
                    <Modal.Dialog className="w-full max-w-md">
                        <Modal.Header>
                            <Typography type="body" weight="bold">
                                {t("profileSettings.purchase.title")}
                            </Typography>
                        </Modal.Header>
                        <Modal.Body>
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col gap-2 rounded-2xl border border-separator p-3">
                                    <div className="flex items-baseline justify-between gap-3">
                                        <Typography type="body-xs" color="muted">
                                            {t("profileSettings.purchase.planLabel")}
                                        </Typography>
                                        <Typography type="body-sm" weight="semibold">
                                            {planLabel}
                                        </Typography>
                                    </div>
                                    <div className="flex items-baseline justify-between gap-3">
                                        <Typography type="body-xs" color="muted">
                                            {t("profileSettings.purchase.amountLabel")}
                                        </Typography>
                                        <Typography type="body" weight="bold">
                                            {ticket ? formatVnd(ticket.amount) : amountLabel}
                                        </Typography>
                                    </div>
                                    {/* Xu đã áp: ở bước xác nhận là lựa chọn đang treo, sau khi có đơn
                                        là con số backend đã trừ. Hai nguồn khác nhau nên không gộp. */}
                                    {appliedCoin > 0 || pendingCoin > 0 ? (
                                        <div className="flex items-baseline justify-between gap-3">
                                            <Typography type="body-xs" color="muted">
                                                {t("profileSettings.purchase.coin.discountLabel", {
                                                    coin: appliedCoin > 0 ? appliedCoin : pendingCoin,
                                                })}
                                            </Typography>
                                            <Typography type="body-sm" weight="semibold" className="text-success">
                                                {`−${formatVnd(
                                                    appliedCoin > 0
                                                        ? ticket?.coinDiscountVnd ?? 0
                                                        : coin?.discountVnd ?? 0,
                                                )}`}
                                            </Typography>
                                        </div>
                                    ) : null}
                                    {phase === null && pendingCoin > 0 ? (
                                        <div className="flex items-baseline justify-between gap-3">
                                            <Typography type="body-xs" color="muted">
                                                {t("profileSettings.purchase.coin.remainingLabel")}
                                            </Typography>
                                            <Typography type="body" weight="bold">
                                                {formatVnd(coin?.payableVnd ?? 0)}
                                            </Typography>
                                        </div>
                                    ) : null}
                                    {amountHint ? (
                                        <Typography type="body-xs" color="muted" className="text-right">
                                            {amountHint}
                                        </Typography>
                                    ) : null}
                                </div>

                                {phase === null && coin ? (
                                    <CoinPicker coin={coin} />
                                ) : null}

                                {phase === null ? (
                                    <Typography type="body-xs" color="muted">
                                        {t(
                                            coin?.coversAll
                                                ? "profileSettings.purchase.coin.noticeCoinOnly"
                                                : "profileSettings.purchase.notice",
                                        )}
                                    </Typography>
                                ) : null}

                                {phase === "awaiting" && ticket ? (
                                    <div className="flex flex-col items-center gap-3 py-1">
                                        <QRCode size={200} data={ticket.qrCode} />
                                        <Typography type="body-sm" color="muted" className="text-center">
                                            {t("profileSettings.purchase.scanHint")}
                                        </Typography>
                                        <div className="flex w-full items-baseline justify-between gap-3">
                                            <Typography type="body-xs" color="muted">
                                                {t("profileSettings.purchase.orderLabel")}
                                            </Typography>
                                            <Typography
                                                type="body-xs"
                                                weight="semibold"
                                                className="break-all text-right"
                                            >
                                                {ticket.orderId}
                                            </Typography>
                                        </div>
                                        <Typography
                                            type="body-sm"
                                            weight="semibold"
                                            className="text-accent"
                                            aria-live="polite"
                                        >
                                            {t("profileSettings.purchase.awaiting")}
                                        </Typography>
                                        <Typography type="body-xs" color="muted" className="text-center">
                                            {t("profileSettings.purchase.awaitingHint")}
                                        </Typography>
                                        {/* Xu đã rời ví rồi: nói thẳng, và luôn để sẵn đường lấy lại. */}
                                        {appliedCoin > 0 ? (
                                            <div className="flex w-full flex-col items-center gap-2 rounded-2xl bg-default p-3">
                                                <Typography type="body-xs" color="muted" className="text-center">
                                                    {t("profileSettings.purchase.coin.heldHint", {
                                                        coin: appliedCoin,
                                                    })}
                                                </Typography>
                                                {coin?.onCancelOrder ? (
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        onPress={coin.onCancelOrder}
                                                        isPending={coin.isCancelling}
                                                        isDisabled={coin.isCancelling}
                                                    >
                                                        {t("profileSettings.purchase.coin.cancelOrder")}
                                                    </Button>
                                                ) : null}
                                            </div>
                                        ) : null}
                                    </div>
                                ) : null}

                                {phase === "paid" ? (
                                    <div
                                        className="flex flex-col items-center gap-2 py-2"
                                        aria-live="polite"
                                    >
                                        <CheckCircleIcon
                                            weight="fill"
                                            className="size-12 text-success"
                                            aria-hidden
                                            focusable="false"
                                        />
                                        <Typography type="body" weight="bold">
                                            {t("profileSettings.purchase.paid")}
                                        </Typography>
                                        <Typography type="body-xs" color="muted" className="text-center">
                                            {t("profileSettings.purchase.paidHint")}
                                        </Typography>
                                        {appliedCoin > 0 && (ticket?.amount ?? 0) === 0 ? (
                                            <Typography type="body-xs" color="muted" className="text-center">
                                                {t("profileSettings.purchase.coin.paidByCoinHint", {
                                                    coin: appliedCoin,
                                                })}
                                            </Typography>
                                        ) : null}
                                    </div>
                                ) : null}

                                {phase === "expired" || phase === "failed" ? (
                                    <div
                                        className="flex flex-col items-center gap-2 py-2"
                                        aria-live="polite"
                                    >
                                        {phase === "expired" ? (
                                            <ClockIcon
                                                weight="fill"
                                                className="size-12 text-muted"
                                                aria-hidden
                                                focusable="false"
                                            />
                                        ) : (
                                            <XCircleIcon
                                                weight="fill"
                                                className="size-12 text-danger"
                                                aria-hidden
                                                focusable="false"
                                            />
                                        )}
                                        <Typography type="body" weight="bold">
                                            {t(
                                                phase === "expired"
                                                    ? "profileSettings.purchase.expired"
                                                    : "profileSettings.purchase.orderFailed",
                                            )}
                                        </Typography>
                                        <Typography type="body-xs" color="muted" className="text-center">
                                            {t(
                                                phase === "expired"
                                                    ? "profileSettings.purchase.expiredHint"
                                                    : "profileSettings.purchase.orderFailedHint",
                                            )}
                                        </Typography>
                                        {appliedCoin > 0 ? (
                                            <Typography type="body-xs" color="muted" className="text-center">
                                                {t("profileSettings.purchase.coin.releasedHint", {
                                                    coin: appliedCoin,
                                                })}
                                            </Typography>
                                        ) : null}
                                    </div>
                                ) : null}

                                {errorMessage ? (
                                    <Typography type="body-xs" className="text-danger">
                                        {errorMessage}
                                    </Typography>
                                ) : null}
                            </div>
                        </Modal.Body>
                        <Modal.Footer className="justify-end gap-2">
                            <Button
                                size="sm"
                                variant="ghost"
                                onPress={onClose}
                                isDisabled={isStarting}
                            >
                                {t(phase === null ? "common.cancel" : "common.close")}
                            </Button>
                            {phase === null ? (
                                <Button
                                    size="sm"
                                    variant="primary"
                                    onPress={onConfirm}
                                    isPending={isStarting}
                                    isDisabled={isStarting}
                                >
                                    {t(
                                        coin?.coversAll
                                            ? "profileSettings.purchase.coin.confirmCoinOnly"
                                            : "profileSettings.purchase.confirm",
                                    )}
                                </Button>
                            ) : null}
                            {phase === "expired" || phase === "failed" ? (
                                <Button size="sm" variant="primary" onPress={onRetry}>
                                    {t("profileSettings.purchase.retry")}
                                </Button>
                            ) : null}
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}

/**
 * Chọn số Xu muốn dùng cho đơn này.
 *
 * Bốn trạng thái, không trạng thái nào được nói dối: đang hỏi báo giá · hỏi không được (vẫn
 * mua được, chỉ là không giảm) · không có Xu nào áp được cho đơn này · và trường hợp thường —
 * thanh trượt từ 0 tới TRẦN do backend cấp.
 *
 * Mặc định là 0: Xu là tiền, không tiêu hộ ai. "Dùng tối đa" là một lần bấm.
 */
const CoinPicker = ({ coin }: { coin: PlanPurchaseCoinProps }) => {
    const t = useTranslations()

    if (coin.isLoading) {
        return (
            <Typography type="body-xs" color="muted">
                {t("profileSettings.purchase.coin.loading")}
            </Typography>
        )
    }
    if (coin.hasError) {
        return (
            <Typography type="body-xs" color="muted">
                {t("profileSettings.purchase.coin.quoteError")}
            </Typography>
        )
    }
    if (coin.maxCoin <= 0) {
        return (
            <Typography type="body-xs" color="muted">
                {t("profileSettings.purchase.coin.none", { balance: coin.balance })}
            </Typography>
        )
    }

    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-separator p-3">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <CoinsIcon className="size-4 text-warning" aria-hidden focusable="false" />
                    <Typography type="body-sm" weight="semibold">
                        {t("profileSettings.purchase.coin.title")}
                    </Typography>
                </div>
                <Typography type="body-xs" color="muted">
                    {t("profileSettings.purchase.coin.balance", { balance: coin.balance })}
                </Typography>
            </div>

            <Slider
                aria-label={t("profileSettings.purchase.coin.sliderLabel")}
                minValue={0}
                maxValue={coin.maxCoin}
                step={1}
                value={coin.coin}
                onChange={(value) => coin.onChange(Array.isArray(value) ? value[0] : value)}
            >
                <Slider.Track>
                    <Slider.Fill />
                    <Slider.Thumb />
                </Slider.Track>
            </Slider>

            <div className="flex items-center justify-between gap-2">
                <Typography type="body-sm" weight="semibold">
                    {t("profileSettings.purchase.coin.selected", { coin: coin.coin })}
                </Typography>
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="tertiary"
                        onPress={() => coin.onChange(0)}
                        isDisabled={coin.coin === 0}
                    >
                        {t("profileSettings.purchase.coin.clear")}
                    </Button>
                    <Button
                        size="sm"
                        variant="secondary"
                        onPress={() => coin.onChange(coin.maxCoin)}
                        isDisabled={coin.coin === coin.maxCoin}
                    >
                        {t("profileSettings.purchase.coin.useMax")}
                    </Button>
                </div>
            </div>

            <Typography type="body-xs" color="muted">
                {t("profileSettings.purchase.coin.rateHint", {
                    vnd: formatVnd(coin.vndPerCoin),
                })}
            </Typography>
        </div>
    )
}
