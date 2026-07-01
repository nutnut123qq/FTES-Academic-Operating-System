"use client"

import React from "react"
import { PracticeProblem } from "@/components/features/practice/PracticeProblem"

/**
 * Route `/[locale]/practice/[slug]` — coding-problem detail + editor.
 * `PracticeProblem` reads the slug from the route itself.
 */
const Page = () => {
    return <PracticeProblem />
}

export default Page
