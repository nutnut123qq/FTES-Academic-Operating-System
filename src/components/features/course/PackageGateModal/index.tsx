"use client"

import React, { useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { Button, Chip, Modal, Skeleton, Typography, cn } from "@heroui/react"
import { ArrowRightIcon, CheckCircleIcon, XIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { isPaidOrderStatus } from "@/modules/api/rest/commerce"
import { useGetCourseProductSwr } from "@/hooks/swr/api/rest/queries/useGetCourseProductSwr"
import { useGetCoursePackageProductSwr } from "@/hooks/swr/api/rest/queries/useGetCoursePackageProductSwr"
import { usePostAddCartItemSwr } from "@/hooks/swr/api/rest/mutations/usePostAddCartItemSwr"
import { usePostCheckoutSwr } from "@/hooks/swr/api/rest/mutations/usePostCheckoutSwr"
import { usePaymentOverlayState } from "@/hooks/zustand/overlay/hooks"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { useQueryCoursePackagesSwr } from "@/components/features/course/hooks/useQueryCoursePackagesSwr"
import { SegmentedControl } from "@/components/blocks/navigation/SegmentedControl"
import { CoverImage } from "@/components/blocks/media/CoverImage"
import { PriceTag, formatVnd } from "@/components/blocks/commerce/PriceTag"
import type { PackageView } from "@/modules/api/rest/course"
import type { CheapestPackage } from "@/modules/api/rest/course"
import type { ProductForCourseView } from "@/modules/api/rest/commerce"

/** Which step of the checkout shell is shown — mirrors the legacy "Tóm tắt / Thanh toán" tabs. */
type CheckoutTab = "summary" | "payment"

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
    /** Human course title shown as the summary order line. */
    courseTitle: string
    /**
     * Course cover art (`course.imageHeader`) shown as the rounded-square thumbnail on
     * every order line. Optional: when null/empty the thumbnail degrades to an empty
     * framed surface (`CoverImage` owns that fallback).
     */
    courseCoverUrl?: string
    /** Lesson id the gate is being opened for. */
    lessonId: string
    /** Optional lesson title for context-aware copy. */
    lessonTitle?: string
    /** Slugs of packages that unlock this lesson (intersection with course packages). */
    packageSlugs: Array<string>
    /** Cheapest package metadata from the locked content/stream response. */
    cheapestPackage?: CheapestPackage | null
    /**
     * Which paywall entry triggered the modal. Retained for callers/telemetry; the legacy
     * checkout layout keeps a single "Thanh toán" title across all entries.
     */
    context: "document" | "video" | "challenge"
    /** Called after a successful purchase/free enrollment so the parent can revalidate lesson data. */
    onPurchased?: () => void
}

/**
 * Shared package gate modal used by both document teaser paywalls and video preview limits.
 *
 * Presents the legacy checkout layout — a "Thanh toán" header with a circular close, a
 * "Tóm tắt / Thanh toán" segmented control, an order-summary body, and a single big
 * "Tiếp tục thanh toán" CTA — for two variants:
 *  - no eligible packages → the course-level COURSE_UNLOCK product (whole course);
 *  - one or more eligible packages → a selectable order line per package.
 * The CTA drives the existing resolve → cart → (free checkout | PaymentModal) flow.
 */
export const PackageGateModal = ({
    isOpen,
    onClose,
    courseRawId,
    courseTitle,
    courseCoverUrl,
    packageSlugs,
    cheapestPackage,
    onPurchased,
}: PackageGateModalProps) => {
    const t = useTranslations("courseSystem.preview")
    // `isError` intentionally unused: a failed package fetch lands on the same whole-course
    // fallback as an empty list — better a working buy path than a dead-end error card.
    const { packages, isLoading } = useQueryCoursePackagesSwr(courseRawId, { enabled: isOpen })

    const filteredPackages = useMemo(() => {
        const slugSet = new Set(packageSlugs)
        // NO price filter: a package priced at 0 (with a slug other than the platform's
        // own "free" tier) is exactly what this viewer needs — dropping it pushed them to
        // the PAID whole-course offer instead.
        const eligible = packages.filter((pkg) => slugSet.has(pkg.slug) && pkg.slug !== "free")
        return [...eligible].sort((a, b) => Number(a.salePrice) - Number(b.salePrice))
    }, [packages, packageSlugs])

    const hasPackages = filteredPackages.length > 0

    // Default to the "Tóm tắt" (summary) tab every time the modal opens.
    const [tab, setTab] = useState<CheckoutTab>("summary")
    useEffect(() => {
        if (isOpen) setTab("summary")
    }, [isOpen])

    return (
        <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
            <Modal.Backdrop>
                <Modal.Container>
                    <Modal.Dialog className={cn("w-full max-w-lg")}>
                        {isLoading ? (
                            <CheckoutShell
                                t={t}
                                tab={tab}
                                onTabChange={setTab}
                                onClose={onClose}
                                ctaLabel={t("modal.resolving")}
                                onCta={() => undefined}
                                ctaDisabled
                                ctaPending={false}
                            >
                                <PackageGateSkeleton />
                            </CheckoutShell>
                        ) : hasPackages ? (
                            <PackagePanel
                                t={t}
                                tab={tab}
                                onTabChange={setTab}
                                onClose={onClose}
                                courseRawId={courseRawId}
                                courseTitle={courseTitle}
                                courseCoverUrl={courseCoverUrl}
                                packages={filteredPackages}
                                cheapestPackage={cheapestPackage}
                                onPurchased={onPurchased}
                            />
                        ) : (
                            // A LEGACY course has NO packages by design (the BE forbids them), so the
                            // package list is legitimately empty. Fall back to the course-level
                            // COURSE_UNLOCK product — the same checkout the detail page's "Đăng ký học" runs.
                            <WholeCoursePanel
                                t={t}
                                tab={tab}
                                onTabChange={setTab}
                                onClose={onClose}
                                courseRawId={courseRawId}
                                courseTitle={courseTitle}
                                courseCoverUrl={courseCoverUrl}
                                onPurchased={onPurchased}
                            />
                        )}
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}

type Tr = ReturnType<typeof useTranslations>

/**
 * The legacy checkout shell shared by both variants: header (bold "Thanh toán" title +
 * circular close), the "Tóm tắt / Thanh toán" segmented control, the tab body (order
 * summary vs. a "next step" note), and the single big rounded-full CTA in the footer.
 */
const CheckoutShell = ({
    t,
    tab,
    onTabChange,
    onClose,
    children,
    ctaLabel,
    onCta,
    ctaDisabled,
    ctaPending,
}: {
    t: Tr
    tab: CheckoutTab
    onTabChange: (tab: CheckoutTab) => void
    onClose: () => void
    children: ReactNode
    ctaLabel: string
    onCta: () => void
    ctaDisabled: boolean
    ctaPending: boolean
}) => (
    <>
        <Modal.Header className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
                <Typography type="h4" weight="bold">
                    {t("modal.paymentTitle")}
                </Typography>
                <Button
                    isIconOnly
                    variant="tertiary"
                    className="rounded-full"
                    aria-label={t("modal.close")}
                    onPress={onClose}
                >
                    <XIcon aria-hidden focusable="false" className="size-5" />
                </Button>
            </div>
            <SegmentedControl<CheckoutTab>
                ariaLabel={t("modal.paymentTitle")}
                items={[
                    { value: "summary", label: t("modal.tabSummary") },
                    { value: "payment", label: t("modal.tabPayment") },
                ]}
                value={tab}
                onChange={onTabChange}
            />
        </Modal.Header>
        <Modal.Body className="flex flex-col gap-3">
            {tab === "summary" ? (
                children
            ) : (
                <Typography type="body-sm" color="muted" className="py-2">
                    {t("modal.paymentNextHint")}
                </Typography>
            )}
        </Modal.Body>
        <Modal.Footer>
            <Button
                variant="primary"
                fullWidth
                className="rounded-full"
                isDisabled={ctaDisabled}
                isPending={ctaPending}
                onPress={onCta}
            >
                {ctaLabel}
                <ArrowRightIcon aria-hidden focusable="false" className="size-4" />
            </Button>
        </Modal.Footer>
    </>
)

/**
 * The single resolve → cart → (free checkout | PaymentModal) action, wrapped in the auth
 * guard. Both gate variants AND the detail-page whole-course card share this hook so the
 * checkout logic never drifts between copies.
 */
const useProductCheckout = ({
    product,
    title,
    imageUrl,
    onPurchased,
    onClose,
}: {
    product: ProductForCourseView | null | undefined
    title: string
    /** Course cover art → the rounded thumbnail on the PaymentModal summary (empty → omitted). */
    imageUrl?: string
    onPurchased?: () => void
    onClose?: () => void
}) => {
    const { guard } = useRequireAuth()
    const addCart = usePostAddCartItemSwr()
    const checkout = usePostCheckoutSwr()
    const payment = usePaymentOverlayState()
    const [isProcessing, setIsProcessing] = useState(false)

    const run = guard(async () => {
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
                    onClose?.()
                }
                return
            }
            payment.open({
                itemIds: [item.id],
                title,
                amountVnd: product.priceVnd ?? 0,
                amountCoin: product.priceCoin ?? undefined,
                // Course cover → the rounded thumbnail on the modal summary (empty → omit).
                imageUrl: imageUrl || undefined,
                onSuccess: onPurchased,
            })
            onClose?.()
        } catch {
            // SWR surfaces the error; keep the modal open so the user can retry.
        } finally {
            setIsProcessing(false)
        }
    }, "auth.context.enroll")

    const isBusy = isProcessing || addCart.isMutating || checkout.isMutating
    return { run, isBusy }
}

/** One order-summary line: rounded-square thumbnail + title (2-line clamp) + price + savings. */
const OrderSummaryLine = ({
    t,
    thumbUrl,
    title,
    discounted,
    original,
}: {
    t: Tr
    thumbUrl?: string | null
    title: string
    discounted: number
    original?: number | null
}) => {
    const tCart = useTranslations("cart")
    const saving = original != null && original > discounted ? original - discounted : 0
    return (
        <div className="flex items-start gap-3">
            <CoverImage src={thumbUrl} alt={title} className="size-14 shrink-0" />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Typography type="body" weight="semibold" className="line-clamp-2">
                    {title}
                </Typography>
                <PriceTag discounted={discounted} original={original ?? null} size="md" />
                {saving > 0 ? (
                    <Typography type="body-xs" color="muted">
                        {tCart("itemSaving", { amount: formatVnd(saving) })}
                    </Typography>
                ) : null}
            </div>
        </div>
    )
}

/** Whole-course (COURSE_UNLOCK) variant of the checkout shell. */
const WholeCoursePanel = ({
    t,
    tab,
    onTabChange,
    onClose,
    courseRawId,
    courseTitle,
    courseCoverUrl,
    onPurchased,
}: {
    t: Tr
    tab: CheckoutTab
    onTabChange: (tab: CheckoutTab) => void
    onClose: () => void
    courseRawId: string
    courseTitle: string
    courseCoverUrl?: string
    onPurchased?: () => void
}) => {
    const { data: product, isLoading } = useGetCourseProductSwr(courseRawId)
    const { run, isBusy } = useProductCheckout({ product, title: courseTitle, imageUrl: courseCoverUrl, onPurchased, onClose })

    const ctaLabel = isBusy
        ? t("modal.processing")
        : !product
            ? t("modal.resolving")
            : t("modal.continuePayment")

    return (
        <CheckoutShell
            t={t}
            tab={tab}
            onTabChange={onTabChange}
            onClose={onClose}
            ctaLabel={ctaLabel}
            onCta={run}
            ctaDisabled={!product || isBusy}
            ctaPending={isBusy}
        >
            {isLoading ? (
                <PackageGateSkeleton />
            ) : !product ? (
                // The course carries no COURSE_UNLOCK product (not on sale): degrade to the
                // "no offer" message instead of a CTA that cannot complete.
                <div className="flex flex-col items-center gap-2 py-4 text-center">
                    <Typography type="body" weight="semibold">
                        {t("modal.emptyTitle")}
                    </Typography>
                    <Typography type="body-sm" color="muted">
                        {t("modal.emptyHint")}
                    </Typography>
                </div>
            ) : (
                <OrderSummaryLine
                    t={t}
                    thumbUrl={courseCoverUrl}
                    title={courseTitle}
                    discounted={product.priceVnd ?? 0}
                />
            )}
        </CheckoutShell>
    )
}

/** Package variant: a selectable order line per eligible package + the shared checkout shell. */
const PackagePanel = ({
    t,
    tab,
    onTabChange,
    onClose,
    courseRawId,
    courseTitle,
    courseCoverUrl,
    packages,
    cheapestPackage,
    onPurchased,
}: {
    t: Tr
    tab: CheckoutTab
    onTabChange: (tab: CheckoutTab) => void
    onClose: () => void
    courseRawId: string
    courseTitle: string
    courseCoverUrl?: string
    packages: Array<PackageView>
    cheapestPackage?: CheapestPackage | null
    onPurchased?: () => void
}) => {
    // Default selection: the course's default package, else the cheapest (list is sorted).
    const [selectedId, setSelectedId] = useState<string>(
        () => packages.find((pkg) => pkg.defaultPackage)?.id ?? packages[0].id,
    )
    const selected = packages.find((pkg) => pkg.id === selectedId) ?? packages[0]
    // Resolve only the SELECTED package's product — the CTA acts on that one.
    const { data: product } = useGetCoursePackageProductSwr(courseRawId, selected.id)
    const { run, isBusy } = useProductCheckout({
        product,
        title: `${courseTitle} · ${selected.name}`,
        imageUrl: courseCoverUrl,
        onPurchased,
        onClose,
    })

    const ctaLabel = isBusy
        ? t("modal.processing")
        : !product
            ? t("modal.resolving")
            : t("modal.continuePayment")

    return (
        <CheckoutShell
            t={t}
            tab={tab}
            onTabChange={onTabChange}
            onClose={onClose}
            ctaLabel={ctaLabel}
            onCta={run}
            ctaDisabled={!product || isBusy}
            ctaPending={isBusy}
        >
            {cheapestPackage ? (
                <Typography type="body-sm" color="muted">
                    {t("modal.cheapestHint", { name: cheapestPackage.name })}
                </Typography>
            ) : null}
            <div className="flex flex-col gap-2">
                {packages.map((pkg) => (
                    <PackageGateCard
                        key={pkg.id}
                        t={t}
                        pkg={pkg}
                        thumbUrl={courseCoverUrl}
                        isSelected={pkg.id === selectedId}
                        onSelect={() => setSelectedId(pkg.id)}
                    />
                ))}
            </div>
        </CheckoutShell>
    )
}

/** One selectable package order line inside the gate modal. */
const PackageGateCard = ({
    t,
    pkg,
    thumbUrl,
    isSelected,
    onSelect,
}: {
    t: Tr
    pkg: PackageView
    thumbUrl?: string | null
    isSelected: boolean
    onSelect: () => void
}) => {
    const tCart = useTranslations("cart")
    const salePrice = Number(pkg.salePrice)
    const originalPrice = Number(pkg.originalPrice)
    const saving = originalPrice > salePrice ? originalPrice - salePrice : 0

    return (
        <button
            type="button"
            aria-pressed={isSelected}
            onClick={onSelect}
            className={cn(
                "flex items-start gap-3 rounded-2xl border p-3 text-left transition-colors",
                isSelected
                    ? "border-accent bg-accent/5"
                    : "border-default bg-surface hover:border-accent/50",
            )}
        >
            <CoverImage src={thumbUrl} alt={pkg.name} className="size-14 shrink-0" />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-center gap-2">
                    <Typography type="body" weight="semibold" className="line-clamp-2">
                        {pkg.name}
                    </Typography>
                    {pkg.defaultPackage ? (
                        <Chip size="sm" variant="soft" color="accent">
                            <Chip.Label>{t("modal.recommended")}</Chip.Label>
                        </Chip>
                    ) : null}
                </div>
                <PriceTag
                    discounted={salePrice}
                    original={originalPrice > salePrice ? originalPrice : null}
                    size="md"
                />
                {saving > 0 ? (
                    <Typography type="body-xs" color="muted">
                        {tCart("itemSaving", { amount: formatVnd(saving) })}
                    </Typography>
                ) : null}
            </div>
            {isSelected ? (
                <CheckCircleIcon
                    weight="fill"
                    aria-hidden
                    focusable="false"
                    className="mt-1 size-5 shrink-0 text-accent"
                />
            ) : null}
        </button>
    )
}

/** Props for {@link WholeCourseGateCard}. */
export interface WholeCourseGateCardProps {
    /** Course UUID (`course.rawId`) used to resolve the COURSE_UNLOCK product. */
    courseRawId: string
    /** Human course title shown on the PaymentModal summary line. */
    courseTitle: string
    /**
     * Course cover art (`course.coverUrl`) → the rounded thumbnail on the PaymentModal
     * summary. Optional; an empty string is treated as absent.
     */
    courseCoverUrl?: string
    /** Called after a successful purchase / free enrollment (revalidate the caller). */
    onPurchased?: () => void
    /**
     * Dismiss the surface hosting this card once checkout is under way. Optional: the
     * course detail page embeds the card in a sticky panel that has nothing to close.
     */
    onClose?: () => void
}

/**
 * Fallback offer when the course sells no packages (every LEGACY course, and any PACKAGE
 * course whose package list is still empty): buy the whole course through its
 * COURSE_UNLOCK product — the same resolve → cart → PaymentModal path the detail page's
 * enroll CTA uses. When the course carries no product either (not on sale), it degrades
 * to the original "no matching packages" message instead of a CTA that cannot complete.
 *
 * Exported and REUSED by the course detail page's package card as a self-contained card
 * (its own "Đăng ký học" CTA). The gate modal itself renders the whole-course offer via
 * the legacy checkout shell ({@link WholeCoursePanel}); both share {@link useProductCheckout}.
 */
export const WholeCourseGateCard = ({
    courseRawId,
    courseTitle,
    courseCoverUrl,
    onPurchased,
    onClose,
}: WholeCourseGateCardProps) => {
    const t = useTranslations("courseSystem.preview")
    const tCourse = useTranslations("courseSystem")
    const { data: product, isLoading } = useGetCourseProductSwr(courseRawId)
    const { run, isBusy } = useProductCheckout({ product, title: courseTitle, imageUrl: courseCoverUrl, onPurchased, onClose })

    if (isLoading) {
        return <PackageGateSkeleton />
    }

    if (!product) {
        return (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
                <Typography type="body" weight="semibold">
                    {t("modal.emptyTitle")}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {t("modal.emptyHint")}
                </Typography>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-2 rounded-2xl border border-default bg-surface p-3">
            <div className="flex items-center justify-between gap-3">
                <Typography type="body" weight="semibold">
                    {tCourse("detail.wholeCourse")}
                </Typography>
                {/* House price block (COURSE_UNLOCK exposes only a charged price → no
                    struck original / chip here). */}
                <PriceTag discounted={product.priceVnd ?? 0} size="sm" className="shrink-0" />
            </div>
            <Button
                variant="primary"
                className="self-stretch"
                isDisabled={isBusy}
                isPending={isBusy}
                onPress={run}
            >
                {isBusy ? t("modal.processing") : tCourse("detail.enroll")}
            </Button>
        </div>
    )
}

/** Skeleton while packages / products are loading. */
const PackageGateSkeleton = () => (
    <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-1/2 rounded-md" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
    </div>
)
