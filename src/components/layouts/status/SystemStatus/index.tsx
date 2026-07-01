"use client"

import React, { useCallback, useMemo } from "react"
import { Button } from "@heroui/react"
import { useTranslations } from "next-intl"
import { ArrowsClockwiseIcon } from "@phosphor-icons/react"
import { PageHeader } from "@/components/blocks/layout/PageHeader"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { OverallBanner } from "./OverallBanner"
import { ComponentCard } from "./ComponentCard"
import { AiKeyGroup } from "./AiKeyGroup"
import { SystemStatusSkeleton } from "./SystemStatusSkeleton"
import { useQuerySystemHealthStatusSwr } from "@/hooks/swr/api/graphql/queries/useQuerySystemHealthStatusSwr"
import { useQueryAiKeyHealthSwr } from "@/hooks/swr/api/graphql/queries/useQueryAiKeyHealthSwr"
import { ComponentStatus } from "@/modules/api/graphql/queries/enums"

/**
 * Public "build in public" system status page (`/status`) — no auth, no admin
 * key. Polls two public GraphQL queries every ~10s:
 *
 *   - `systemHealthStatus` → a traffic-light card per infrastructure component.
 *   - `aiKeyHealth` → masked AI key chips grouped per model.
 *
 * An overall banner ("N/M thành phần khỏe", green/red) sits on top.
 */
export const SystemStatus = () => {
    const t = useTranslations("status")

    const {
        data: healthData,
        error: healthError,
        isValidating: healthValidating,
        mutate: mutateHealth,
    } = useQuerySystemHealthStatusSwr()
    const {
        data: keyData,
        error: keyError,
        isValidating: keyValidating,
        mutate: mutateKeys,
    } = useQueryAiKeyHealthSwr()

    const components = useMemo(
        () => healthData?.components ?? [],
        [healthData?.components],
    )
    const groups = useMemo(() => keyData?.groups ?? [], [keyData?.groups])

    const upCount = useMemo(
        () => components.filter((component) => component.status === ComponentStatus.Up).length,
        [components],
    )
    const allUp = components.length > 0 && upCount === components.length

    const isValidating = healthValidating || keyValidating

    const onRefresh = useCallback(() => {
        void mutateHealth()
        void mutateKeys()
    }, [mutateHealth, mutateKeys])

    return (
        <div className="mx-auto flex max-w-5xl flex-col gap-10 p-6">
            <PageHeader
                title={t("title")}
                description={t("subtitle")}
                actions={
                    <Button
                        variant="secondary"
                        size="sm"
                        onPress={onRefresh}
                        isPending={isValidating}
                    >
                        <ArrowsClockwiseIcon aria-hidden focusable="false" className="size-4" />
                        {t("refresh")}
                    </Button>
                }
            />

            <div className="flex flex-col gap-6">
                {/* Overall infrastructure banner */}
                <AsyncContent
                    isLoading={!healthData && !healthError}
                    skeleton={<SystemStatusSkeleton />}
                    error={!healthData ? healthError : undefined}
                    errorContent={{
                        title: t("error.title"),
                        description: t("error.description"),
                        onRetry: () => {
                            void mutateHealth()
                        },
                        retryLabel: t("error.retry"),
                    }}
                    isEmpty={components.length === 0}
                    emptyContent={{
                        title: t("empty.infraTitle"),
                        description: t("empty.infraDescription"),
                    }}
                >
                    <div className="flex flex-col gap-6">
                        <OverallBanner
                            allUp={allUp}
                            label={t("overall", {
                                up: upCount,
                                total: components.length,
                            })}
                        />

                        {/* Infrastructure grid */}
                        <section className="flex flex-col gap-3">
                            <h2 className="text-sm font-medium text-muted">
                                {t("infraHeading")}
                            </h2>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {components.map((component) => (
                                    <ComponentCard
                                        key={component.name}
                                        component={component}
                                    />
                                ))}
                            </div>
                        </section>
                    </div>
                </AsyncContent>

                {/* AI keys section */}
                <section className="flex flex-col gap-3">
                    <h2 className="text-sm font-medium text-muted">
                        {t("aiKeysHeading")}
                    </h2>
                    <AsyncContent
                        isLoading={!keyData && !keyError}
                        skeleton={<SystemStatusSkeleton aiOnly />}
                        error={!keyData ? keyError : undefined}
                        errorContent={{
                            title: t("error.title"),
                            description: t("error.description"),
                            onRetry: () => {
                                void mutateKeys()
                            },
                            retryLabel: t("error.retry"),
                        }}
                        isEmpty={groups.length === 0}
                        emptyContent={{
                            title: t("empty.aiTitle"),
                            description: t("empty.aiDescription"),
                        }}
                    >
                        <div className="flex flex-col gap-3">
                            {groups.map((group, index) => (
                                <AiKeyGroup
                                    key={`${group.provider}-${index}`}
                                    group={group}
                                />
                            ))}
                        </div>
                    </AsyncContent>
                </section>
            </div>
        </div>
    )
}
