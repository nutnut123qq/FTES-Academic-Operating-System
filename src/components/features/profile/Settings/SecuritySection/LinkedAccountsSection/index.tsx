"use client"

import React, { useMemo, useState } from "react"
import { Button } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { PlugsConnectedIcon } from "@phosphor-icons/react"
import { useSWRConfig } from "swr"
import type { LinkedAccount, LinkedAccountProvider } from "@/modules/api/rest/identity"
import { SectionCard } from "@/components/reuseable/SectionCard"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { ListRow } from "@/components/blocks/lists/ListRow"
import { ConfirmDialog } from "@/components/blocks/feedback/ConfirmDialog"
import { GoogleIcon, GithubIcon } from "@/components/svg"
import { publicEnv } from "@/resources/env/public"
import { beginGithubOAuth } from "@/modules/githubIdentity"
import { useRestWithToast } from "@/modules/toast/hooks"
import {
    useGetLinkedAccountsSwr,
    LINKED_ACCOUNTS_SWR_KEY,
} from "@/hooks/swr/api/rest/queries/useGetLinkedAccountsSwr"
import { usePostUnlinkAccountSwr } from "@/hooks/swr/api/rest/mutations/usePostUnlinkAccountSwr"
import { LinkedAccountsSectionSkeleton } from "./skeleton"

/** Backend error code returned when removing the only login method of a passwordless user. */
const CANNOT_UNLINK_LAST_LOGIN = "IDENTITY_CANNOT_UNLINK_LAST_LOGIN"

/** Brand display name + icon per provider (brand names are not localized). */
const PROVIDER_META: Record<
    LinkedAccountProvider,
    { label: string; Icon: React.ComponentType<{ className?: string }> }
> = {
    GOOGLE: { label: "Google", Icon: GoogleIcon },
    GITHUB: { label: "GitHub", Icon: GithubIcon },
}

/**
 * LinkedAccountsSection — the federated logins connected to the account
 * (`GET /identity/linked-accounts`): provider, provider email, and linked date, with a
 * per-row **Unlink** (confirmed) and a **Connect GitHub** shortcut when GitHub is not yet
 * linked (redirect flow, `state=link`).
 *
 * Kept separate from the profile display `SocialLinkEntity` (GitHub/LinkedIn URLs): those
 * are public profile links, these are login methods. The backend guards the last-login
 * case (409 `IDENTITY_CANNOT_UNLINK_LAST_LOGIN`); the confirm handler translates that code
 * into a clear message rather than leaking the raw error.
 */
export const LinkedAccountsSection = () => {
    const t = useTranslations()
    const locale = useLocale()
    const swr = useGetLinkedAccountsSwr()
    const { mutate } = useSWRConfig()
    const runRest = useRestWithToast()
    const { trigger, isMutating } = usePostUnlinkAccountSwr()

    const githubClientId = publicEnv().github.clientId

    // Which provider the confirm dialog is asking to unlink (null = closed).
    const [pendingProvider, setPendingProvider] = useState<LinkedAccountProvider | null>(null)

    const accounts = swr.data ?? []
    const isGithubLinked = accounts.some((account) => account.provider === "GITHUB")

    /** Locale-aware date for the "linked on …" line. */
    const dateFormat = useMemo(
        () => new Intl.DateTimeFormat(locale, { dateStyle: "medium" }),
        [locale],
    )

    const subtitleFor = (account: LinkedAccount): string => {
        const parts = [account.emailAtProvider]
        if (account.linkedAt) {
            parts.push(t("security.linkedAccounts.linkedAt", {
                at: dateFormat.format(new Date(account.linkedAt)),
            }))
        }
        return parts.filter(Boolean).join(" · ")
    }

    const onConfirmUnlink = async () => {
        const provider = pendingProvider
        if (!provider || isMutating) {
            return
        }
        // Run through `runRest` for BOTH toasts, but translate the last-login code into a
        // clear FE message BEFORE it reaches the error toast (re-throw a localized Error).
        const result = await runRest(
            async () => {
                try {
                    await trigger(provider)
                } catch (error) {
                    const code = (error as { errorCode?: string })?.errorCode
                    if (code === CANNOT_UNLINK_LAST_LOGIN) {
                        throw new Error(t("security.linkedAccounts.lastLoginError"))
                    }
                    throw error
                }
                return true
            },
            { successMessage: t("security.linkedAccounts.unlinkedToast") },
        )
        setPendingProvider(null)
        if (result !== null) {
            await mutate(LINKED_ACCOUNTS_SWR_KEY)
        }
    }

    const renderAccount = (account: LinkedAccount) => {
        const meta = PROVIDER_META[account.provider]
        const Icon = meta?.Icon
        return (
            <ListRow
                key={account.provider}
                leading={Icon ? <Icon className="size-5" /> : undefined}
                title={meta?.label ?? account.provider}
                subtitle={subtitleFor(account)}
                trailing={
                    <Button
                        size="sm"
                        variant="tertiary"
                        onPress={() => setPendingProvider(account.provider)}
                    >
                        {t("security.linkedAccounts.unlink")}
                    </Button>
                }
            />
        )
    }

    return (
        <>
            <SectionCard
                title={t("security.linkedAccounts.title")}
                icon={
                    <PlugsConnectedIcon
                        className="size-5 text-muted"
                        aria-hidden
                        focusable="false"
                    />
                }
                action={
                    githubClientId && !isGithubLinked ? (
                        <Button
                            size="sm"
                            variant="secondary"
                            onPress={() => beginGithubOAuth(githubClientId, "link")}
                        >
                            {t("security.linkedAccounts.connectGithub")}
                        </Button>
                    ) : undefined
                }
            >
                <AsyncContent
                    isLoading={!swr.data && !swr.error}
                    skeleton={<LinkedAccountsSectionSkeleton />}
                    isEmpty={accounts.length === 0}
                    emptyContent={{ title: t("security.linkedAccounts.emptyTitle") }}
                    error={!swr.data ? swr.error : undefined}
                    errorContent={{
                        title: t("security.linkedAccounts.loadError"),
                        onRetry: () => {
                            void swr.mutate()
                        },
                        retryLabel: t("security.retry"),
                    }}
                >
                    <div className="flex flex-col gap-0">
                        {accounts.map((account) => renderAccount(account))}
                    </div>
                </AsyncContent>
            </SectionCard>

            <ConfirmDialog
                isOpen={pendingProvider !== null}
                onClose={() => {
                    if (!isMutating) {
                        setPendingProvider(null)
                    }
                }}
                onConfirm={() => void onConfirmUnlink()}
                title={t("security.linkedAccounts.unlinkConfirmTitle")}
                description={
                    pendingProvider
                        ? t("security.linkedAccounts.unlinkConfirmDescription", {
                            provider: PROVIDER_META[pendingProvider]?.label ?? pendingProvider,
                        })
                        : undefined
                }
                confirmLabel={t("security.linkedAccounts.unlink")}
                cancelLabel={t("common.cancel")}
                isPending={isMutating}
            />
        </>
    )
}
