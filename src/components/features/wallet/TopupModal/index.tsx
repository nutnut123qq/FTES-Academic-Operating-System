"use client"

import React, { useEffect, useState } from "react"
import { Button, Chip, Modal, Skeleton, Spinner, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import {
    CheckCircleIcon,
    CoinsIcon,
    WarningCircleIcon,
} from "@phosphor-icons/react"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { formatVnd } from "@/components/blocks/commerce/PriceTag"
import { QRCode } from "@/components/reuseable/QRCode"
import { useRestWithToast } from "@/modules/toast/hooks"
import type { TopupPackView } from "@/modules/api/rest/wallet"
import {
    usePostTopupOrderSwr,
    useTopupOrderStatusSwr,
    useTopupPacksSwr,
} from "../hooks/useTopupSwr"

/** Props for {@link TopupModal}. */
export interface TopupModalProps {
    isOpen: boolean
    onClose: () => void
    /**
     * Called once the bank has confirmed and the coins are in the wallet — the shell
     * uses it to revalidate the balance through its BOUND mutate.
     */
    onCredited: () => void
}

/** Skeleton mirroring the pack grid (four cards, two per row). */
const PacksSkeleton = () => (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[0, 1, 2, 3].map((index) => (
            <div key={index} className="flex flex-col gap-2 rounded-2xl border border-separator p-4">
                <Skeleton className="h-4 w-24 rounded-full" />
                <Skeleton className="h-3 w-32 rounded-full" />
                <Skeleton className="h-4 w-20 rounded-full" />
            </div>
        ))}
    </div>
)

/** One selectable pack card. */
const PackCard = ({
    pack,
    isSelected,
    onSelect,
    coinLabel,
}: {
    pack: TopupPackView
    isSelected: boolean
    onSelect: () => void
    coinLabel: string
}) => (
    <button
        type="button"
        onClick={onSelect}
        aria-pressed={isSelected}
        className={`flex flex-col items-start gap-1 rounded-2xl border p-4 text-left transition-colors ${
            isSelected
                ? "border-accent bg-accent/10"
                : "border-separator hover:border-accent/50"
        }`}
    >
        <div className="flex items-center gap-2">
            <CoinsIcon className="size-5 text-warning" aria-hidden="true" />
            <Typography type="body" weight="bold" className="tabular-nums">
                {pack.coinAmount.toLocaleString()} {coinLabel}
            </Typography>
        </div>
        {pack.description ? (
            <Typography type="body-xs" color="muted">
                {pack.description}
            </Typography>
        ) : null}
        <Typography type="body-sm" weight="semibold" className="text-accent tabular-nums">
            {formatVnd(pack.priceVnd)}
        </Typography>
    </button>
)

/**
 * TopupModal — buy FCoin with a bank transfer (VietQR).
 *
 * Two screens in one dialog: PICK a pack, then PAY the QR it produced.
 *
 * <h3>Why the QR screen keeps waiting instead of declaring success</h3>
 * `POST /wallet/topup/orders` only OPENS the order. The coins are credited by the bank
 * webhook, which lands seconds to minutes later, so this dialog polls the commerce order
 * and says "done" only when the order itself says PAID. Telling the payer their coins had
 * arrived at the moment the QR rendered would be a lie roughly every time.
 *
 * <h3>Why one order per opening</h3>
 * The create button is disabled while its request is in flight, and once an order exists
 * the pick screen is gone — so a second order cannot be opened behind the first, and the
 * payer can never be looking at a QR that is no longer the one being watched. (The BE
 * also hands back the same pending order for a repeat request; this is the FE half.)
 */
export const TopupModal = ({ isOpen, onClose, onCredited }: TopupModalProps) => {
    const t = useTranslations("wallet.topup")
    const tCoin = useTranslations("wallet")
    const runRest = useRestWithToast()

    const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
    const [orderId, setOrderId] = useState<string | null>(null)
    const [qrPayload, setQrPayload] = useState<string>("")
    const [amountVnd, setAmountVnd] = useState<number>(0)
    const [hasCredited, setHasCredited] = useState(false)

    const packsSwr = useTopupPacksSwr(isOpen)
    const { trigger: createOrder, isMutating } = usePostTopupOrderSwr()
    const { isPaid, isSettled, status } = useTopupOrderStatusSwr(orderId)

    const packs = packsSwr.data ?? []
    const isEmpty = packs.length === 0

    // Reset when the dialog closes so re-opening starts on the pick screen instead of an
    // order from an earlier session that may already be expired.
    useEffect(() => {
        if (!isOpen) {
            setSelectedProductId(null)
            setOrderId(null)
            setQrPayload("")
            setAmountVnd(0)
            setHasCredited(false)
        }
    }, [isOpen])

    // Refresh the balance exactly ONCE per paid order — `onCredited` revalidates the
    // wallet, and without the latch every poll tick after payment would re-fire it.
    useEffect(() => {
        if (isPaid && !hasCredited) {
            setHasCredited(true)
            onCredited()
        }
    }, [isPaid, hasCredited, onCredited])

    const handleCreateOrder = async () => {
        if (!selectedProductId || isMutating || orderId) return
        const created = await runRest(
            async () => createOrder({ productId: selectedProductId }),
            { successMessage: t("orderCreated") },
        )
        if (created) {
            setOrderId(created.orderId)
            setQrPayload(created.qrCode ?? "")
            setAmountVnd(created.amountVnd ?? 0)
        }
    }

    const selectedPack = packs.find((pack) => pack.productId === selectedProductId)

    return (
        <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
            <Modal.Backdrop>
                <Modal.Container>
                    <Modal.Dialog className="w-full max-w-lg">
                        <Modal.Header>
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                                    <CoinsIcon className="size-5" />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <Typography type="h6" weight="bold">
                                        {t("title")}
                                    </Typography>
                                    <Typography type="body-xs" color="muted">
                                        {orderId ? t("paySubtitle") : t("subtitle")}
                                    </Typography>
                                </div>
                            </div>
                        </Modal.Header>

                        <Modal.Body className="flex flex-col gap-4 py-2">
                            {orderId ? (
                                /* ---------------- pay screen ---------------- */
                                <div className="flex flex-col items-center gap-3 text-center">
                                    {isPaid ? (
                                        <>
                                            <CheckCircleIcon
                                                className="size-12 text-success"
                                                aria-hidden="true"
                                            />
                                            <Typography type="body" weight="bold">
                                                {t("paidTitle")}
                                            </Typography>
                                            <Typography type="body-sm" color="muted">
                                                {t("paidDescription", {
                                                    coin: (selectedPack?.coinAmount ?? 0).toLocaleString(),
                                                    unit: tCoin("coin"),
                                                })}
                                            </Typography>
                                        </>
                                    ) : isSettled ? (
                                        <>
                                            <WarningCircleIcon
                                                className="size-12 text-danger"
                                                aria-hidden="true"
                                            />
                                            <Typography type="body" weight="bold">
                                                {t("notPaidTitle")}
                                            </Typography>
                                            <Typography type="body-sm" color="muted">
                                                {t("notPaidDescription")}
                                            </Typography>
                                        </>
                                    ) : (
                                        <>
                                            {qrPayload ? (
                                                <QRCode size={200} data={qrPayload} />
                                            ) : null}
                                            <Typography type="h6" weight="bold" className="tabular-nums">
                                                {formatVnd(amountVnd)}
                                            </Typography>
                                            <div className="flex items-center gap-2">
                                                <Spinner size="sm" color="current" />
                                                <Typography type="body-sm" color="muted">
                                                    {t("awaitingBank")}
                                                </Typography>
                                            </div>
                                            <Typography type="body-xs" color="muted">
                                                {t("awaitingHint")}
                                            </Typography>
                                            {status ? (
                                                <Chip size="sm" variant="soft" color="warning">
                                                    {status}
                                                </Chip>
                                            ) : null}
                                        </>
                                    )}
                                </div>
                            ) : (
                                /* ---------------- pick screen ---------------- */
                                <AsyncContent
                                    isLoading={packsSwr.isLoading && isEmpty}
                                    skeleton={<PacksSkeleton />}
                                    isEmpty={isEmpty}
                                    emptyContent={{
                                        title: t("noPacks"),
                                        icon: (
                                            <CoinsIcon
                                                aria-hidden
                                                focusable="false"
                                                className="size-8 text-muted"
                                            />
                                        ),
                                    }}
                                    error={isEmpty ? packsSwr.error : undefined}
                                    errorContent={{
                                        title: t("packsError"),
                                        onRetry: () => void packsSwr.mutate(),
                                        retryLabel: t("retry"),
                                    }}
                                >
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {packs.map((pack) => (
                                            <PackCard
                                                key={pack.productId}
                                                pack={pack}
                                                coinLabel={tCoin("coin")}
                                                isSelected={pack.productId === selectedProductId}
                                                onSelect={() => setSelectedProductId(pack.productId)}
                                            />
                                        ))}
                                    </div>
                                </AsyncContent>
                            )}
                        </Modal.Body>

                        <Modal.Footer className="justify-end">
                            <Button variant="ghost" size="sm" onPress={onClose}>
                                {t("close")}
                            </Button>
                            {orderId ? null : (
                                <Button
                                    variant="primary"
                                    size="sm"
                                    isDisabled={!selectedProductId || isMutating}
                                    isPending={isMutating}
                                    onPress={() => void handleCreateOrder()}
                                >
                                    {({ isPending }) => (
                                        <>
                                            {isPending ? <Spinner color="current" size="sm" /> : null}
                                            {t("createOrder")}
                                        </>
                                    )}
                                </Button>
                            )}
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}
