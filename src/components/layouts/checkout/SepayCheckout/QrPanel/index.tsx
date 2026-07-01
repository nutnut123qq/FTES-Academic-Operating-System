"use client"

import { ArrowsRotateLeft as ArrowsClockwise } from "@gravity-ui/icons"
import React, {
    useCallback,
} from "react"
import {
    Button,
    Card,
    Spinner,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import {
    useSearchParams,
} from "next/navigation"
import {
    useQueryCourseEnrollmentStatusSwr,
} from "@/hooks/swr/api/graphql/queries/useQueryCourseEnrollmentStatusSwr"

/**
 * Left-hand panel: the SePay QR code + "waiting for payment" status + a manual
 * re-check button.
 *
 * Self-contained section (single-use): reads its own QR url query param and
 * triggers an enrollment-status re-check through the shared SWR singleton — so
 * the checkout container only renders `<QrPanel />` and the refresh logic lives
 * here. `"use client"` for the query-params / i18n hooks and the button.
 */
export const QrPanel = () => {
    const t = useTranslations()
    const searchParams = useSearchParams()
    const qrUrl = searchParams.get("qr") || ""

    const {
        mutate: refreshStatus,
    } = useQueryCourseEnrollmentStatusSwr()

    /** Manually re-check the enrollment/payment status. */
    const onRefresh = useCallback(
        () => {
            refreshStatus()
        },
        [
            refreshStatus,
        ],
    )

    return (
        <Card className="flex flex-col items-center overflow-hidden bg-default/40 p-8 backdrop-blur-md">
            <Card.Content className="flex w-full flex-col items-center">
                <h2 className="mb-6 text-center text-xl font-semibold">
                    {t("payment.sepay.instruction")}
                </h2>

                <div className="group relative rounded-2xl bg-white p-4 shadow-2xl transition-transform hover:scale-[1.02]">
                    {qrUrl ? (
                        <img
                            alt="SePay QR"
                            className="aspect-square w-full max-w-[300px] object-contain"
                            src={qrUrl}
                        />
                    ) : (
                        <div className="flex h-[300px] w-[300px] items-center justify-center">
                            <Spinner size="lg" />
                        </div>
                    )}
                </div>

                <div className="mt-8 flex w-full flex-col items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        <Spinner size="sm" />
                        <span className="text-sm italic text-muted">
                            {t("payment.sepay.waiting")}
                        </span>
                    </div>
                    <Button
                        variant="secondary"
                        onPress={onRefresh}
                    >
                        <ArrowsClockwise className="h-5 w-5" />
                        {t("payment.sepay.checkStatus")}
                    </Button>
                </div>
            </Card.Content>
        </Card>
    )
}
