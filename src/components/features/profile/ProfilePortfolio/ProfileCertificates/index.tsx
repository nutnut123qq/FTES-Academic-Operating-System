"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { ArrowSquareOutIcon, CertificateIcon } from "@phosphor-icons/react"
import type { WithClassNames } from "@/modules/types/base/class-name"
import type { MyPortfolioCertificate } from "../../hooks/useQueryMyPortfolioSwr"

/** Props for {@link ProfileCertificates}. */
export interface ProfileCertificatesProps extends WithClassNames<undefined> {
    /** Certificate list to display. */
    certificates: Array<MyPortfolioCertificate>
}

/**
 * Certificate list for the Portfolio tab. Each row shows the certificate name,
 * issuer, issue date, and an external verification link.
 */
export const ProfileCertificates = ({ certificates, className }: ProfileCertificatesProps) => {
    const t = useTranslations()

    return (
        <div className={`flex flex-col gap-3 ${className ?? ""}`}>
            {certificates.map((certificate) => {
                const issuedDate = new Date(`${certificate.date}T00:00:00`).toLocaleDateString()
                return (
                    <div
                        key={certificate.id}
                        className="flex items-start gap-3 rounded-2xl border border-separator p-4"
                    >
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-large bg-accent/10 text-accent">
                            <CertificateIcon className="size-5" aria-hidden focusable="false" />
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col gap-0">
                            <Typography type="body-sm" weight="medium">
                                {certificate.name}
                            </Typography>
                            <Typography type="body-xs" color="muted">
                                {t("profile.portfolio.certificates.meta", {
                                    issuer: certificate.issuer,
                                    date: issuedDate,
                                })}
                            </Typography>
                        </div>
                        <a
                            href={certificate.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-accent no-underline hover:underline"
                            aria-label={t("profile.portfolio.certificates.verify")}
                        >
                            <ArrowSquareOutIcon className="size-4" aria-hidden focusable="false" />
                        </a>
                    </div>
                )
            })}
        </div>
    )
}
