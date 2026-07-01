"use client"

import { useLocale } from "next-intl"
import { useParams, useRouter } from "next/navigation"
import { useEffect } from "react"
import { pathConfig } from "@/resources/path"

/**
 * Redirect legacy `/learn/headhunting-companies/[companyId]` to course-level route.
 */
const Page = () => {
    const router = useRouter()
    const locale = useLocale()
    const params = useParams()
    const courseId = typeof params.courseId === "string" ? params.courseId : undefined
    const companyId = typeof params.companyId === "string" ? params.companyId : undefined

    useEffect(() => {
        if (!courseId || !companyId) {
            return
        }
        router.replace(
            pathConfig()
                .locale(locale)
                .course(courseId)
                .headhuntingCompanies(companyId)
                .build(),
        )
    }, [
        companyId,
        courseId,
        locale,
        router,
    ])

    return null
}

export default Page
