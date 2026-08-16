"use client"

import React, { useState } from "react"
import { Button, Chip, Skeleton, Typography } from "@heroui/react"
import { useFormatter, useTranslations } from "next-intl"
import { CheckCircleIcon, SealCheckIcon } from "@phosphor-icons/react"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { SectionCard } from "@/components/reuseable/SectionCard"
import { formatVnd } from "@/components/blocks/commerce/PriceTag"
import { useQueryMyMembershipSwr } from "@/hooks/swr/api/graphql/queries/useQueryMyMembershipSwr"
import { useMutatePurchaseMembershipSwr } from "@/hooks/swr/api/graphql/mutations/useMutatePurchaseMembershipSwr"
import { PLAN_PAY_METHOD } from "@/modules/api/graphql/mutations/types/purchase-checkout"
import { usePlanPurchase } from "../usePlanPurchase"
import { PlanPurchaseModal } from "../PlanPurchaseModal"

/** The perks listed on the card, in render order (`membership.perks.<key>`). */
const PERKS = ["blog", "community", "discount", "recruitment"] as const

/**
 * MembershipSection — the "Membership" half of the dashboard "My Plan" tab: whether the
 * viewer holds the community membership, what the plan on sale costs, and the action
 * that buys it.
 *
 * **Everything on the money line comes from `myMembership`.** The plan's name, price and
 * period are the published `commerce.products` row; the viewer's own state is the plan
 * the backend says is in effect. Nothing here is hard-coded, because a card that quotes
 * one price while the order charges another is the worst bug this screen can have — and
 * the previous version of this file did exactly that (a literal "$5" in the message
 * bundle, with no read at all behind it).
 *
 * The honest empty state matters as much: when operations has published no membership
 * product, `offer` is null and the section says so instead of offering a button that
 * can only fail. Same when the product carries no VND price — the buy action is
 * disabled rather than opening a checkout for an unknown amount.
 *
 * Buying reuses the platform checkout ({@link usePlanPurchase}): confirm → order →
 * VietQR → poll until the bank settles it. There is no redirect gateway on this
 * backend, so the buyer never leaves the dialog.
 */
export const MembershipSection = () => {
    const t = useTranslations()
    const format = useFormatter()
    const membershipSwr = useQueryMyMembershipSwr()
    const { trigger } = useMutatePurchaseMembershipSwr()

    const [isModalOpen, setIsModalOpen] = useState(false)

    const membership = membershipSwr.data ?? null
    const offer = membership?.offer ?? null
    const priceVnd = offer?.priceVnd ?? null

    const purchase = usePlanPurchase({
        start: async () => {
            const result = await trigger({ paymentType: PLAN_PAY_METHOD })
            return result?.data?.purchaseMembership
        },
        // paid → the viewer's plan/expiry has changed; re-read rather than assume it
        onPaid: () => { void membershipSwr.mutate() },
        failureMessage: t("profileSettings.purchase.failed"),
    })

    const closeModal = () => {
        setIsModalOpen(false)
        // A settled order has nothing left to watch; an order still awaiting payment is
        // kept alive on purpose, so closing the dialog does not abandon a live QR — the
        // poll keeps running and the card flips to "member" when the money lands.
        if (purchase.phase !== "awaiting") purchase.reset()
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

            <AsyncContent
                isLoading={membershipSwr.isLoading && !membershipSwr.data}
                skeleton={<Skeleton className="h-64 w-full rounded-3xl" />}
                error={!membershipSwr.data ? membershipSwr.error : undefined}
                errorContent={{
                    title: t("membership.error"),
                    onRetry: () => { void membershipSwr.mutate() },
                    retryLabel: t("membership.retry"),
                }}
                isEmpty={offer === null}
                emptyContent={{
                    title: t("membership.empty"),
                    description: membership?.active
                        ? t("membership.emptyActiveHint")
                        : undefined,
                    onRetry: () => { void membershipSwr.mutate() },
                    retryLabel: t("membership.retry"),
                }}
            >
                {offer ? (
                    <SectionCard
                        accent
                        title={offer.displayName}
                        icon={<SealCheckIcon className="size-5 text-accent" aria-hidden focusable="false" />}
                        action={membership?.active ? (
                            <Chip size="sm" variant="soft" color="accent">
                                {t("membership.active")}
                            </Chip>
                        ) : undefined}
                    >
                        <div className="flex flex-col gap-4">
                            <Typography type="body-sm" color="muted">
                                {offer.description || t("membership.card.desc")}
                            </Typography>

                            {membership?.active && membership.expiresAt ? (
                                <Typography type="body-sm" weight="semibold" className="text-accent">
                                    {t("membership.activeUntil", {
                                        date: format.dateTime(new Date(membership.expiresAt), {
                                            dateStyle: "medium",
                                        }),
                                    })}
                                </Typography>
                            ) : null}

                            <div className="flex items-baseline gap-1">
                                <Typography type="h4" weight="bold">
                                    {priceVnd === null
                                        ? t("membership.priceUnavailable")
                                        : formatVnd(priceVnd)}
                                </Typography>
                                {priceVnd !== null && offer.durationDays > 0 ? (
                                    <Typography type="body-sm" color="muted">
                                        {t("membership.priceHint", { days: offer.durationDays })}
                                    </Typography>
                                ) : null}
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
                                // no VND price on the product → there is no amount to charge;
                                // opening a checkout here would create an order nobody can pay
                                isDisabled={priceVnd === null || purchase.isStarting}
                                onPress={() => setIsModalOpen(true)}
                            >
                                {t(membership?.active ? "membership.renew" : "membership.cta")}
                            </Button>
                        </div>
                    </SectionCard>
                ) : null}
            </AsyncContent>

            <PlanPurchaseModal
                isOpen={isModalOpen}
                onClose={closeModal}
                planLabel={offer?.displayName ?? ""}
                amountLabel={priceVnd === null ? t("membership.priceUnavailable") : formatVnd(priceVnd)}
                amountHint={offer && offer.durationDays > 0
                    ? t("membership.durationHint", { days: offer.durationDays })
                    : null}
                isStarting={purchase.isStarting}
                errorMessage={purchase.errorMessage}
                ticket={purchase.ticket}
                phase={purchase.phase}
                onConfirm={() => { void purchase.confirm() }}
                onRetry={purchase.reset}
            />
        </section>
    )
}
