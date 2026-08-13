"use client"

import React, { useMemo } from "react"
import { Typography } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { ClockCounterClockwiseIcon, SignInIcon } from "@phosphor-icons/react"
import { SectionCard } from "@/components/reuseable/SectionCard"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { ListRow } from "@/components/blocks/lists/ListRow"
import { StatusChip } from "@/components/blocks/chips/StatusChip"
import { useGetMyLoginHistorySwr } from "@/hooks/swr/api/rest/queries/useGetMyLoginHistorySwr"
import { joinSessionMeta } from "../utils/sessions"
import { LoginHistorySectionSkeleton } from "./skeleton"

/** How many recent attempts to show — enough to spot a stranger, short enough to scan. */
const HISTORY_PAGE_SIZE = 10

/**
 * LoginHistorySection — the recent sign-in attempts on the account
 * (`GET /identity/login-history`), successful AND failed, so a learner can notice
 * access they do not recognise.
 *
 * The backend `result` is a free-form string; anything that is not an explicit success
 * is rendered as a failure rather than guessed at, because a mislabelled FAILED row is
 * the one mistake that matters here.
 */
export const LoginHistorySection = () => {
    const t = useTranslations()
    const locale = useLocale()
    const swr = useGetMyLoginHistorySwr({ page: 0, size: HISTORY_PAGE_SIZE })

    const items = useMemo(() => swr.data?.items ?? [], [swr.data])

    /** Locale-aware absolute timestamp for each attempt. */
    const dateTimeFormat = useMemo(
        () => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }),
        [locale],
    )

    return (
        <SectionCard
            title={t("security.loginHistory.title")}
            icon={
                <ClockCounterClockwiseIcon
                    className="size-5 text-muted"
                    aria-hidden
                    focusable="false"
                />
            }
        >
            <Typography type="body-sm" color="muted">
                {t("security.loginHistory.subtitle")}
            </Typography>

            <AsyncContent
                isLoading={!swr.data && !swr.error}
                skeleton={<LoginHistorySectionSkeleton />}
                isEmpty={items.length === 0}
                emptyContent={{ title: t("security.loginHistory.empty") }}
                error={!swr.data ? swr.error : undefined}
                errorContent={{
                    title: t("security.loginHistory.loadError"),
                    onRetry: () => {
                        void swr.mutate()
                    },
                    retryLabel: t("security.retry"),
                }}
            >
                <div className="flex flex-col gap-0">
                    {items.map((item) => {
                        const isSuccess = item.result?.toUpperCase() === "SUCCESS"
                        return (
                            <ListRow
                                key={item.id}
                                leading={
                                    <SignInIcon
                                        className="size-5 text-muted"
                                        aria-hidden
                                        focusable="false"
                                    />
                                }
                                title={dateTimeFormat.format(new Date(item.occurredAt))}
                                subtitle={joinSessionMeta([item.ip, item.method])}
                                meta={
                                    <StatusChip tone={isSuccess ? "success" : "danger"}>
                                        {isSuccess
                                            ? t("security.loginHistory.success")
                                            : t("security.loginHistory.failure")}
                                    </StatusChip>
                                }
                            />
                        )
                    })}
                </div>
            </AsyncContent>
        </SectionCard>
    )
}
