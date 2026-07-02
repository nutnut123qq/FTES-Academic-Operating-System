"use client"

import useSWR from "swr"

/** A portfolio project (mock until BE lands). */
export interface MyPortfolioProject {
    id: string
    title: string
    description: string
    /** Tech tags shown as chips. */
    tags: Array<string>
    /** External URL of the project (repo / demo). */
    url: string
}

/** An external profile link (GitHub, LinkedIn, …). */
export interface MyPortfolioLink {
    id: string
    label: string
    url: string
}

/** Portfolio payload for the profile Portfolio tab. */
export interface MyPortfolio {
    projects: Array<MyPortfolioProject>
    links: Array<MyPortfolioLink>
}

// ponytail: mock BE — no portfolio endpoint yet. Deterministic seed; the tab's
// CRUD-lite mutates local component state only, so a reload returns to this.
const fetchMyPortfolioMock = async (): Promise<MyPortfolio> => ({
    projects: [
        {
            id: "pr1",
            title: "CLI todo manager",
            description: "Công cụ quản lý việc trên terminal, lưu SQLite.",
            tags: ["Go", "SQLite"],
            url: "https://github.com/example/cli-todo",
        },
        {
            id: "pr2",
            title: "Mini HTTP server",
            description: "Web server tối giản viết từ socket thuần.",
            tags: ["C", "POSIX"],
            url: "https://github.com/example/mini-http",
        },
        {
            id: "pr3",
            title: "Trang blog cá nhân",
            description: "Blog tĩnh, dark mode, tối ưu SEO.",
            tags: ["Next.js"],
            url: "https://example.dev",
        },
    ],
    links: [
        { id: "li1", label: "GitHub", url: "https://github.com/example" },
        { id: "li2", label: "LinkedIn", url: "https://linkedin.com/in/example" },
    ],
})

/** Loads the viewer's portfolio seed. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryMyPortfolioSwr = () => {
    const { data, isLoading, error } = useSWR(["my-portfolio"], () => fetchMyPortfolioMock())
    return { data, isLoading, error }
}
