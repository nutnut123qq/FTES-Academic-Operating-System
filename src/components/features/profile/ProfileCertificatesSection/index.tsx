"use client"

import React from "react"
import { Chip, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { ArrowSquareOutIcon, CertificateIcon } from "@phosphor-icons/react"
import { Link } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useGetMyCertificatesSwr } from "@/hooks/swr/api/rest/queries/useGetMyCertificatesSwr"

/** Skeleton mirroring the certificate rows. */
const CertificatesSkeleton = () => (
    <div className="flex flex-col gap-3">
        <Skeleton.Typography type="h6" width="1/3" />
        <Skeleton.ListRow />
        <Skeleton.ListRow />
    </div>
)

/**
 * "My certificates" profile section (course-certificate). Lists the viewer's
 * course-completion certificates from `GET /courses/me/certificates` — name,
 * issue date, verify code — each row deep-linking to the public verify page.
 */
export const ProfileCertificatesSection = () => {
    const t = useTranslations()
    const { data, isLoading, error, mutate } = useGetMyCertificatesSwr()
    const certificates = data ?? []

    return (
        <AsyncContent
            isLoading={isLoading && !data}
            skeleton={<CertificatesSkeleton />}
            error={!data ? error : undefined}
            errorContent={{
                title: t("profile.loadingError"),
                retryLabel: t("profile.retry"),
                onRetry: () => void mutate(),
            }}
        >
            <LabeledCard label={t("profile.certificates.title")}>
                {certificates.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 p-6 text-center">
                        <CertificateIcon
                            className="size-8 text-muted"
                            aria-hidden
                            focusable="false"
                        />
                        <Typography type="body-sm" color="muted">
                            {t("profile.certificates.empty")}
                        </Typography>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {certificates.map((certificate) => {
                            const issuedDate = new Date(
                                `${certificate.issueDate}T00:00:00`,
                            ).toLocaleDateString()
                            return (
                                <div
                                    key={certificate.id}
                                    className="flex items-start gap-3 rounded-2xl border border-separator p-4"
                                >
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-large bg-accent/10 text-accent">
                                        <CertificateIcon
                                            className="size-5"
                                            aria-hidden
                                            focusable="false"
                                        />
                                    </div>
                                    <div className="flex min-w-0 flex-1 flex-col gap-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Typography type="body-sm" weight="medium">
                                                {certificate.certificateName}
                                            </Typography>
                                            {!certificate.active ? (
                                                <Chip size="sm" variant="soft" color="danger">
                                                    <Chip.Label>
                                                        {t("profile.certificates.revoked")}
                                                    </Chip.Label>
                                                </Chip>
                                            ) : null}
                                        </div>
                                        <Typography type="body-xs" color="muted">
                                            {t("profile.certificates.meta", {
                                                date: issuedDate,
                                                code: certificate.certificateCode,
                                            })}
                                        </Typography>
                                    </div>
                                    <Link
                                        href={`/certificates/verify/${certificate.certificateCode}`}
                                        className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-accent no-underline hover:underline"
                                        aria-label={t("profile.certificates.view")}
                                    >
                                        <ArrowSquareOutIcon
                                            className="size-4"
                                            aria-hidden
                                            focusable="false"
                                        />
                                    </Link>
                                </div>
                            )
                        })}
                    </div>
                )}
            </LabeledCard>
        </AsyncContent>
    )
}
