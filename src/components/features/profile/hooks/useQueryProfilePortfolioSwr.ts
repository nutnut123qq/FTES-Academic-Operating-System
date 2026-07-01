"use client"

import useSWR from "swr"

/** A portfolio project (mock until BE lands). */
export interface PortfolioProject {
    id: string
    title: string
    description: string
    stack: string
}

/** A certificate entry. */
export interface Certificate {
    id: string
    title: string
    issuer: string
}

/** Portfolio payload (§2). */
export interface ProfilePortfolio {
    projects: Array<PortfolioProject>
    certificates: Array<Certificate>
}

// ponytail: mock BE — no portfolio endpoint yet. Deterministic sample.
const fetchPortfolioMock = async (): Promise<ProfilePortfolio> => ({
    projects: [
        { id: "pr1", title: "CLI todo manager", description: "Công cụ quản lý việc trên terminal, lưu SQLite.", stack: "Go · SQLite" },
        { id: "pr2", title: "Mini HTTP server", description: "Web server tối giản viết từ socket thuần.", stack: "C · POSIX" },
        { id: "pr3", title: "Trang blog cá nhân", description: "Blog tĩnh, dark mode, tối ưu SEO.", stack: "Next.js" },
    ],
    certificates: [
        { id: "ce1", title: "Foundations of Programming", issuer: "FTES" },
        { id: "ce2", title: "Git & GitHub Essentials", issuer: "Coursera" },
    ],
})

/** Loads the viewer's portfolio. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryProfilePortfolioSwr = () => {
    const { data, isLoading, error } = useSWR(["profile-portfolio", "me"], () => fetchPortfolioMock())
    return { portfolio: data, isLoading, error }
}
