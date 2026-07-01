"use client"

import React, {
    useCallback,
    useMemo,
} from "react"
import {
    Button,
    Card,
    Typography,
} from "@heroui/react"
import {
    CheckCircleIcon,
} from "@phosphor-icons/react"
import {
    useTranslations,
} from "next-intl"
import {
    SettingsBreadcrumb,
} from "../Settings/SettingsBreadcrumb"
import { usePaymentOverlayState } from "@/hooks/zustand/overlay/hooks"
import { PaymentFlow } from "@/modules/types/payment"
import { PageHeader } from "@/components/blocks/layout/PageHeader"

/**
 * Community membership feature container.
 *
 * A single-product purchase surface ($5/month equivalent): premium tech blog,
 * private community, course discount, recruitment exposure. Opening the shared
 * payment overlay with {@link PaymentFlow.Membership} lets the user pick a
 * gateway, which then runs `purchaseMembership` + redirects to checkout.
 * Mounted by the `/profile/membership` route. `"use client"` because it reads
 * the payment overlay singleton and routes.
 */
export const Membership = () => {
    const t = useTranslations()
    // shared payment modal — opening it with the membership flow runs the purchase
    const { open: openPaymentModal } = usePaymentOverlayState()


    /** Perk rows shown under the price — each is a translated benefit line. */
    const perks = useMemo(
        () => [
            t("membership.perks.blog"),
            t("membership.perks.community"),
            t("membership.perks.discount"),
            t("membership.perks.recruitment"),
        ],
        [
            t,
        ],
    )

    /** Open the shared payment modal for the membership flow. */
    const onSubscribe = useCallback(
        () => {
            // hand the membership flow to the modal — it creates the checkout
            // with whichever payment method the user picks, then redirects
            openPaymentModal({
                flow: PaymentFlow.Membership,
            })
        },
        [
            openPaymentModal,
        ],
    )

    return (
        <div className="mx-auto flex max-w-2xl flex-col gap-10 p-6">
            <PageHeader
                breadcrumb={<SettingsBreadcrumb current={t("membership.title")} />}
                title={t("membership.title")}
                description={t("membership.subtitle")}
            />
            <Card className="flex flex-col">
                <Card.Content className="flex flex-col gap-6">
                    {/* product name + tagline — tight pair */}
                    <div className="flex flex-col gap-2">
                        <Typography type="h5" weight="semibold">
                            {t("membership.card.title")}
                        </Typography>
                        <Typography type="body-sm" color="muted">
                            {t("membership.card.desc")}
                        </Typography>
                    </div>
                    {/* price block — VND monthly price + hint, with the USD approx below */}
                    <div className="flex flex-col gap-0">
                        <div className="flex items-end gap-2">
                            <Typography type="h3" weight="bold">
                                {t("membership.price")}
                            </Typography>
                            <Typography type="body-sm" color="muted" className="pb-1">
                                {t("membership.priceHint")}
                            </Typography>
                        </div>
                        <Typography type="body-xs" color="muted">
                            {t("membership.priceApprox")}
                        </Typography>
                    </div>
                    {/* perks list — one check row per benefit */}
                    <div className="flex flex-col gap-3">
                        {perks.map((perk) => (
                            <div
                                key={perk}
                                className="flex items-start gap-2"
                            >
                                <CheckCircleIcon aria-hidden className="size-5 shrink-0 text-success" />
                                <Typography type="body-sm">{perk}</Typography>
                            </div>
                        ))}
                    </div>
                    <Button
                        variant="primary"
                        fullWidth
                        onPress={onSubscribe}
                    >
                        {t("membership.cta")}
                    </Button>
                </Card.Content>
            </Card>
        </div>
    )
}
