import React from "react"
import { CourseHistorySection } from "@/components/features/profile/Settings/CourseHistorySection"

/**
 * `/profile/settings/learning` — every joined course with its progress and term
 * window. Thin route file: the rail and page frame belong to `SettingsShell`,
 * mounted by the profile layout.
 */
const Page = () => <CourseHistorySection />

export default Page
