import React, { Suspense } from "react"
import { GoldenBoardPage } from "@/components/features/goldenboard/GoldenBoardPage"

/**
 * `/goldenboard` — the Bảng vàng / Hall of Fame browser: a term picker over the terms that have a
 * board, and the picked term's podium + list. The home-page Hall of Fame CTA lands here; the picked
 * term is mirrored to `?term=<code>` so a term's board is a shareable link. Public (anonymous).
 *
 * Suspense: the feature reads `?term=` via `useSearchParams` (same reason the reset-password route
 * carries one).
 */
const Page = () => (
    <Suspense>
        <GoldenBoardPage />
    </Suspense>
)

export default Page
