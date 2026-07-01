"use client"

import React, {
    Suspense,
    useEffect,
} from "react"
import {
    Spinner,
} from "@heroui/react"
import {
    useLocale,
} from "next-intl"
import {
    useSearchParams,
} from "next/navigation"
import {
    useQueryCourseEnrollmentStatusSwr,
} from "@/hooks/swr/api/graphql/queries/useQueryCourseEnrollmentStatusSwr"
import {
    useRouter,
} from "@/i18n/navigation"
import {
    EnrolledSuccess,
} from "./EnrolledSuccess"
import {
    QrPanel,
} from "./QrPanel"
import {
    OrderSummary,
} from "./OrderSummary"
import { pathConfig } from "@/resources/path"

/** How often (ms) to re-poll the enrollment status while waiting for payment. */
const POLL_INTERVAL_MS = 5000
/** Delay (ms) before redirecting to the course once enrollment is confirmed. */
const REDIRECT_DELAY_MS = 2000

/**
 * SePay checkout container.
 *
 * Owns only the page-level concern: poll the course enrollment status via SWR
 * and redirect to the course once enrollment lands (showing the success screen
 * for a beat first). Each panel is self-contained — `QrPanel` and `OrderSummary`
 * read their own query params and own their own handlers — so this container
 * just composes them. `"use client"` because it runs effects + reads params.
 */
const SepayCheckoutContent = () => {
    const searchParams = useSearchParams()
    const locale = useLocale()
    const router = useRouter()

    const courseId = searchParams.get("courseId") || ""

    const {
        data: statusData,
        mutate: refreshStatus,
    } = useQueryCourseEnrollmentStatusSwr()
    const isEnrolled = statusData?.courseEnrollmentStatus?.data?.isEnrolled

    // poll the enrollment status on a fixed interval while waiting for payment
    useEffect(
        () => {
            const interval = setInterval(
                () => {
                    refreshStatus()
                },
                POLL_INTERVAL_MS,
            )
            return () => clearInterval(interval)
        },
        [
            refreshStatus,
        ],
    )

    // once enrolled, give the success screen a beat then redirect to the course
    useEffect(
        () => {
            if (isEnrolled) {
                const timer = setTimeout(
                    () => {
                        router.push(pathConfig().locale(locale).course(courseId).build())
                    },
                    REDIRECT_DELAY_MS,
                )
                return () => clearTimeout(timer)
            }
        },
        [
            isEnrolled,
            courseId,
            locale,
            router,
        ],
    )

    if (isEnrolled) {
        return <EnrolledSuccess />
    }

    return (
        <div className="flex min-h-screen flex-col items-center px-4 py-12">
            <div className="grid w-full max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
                <QrPanel />
                <OrderSummary />
            </div>
        </div>
    )
}

/**
 * Public SePay checkout entry point.
 *
 * Wraps {@link SepayCheckoutContent} in a Suspense boundary (required because
 * the content + panels read `useSearchParams`) with a centered spinner fallback.
 * Mounted by the `/[locale]/checkout/sepay` route.
 */
export const SepayCheckout = () => {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-[80vh] items-center justify-center">
                    <Spinner size="lg" />
                </div>
            }
        >
            <SepayCheckoutContent />
        </Suspense>
    )
}
