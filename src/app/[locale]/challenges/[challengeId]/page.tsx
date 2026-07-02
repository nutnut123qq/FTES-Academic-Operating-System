"use client"

import React from "react"
import { useParams } from "next/navigation"
import { ChallengeView } from "@/components/features/challenge/ChallengeView"

/** `/challenges/[challengeId]` — standalone solve view (UI/UX editor for `uiux`). */
const Page = () => {
    const params = useParams()
    const challengeId = params.challengeId as string
    return <ChallengeView challengeId={challengeId} />
}

export default Page
