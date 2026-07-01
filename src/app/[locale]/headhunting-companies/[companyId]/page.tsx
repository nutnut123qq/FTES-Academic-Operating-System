"use client"

import { useLocale } from "next-intl"
import { useParams, useRouter } from "next/navigation"
import { useEffect } from "react"
import { useAppSelector } from "@/redux/hooks"
import { pathConfig } from "@/resources/path"

/**
 * Redirect legacy `/headhunting-companies/[companyId]` to course-scoped route.
 */
const Page = () => {
    const router = useRouter()
    const locale = useLocale()
    const params = useParams()
    const companyId = typeof params.companyId === "string" ? params.companyId : undefined
    const courseDisplayId = useAppSelector((state) => state.course.displayId)

    useEffect(() => {
        if (!companyId) {
            return
        }
        if (courseDisplayId) {
            router.replace(
                pathConfig()
                    .locale(locale)
                    .course(courseDisplayId)
                    .headhuntingCompanies(companyId)
                    .build(),
            )
            return
        }
        router.replace(pathConfig().locale(locale).course().build())
    }, [
        companyId,
        courseDisplayId,
        locale,
        router,
    ])

    return null
}

export default Page
