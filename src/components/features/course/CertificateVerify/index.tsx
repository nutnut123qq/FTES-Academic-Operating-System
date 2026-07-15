"use client"

import React from "react"
import { Chip, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { CertificateIcon, SealCheckIcon, SealWarningIcon } from "@phosphor-icons/react"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useGetCertificateVerifySwr } from "@/hooks/swr/api/rest/queries/useGetCertificateVerifySwr"

/** One label/value row of the verification card. */
const DetailRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex flex-col gap-0">
        <Typography type="body-xs" color="muted">
            {label}
        </Typography>
        <Typography type="body" weight="medium">
            {value}
        </Typography>
    </div>
)

/** Skeleton mirroring the verification card. */
const VerifySkeleton = () => (
    <div className="flex flex-col gap-4 rounded-2xl border border-separator p-6">
        <Skeleton.Typography type="h5" width="2/3" />
        <Skeleton.Chip />
        <Skeleton.Paragraph lines={4} />
    </div>
)

/**
 * Public certificate verification page (course-certificate). Resolves the
 * `FTES-{year}-{code}` printed on a certificate against the public BE endpoint
 * `GET /courses/certificates/verify/{code}` — no login required — and shows the
 * safe subset: certificate name, holder, course, issue date, active/revoked.
 */
export const CertificateVerify = () => {
    const t = useTranslations("certificateVerify")
    const { code } = useParams<{ code: string }>()
    const { data, isLoading, error } = useGetCertificateVerifySwr(code)

    return (
        <div className="mx-auto flex w-full max-w-xl flex-col gap-6 p-6">
            <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-large bg-accent/10 text-accent">
                    <CertificateIcon className="size-5" aria-hidden focusable="false" />
                </div>
                <Typography type="h4" weight="bold">
                    {t("title")}
                </Typography>
            </div>

            <AsyncContent
                isLoading={isLoading && !data}
                skeleton={<VerifySkeleton />}
                error={!data ? error : undefined}
                errorContent={{
                    title: t("notFound"),
                    description: t("notFoundDescription", { code }),
                }}
            >
                {data ? (
                    <div className="flex flex-col gap-4 rounded-2xl border border-separator p-6">
                        <div className="flex flex-wrap items-center gap-2">
                            <Typography type="h5" weight="bold" className="min-w-0">
                                {data.certificateName}
                            </Typography>
                            {data.active ? (
                                <Chip size="sm" variant="soft" color="success">
                                    <SealCheckIcon
                                        className="size-4"
                                        aria-hidden
                                        focusable="false"
                                    />
                                    <Chip.Label>{t("valid")}</Chip.Label>
                                </Chip>
                            ) : (
                                <Chip size="sm" variant="soft" color="danger">
                                    <SealWarningIcon
                                        className="size-4"
                                        aria-hidden
                                        focusable="false"
                                    />
                                    <Chip.Label>{t("revoked")}</Chip.Label>
                                </Chip>
                            )}
                        </div>
                        <div className="flex flex-col gap-3">
                            <DetailRow label={t("holder")} value={data.holderName} />
                            {data.courseTitle ? (
                                <DetailRow label={t("course")} value={data.courseTitle} />
                            ) : null}
                            <DetailRow
                                label={t("issueDate")}
                                value={new Date(
                                    `${data.issueDate}T00:00:00`,
                                ).toLocaleDateString()}
                            />
                            <DetailRow label={t("code")} value={code} />
                        </div>
                    </div>
                ) : null}
            </AsyncContent>
        </div>
    )
}
