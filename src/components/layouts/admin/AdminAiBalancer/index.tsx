"use client"

import React, {
    useCallback,
    useEffect,
    useMemo,
} from "react"
import {
    Button,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import {
    useRouter,
} from "next/navigation"
import {
    TopBar,
} from "./TopBar"
import {
    ProviderSection,
} from "./ProviderSection"
import {
    AdminAiBalancerSkeleton,
} from "./AdminAiBalancerSkeleton"
import { useQueryAiBalancerHealthSwr } from "@/hooks/swr/api/graphql/queries/useQueryAiBalancerHealthSwr"
import { useAppSelector } from "@/redux/hooks"

/**
 * Admin dashboard for live AI balancer API key health (Redis ping cache + pool).
 *
 * Requires admin API key in Redux (same gate as other admin tools) and an
 * authenticated session for the GraphQL query. Polls every 10s.
 */
export const AdminAiBalancer = () => {
    const apiKey = useAppSelector((state) => state.admin.apiKey)
    const router = useRouter()
    const t = useTranslations("admin.aiBalancer")
    const {
        data,
        error,
        isLoading,
        isValidating,
        mutate,
    } = useQueryAiBalancerHealthSwr()

    useEffect(() => {
        if (!apiKey) {
            router.replace("../../admin")
        }
    }, [
        apiKey,
        router,
    ])

    const sortedProviders = useMemo(
        () => [
            ...(data?.providers ?? []),
        ].sort((left, right) => left.provider.localeCompare(right.provider)),
        [
            data?.providers,
        ],
    )

    const onRefresh = useCallback(
        () => {
            void mutate()
        },
        [
            mutate,
        ],
    )

    const ready = !isLoading && !!data && !error

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-4 pb-12">
            <div className="mx-auto flex max-w-5xl flex-col gap-6">
                <TopBar />
                <div className="space-y-1.5">
                    <h1 className="text-2xl font-bold text-white">
                        {t("title")}
                    </h1>
                    <p className="text-sm text-slate-400">
                        {t("subtitle")}
                    </p>
                    {isValidating ? (
                        <p className="text-xs text-indigo-300">
                            {t("refreshing")}
                        </p>
                    ) : null}
                </div>
                {!ready ? (
                    <AdminAiBalancerSkeleton />
                ) : (
                    <div className="flex flex-col gap-6">
                        {sortedProviders.map((providerHealth) => (
                            <ProviderSection
                                key={providerHealth.provider}
                                providerHealth={providerHealth}
                            />
                        ))}
                        {sortedProviders.length === 0 ? (
                            <p className="text-center text-sm text-slate-400">
                                {t("empty")}
                            </p>
                        ) : null}
                    </div>
                )}
                {error ? (
                    <p className="text-center text-sm text-rose-300">
                        {t("error")}
                    </p>
                ) : null}
                <Button
                    variant="ghost"
                    size="sm"
                    className="mx-auto text-indigo-300"
                    onPress={onRefresh}
                >
                    {t("refreshNow")}
                </Button>
            </div>
        </div>
    )
}
