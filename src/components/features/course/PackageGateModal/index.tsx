"use client"

import React, { useMemo, useState } from "react"
import { Button, Chip, Modal, Skeleton, Typography, cn } from "@heroui/react"
import { CheckIcon, LockSimpleIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { isPaidOrderStatus } from "@/modules/api/rest/commerce"
import { useGetCoursePackageProductSwr } from "@/hooks/swr/api/rest/queries/useGetCoursePackageProductSwr"
import { usePostAddCartItemSwr } from "@/hooks/swr/api/rest/mutations/usePostAddCartItemSwr"
import { usePostCheckoutSwr } from "@/hooks/swr/api/rest/mutations/usePostCheckoutSwr"
import { usePaymentOverlayState } from "@/hooks/zustand/overlay/hooks"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { useQueryCoursePackagesSwr } from "@/components/features/course/hooks/useQueryCoursePackagesSwr"
import type { PackageView } from "@/modules/api/rest/course"
import type { CheapestPackage } from "@/modules/api/rest/course"

/** Props for {@link PackageGateModal}. */
export interface PackageGateModalProps {
    /** Whether the modal is open. */
    isOpen: boolean
    /** Close the modal ("Để sau"). */
    onClose: () => void
    /** Course slug (route id). */
    courseId: string
    /** Resolved course UUID used to fetch packages/products. */
    courseRawId: string
    /** Human course title shown in the modal header. */
    courseTitle: string
    /** Lesson id the gate is being opened for. */
    lessonId: string
    /** Optional lesson title for context-aware copy. */
    lessonTitle?: string
    /** Slugs of packages that unlock this lesson (intersection with course packages). */
    packageSlugs: Array<string>
    /** Cheapest package metadata from the locked content/stream response. */
    cheapestPackage?: CheapestPackage | null
    /** Which paywall entry triggered the modal — drives the title. */
    context: "document" | "video"
    /** Called after a successful purchase/free enrollment so the parent can revalidate lesson data. */
    onPurchased?: () => void
}

/**
 * Shared package gate modal used by both document teaser paywalls and video preview limits.
 *
 * Lists only the packages that actually unlock the current lesson, sorted cheapest-first,
 * and wires the real checkout flow: free packages enroll directly; paid packages resolve
 * the per-package product, add it to the cart, and open the shared PaymentModal.
 */
export const PackageGateModal = ({
    isOpen,
    onClose,
    courseRawId,
    courseTitle,
    lessonTitle,
    packageSlugs,
    cheapestPackage,
    context,
    onPurchased,
}: PackageGateModalProps) => {
    const t = useTranslations("courseSystem.preview")
    const { packages, isLoading, isError } = useQueryCoursePackagesSwr(courseRawId, { enabled: isOpen })

    const filteredPackages = useMemo(() => {
        const slugSet = new Set(packageSlugs)
        const eligible = packages.filter((pkg) => slugSet.has(pkg.slug))
        return [...eligible].sort((a, b) => Number(a.salePrice) - Number(b.salePrice))
    }, [packages, packageSlugs])

    const hasPackages = filteredPackages.length > 0
    const title = context === "video"
        ? t("modal.titleVideo", { lesson: lessonTitle ?? "" })
        : t("modal.titleDocument", { lesson: lessonTitle ?? "" })

    return (
        <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
            <Modal.Backdrop>
                <Modal.Container>
                    <Modal.Dialog className={cn("w-full max-w-2xl")}>
                        <Modal.Header>
                            <div className="flex items-start gap-3">
                                <div className="rounded-xl bg-accent/10 p-2 text-accent">
                                    <LockSimpleIcon aria-hidden focusable="false" className="size-5" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <Typography type="body" weight="bold">
                                        {title}
                                    </Typography>
                                    <Typography type="body-sm" color="muted">
                                        {courseTitle}
                                    </Typography>
                                </div>
                            </div>
                        </Modal.Header>
                        <Modal.Body className="flex flex-col gap-4">
                            {isLoading ? (
                                <PackageGateSkeleton />
                            ) : isError || !hasPackages ? (
                                <div className="flex flex-col items-center gap-3 py-6 text-center">
                                    <Typography type="body" weight="semibold">
                                        {t("modal.emptyTitle")}
                                    </Typography>
                                    <Typography type="body-sm" color="muted">
                                        {t("modal.emptyHint")}
                                    </Typography>
                                </div>
                            ) : (
                                <>
                                    {cheapestPackage ? (
                                        <Typography type="body-sm" color="muted">
                                            {t("modal.cheapestHint", { name: cheapestPackage.name })}
                                        </Typography>
                                    ) : null}
                                    <div className="grid grid-cols-1 gap-3">
                                        {filteredPackages.map((pkg) => (
                                            <PackageGateCard
                                                key={pkg.id}
                                                courseRawId={courseRawId}
                                                courseTitle={courseTitle}
                                                pkg={pkg}
                                                onPurchased={onPurchased}
                                                onClose={onClose}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </Modal.Body>
                        <Modal.Footer className="justify-end">
                            <Button variant="ghost" onPress={onClose}>
                                {t("modal.dismiss")}
                            </Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}

/** One selectable package card inside the gate modal. */
const PackageGateCard = ({
    courseRawId,
    courseTitle,
    pkg,
    onPurchased,
    onClose,
}: {
    courseRawId: string
    courseTitle: string
    pkg: PackageView
    onPurchased?: () => void
    onClose: () => void
}) => {
    const t = useTranslations("courseSystem.preview")
    const { guard } = useRequireAuth()
    const { data: product } = useGetCoursePackageProductSwr(courseRawId, pkg.id)
    const addCart = usePostAddCartItemSwr()
    const checkout = usePostCheckoutSwr()
    const payment = usePaymentOverlayState()
    const [isProcessing, setIsProcessing] = useState(false)

    const salePrice = Number(pkg.salePrice)
    const originalPrice = Number(pkg.originalPrice)
    const discount = originalPrice > salePrice
        ? Math.round((1 - salePrice / originalPrice) * 100)
        : 0

    const features = useMemo(() => parsePackageFeatures(pkg.descriptions), [pkg.descriptions])

    const handleSelect = guard(async () => {
        if (!product || isProcessing) return
        setIsProcessing(true)
        try {
            const item = await addCart.trigger({ productId: product.id, quantity: 1 })
            const isFree = (product.priceVnd ?? 0) === 0 && (product.priceCoin ?? 0) === 0
            if (isFree) {
                const result = await checkout.trigger({
                    itemIds: [item.id],
                    payMethod: "VIETQR",
                    idempotencyKey: crypto.randomUUID(),
                })
                if (isPaidOrderStatus(result.status)) {
                    onPurchased?.()
                    onClose()
                }
                return
            }
            payment.open({
                itemIds: [item.id],
                title: `${courseTitle} · ${pkg.name}`,
                amountVnd: product.priceVnd ?? 0,
                amountCoin: product.priceCoin ?? undefined,
                onSuccess: onPurchased,
            })
            onClose()
        } catch {
            // SWR surfaces the error; keep the modal open so the user can retry.
        } finally {
            setIsProcessing(false)
        }
    }, "auth.context.enroll")

    const ctaLabel = !product
        ? t("modal.resolving")
        : isProcessing || addCart.isMutating || checkout.isMutating
            ? t("modal.processing")
            : t("modal.cta")

    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-default bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                    <Typography type="body" weight="semibold">
                        {pkg.name}
                    </Typography>
                    {pkg.defaultPackage ? (
                        <Chip size="sm" variant="soft" color="accent">
                            {t("modal.recommended")}
                        </Chip>
                    ) : null}
                </div>
                <div className="flex flex-col items-end gap-0.5">
                    <Typography type="body" weight="bold" className="text-accent">
                        {t("price", { price: formatPrice(salePrice) })}
                    </Typography>
                    {originalPrice > salePrice ? (
                        <Typography type="body-xs" color="muted" className="line-through">
                            {t("price", { price: formatPrice(originalPrice) })}
                        </Typography>
                    ) : null}
                    {discount > 0 ? (
                        <Chip size="sm" variant="soft" color="success">
                            {t("discount", { percent: discount })}
                        </Chip>
                    ) : null}
                </div>
            </div>
            {features.length > 0 ? (
                <ul className="flex flex-col gap-1.5">
                    {features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm text-muted">
                            <CheckIcon aria-hidden focusable="false" className="mt-0.5 size-4 shrink-0 text-success" />
                            <span>{feature}</span>
                        </li>
                    ))}
                </ul>
            ) : null}
            <Button
                variant="primary"
                className="self-stretch"
                isDisabled={!product || isProcessing}
                isPending={isProcessing || addCart.isMutating || checkout.isMutating}
                onPress={handleSelect}
            >
                {ctaLabel}
            </Button>
        </div>
    )
}

/** Skeleton while packages are loading. */
const PackageGateSkeleton = () => (
    <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-1/2 rounded-md" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
    </div>
)

/** Splits a package description into feature bullets. */
const parsePackageFeatures = (description?: string | null): Array<string> => {
    const raw = description?.trim()
    if (!raw) return []
    const bySentence = raw
        .split(/\.\s+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => (s.endsWith(".") ? s.slice(0, -1).trim() : s))
        .filter(Boolean)
    if (bySentence.length > 1) return bySentence
    const byComma = raw.split(",").map((s) => s.trim()).filter(Boolean)
    return byComma.length > 0 ? byComma : [raw]
}

/** Formats a VND price with comma separators. */
const formatPrice = (value: number): string =>
    Number.isFinite(value) ? value.toLocaleString("vi-VN") : "0"
