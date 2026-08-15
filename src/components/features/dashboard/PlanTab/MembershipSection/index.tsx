"use client"

import React, { useState } from "react"
import { Button, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { CheckCircleIcon, SealCheckIcon } from "@phosphor-icons/react"
import { SectionCard } from "@/components/reuseable/SectionCard"
import { useMutatePurchaseMembershipSwr } from "@/hooks/swr/api/graphql/mutations/useMutatePurchaseMembershipSwr"
import { submitCheckout } from "@/modules/payment/submit-checkout"
import { PaymentType } from "@/modules/types/enums/payment-type"
import { PurchaseConfirmModal } from "../PurchaseConfirmModal"

/** The perks listed on the card, in render order (`membership.perks.<key>`). */
const PERKS = ["blog", "community", "discount", "recruitment"] as const

/**
 * Gateways `purchaseMembership` accepts — domestic first, then the international
 * ones (its request type documents all five).
 */
const MEMBERSHIP_METHODS = [
    PaymentType.PayOS,
    PaymentType.Sepay,
    PaymentType.Stripe,
    PaymentType.Paypal,
    PaymentType.Crypto,
] as const

/**
 * MembershipSection — the "Membership" half of the dashboard "My Plan" tab: what
 * the community membership includes, its price, and the action that starts
 * checkout.
 *
 * DELIBERATELY STATELESS about the viewer. The repo exposes exactly one
 * membership endpoint, the `purchaseMembership` mutation — there is no query that
 * reports whether the viewer already holds a membership or when it lapses. Rather
 * than infer a status from something that does not mean it, this screen shows the
 * offer and the buy action only; "you are already a member" copy would be
 * invented, and inventing it is worse than omitting it.
 *
 * Because there is no read, there is no SWR loading / error branch here: the only
 * failure this screen can have is the checkout call, which reports inside
 * {@link PurchaseConfirmModal}.
 */
export const MembershipSection = () => {
    const t = useTranslations()
    const { trigger, isMutating } = useMutatePurchaseMembershipSwr()

    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    const [checkoutError, setCheckoutError] = useState<string | null>(null)

    /** Start membership checkout and hand the user to the gateway. */
    const onConfirm = async (method: PaymentType) => {
        setCheckoutError(null)
        try {
            const result = await trigger({
                paymentType: method,
                // the gateway returns the user to this very screen either way
                payosReturnUrl: window.location.href,
                payosCancelUrl: window.location.href,
            })
            const envelope = result?.data?.purchaseMembership
            if (!envelope?.success || !envelope.data?.checkoutUrl) {
                setCheckoutError(envelope?.message || t("profileSettings.purchase.failed"))
                return
            }
            submitCheckout({
                checkoutUrl: envelope.data.checkoutUrl,
                checkoutFields: envelope.data.checkoutFields,
            })
        } catch {
            setCheckoutError(t("profileSettings.purchase.failed"))
        }
    }

    return (
        <section className="flex flex-col gap-6">
            <div className="flex flex-col gap-0">
                <Typography type="h6" weight="bold">
                    {t("membership.title")}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {t("membership.subtitle")}
                </Typography>
            </div>

            <SectionCard
                accent
                title={t("membership.card.title")}
                icon={<SealCheckIcon className="size-5 text-accent" aria-hidden focusable="false" />}
            >
                <div className="flex flex-col gap-4">
                    <Typography type="body-sm" color="muted">
                        {t("membership.card.desc")}
                    </Typography>

                    <div className="flex items-baseline gap-1">
                        <Typography type="h4" weight="bold">
                            {t("membership.price")}
                        </Typography>
                        <Typography type="body-sm" color="muted">
                            {t("membership.priceHint")}
                        </Typography>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Typography type="body-sm" weight="semibold">
                            {t("membership.perksTitle")}
                        </Typography>
                        <ul className="flex flex-col gap-1">
                            {PERKS.map((perk) => (
                                <li key={perk} className="flex items-start gap-2 text-sm text-muted">
                                    <CheckCircleIcon
                                        className="mt-0.5 size-4 shrink-0 text-success"
                                        aria-hidden
                                        focusable="false"
                                    />
                                    {t(`membership.perks.${perk}`)}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <Button
                        variant="primary"
                        size="sm"
                        className="self-start"
                        isDisabled={isMutating}
                        onPress={() => {
                            setCheckoutError(null)
                            setIsConfirmOpen(true)
                        }}
                    >
                        {t("membership.cta")}
                    </Button>
                </div>
            </SectionCard>

            <PurchaseConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => {
                    setIsConfirmOpen(false)
                    setCheckoutError(null)
                }}
                planLabel={t("membership.card.title")}
                amountLabel={t("membership.price")}
                amountHint={t("membership.priceApprox")}
                methods={[...MEMBERSHIP_METHODS]}
                isPending={isMutating}
                errorMessage={checkoutError}
                onConfirm={(method) => { void onConfirm(method) }}
            />
        </section>
    )
}
