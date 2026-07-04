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
    /** Whether the project is pinned to the top of the profile. */
    pinned: boolean
}

/** An external profile link (GitHub, LinkedIn, …). */
export interface MyPortfolioLink {
    id: string
    label: string
    url: string
}

/** Resume/CV document attached to the profile. */
export interface MyPortfolioResume {
    /** URL to view/download the resume. */
    url: string
    /** Display filename. */
    filename: string
    /** ISO date the resume was uploaded. */
    uploadedAt: string
}

/** A certificate earned by the learner. */
export interface MyPortfolioCertificate {
    id: string
    /** Certificate name. */
    name: string
    /** Issuing organization. */
    issuer: string
    /** ISO date issued. */
    date: string
    /** External verification link. */
    url: string
}

/** An achievement / badge earned by the learner. */
export interface MyPortfolioAchievement {
    id: string
    /** Achievement title. */
    title: string
    /** Short description. */
    description: string
    /** ISO date earned. */
    earnedDate: string
    /** Category used for grouping (learning, skills, community, course, other). */
    category: "learning" | "skills" | "community" | "course" | "other"
}

/** Portfolio payload for the profile Portfolio tab. */
export interface MyPortfolio {
    projects: Array<MyPortfolioProject>
    links: Array<MyPortfolioLink>
    resume: MyPortfolioResume | null
    certificates: Array<MyPortfolioCertificate>
    achievements: Array<MyPortfolioAchievement>
}

// ponytail: mock BE — no portfolio endpoint yet. Deterministic seed; the tab's
// CRUD-lite mutates local component state only, so a reload returns to this.
// Contract preview: BE will expose resume, certificates, and achievements arrays.
const fetchMyPortfolioMock = async (): Promise<MyPortfolio> => ({
    projects: [
        {
            id: "pr1",
            title: "CLI todo manager",
            description: "Công cụ quản lý việc trên terminal, lưu SQLite.",
            tags: ["Go", "SQLite"],
            url: "https://github.com/example/cli-todo",
            pinned: true,
        },
        {
            id: "pr2",
            title: "Mini HTTP server",
            description: "Web server tối giản viết từ socket thuần.",
            tags: ["C", "POSIX"],
            url: "https://github.com/example/mini-http",
            pinned: true,
        },
        {
            id: "pr3",
            title: "Trang blog cá nhân",
            description: "Blog tĩnh, dark mode, tối ưu SEO.",
            tags: ["Next.js"],
            url: "https://example.dev",
            pinned: false,
        },
    ],
    links: [
        { id: "li1", label: "GitHub", url: "https://github.com/example" },
        { id: "li2", label: "LinkedIn", url: "https://linkedin.com/in/example" },
    ],
    resume: {
        url: "https://example.com/cv-nguyenvanhoc.pdf",
        filename: "CV_NguyenVanHoc.pdf",
        uploadedAt: "2026-06-20",
    },
    certificates: [
        {
            id: "cert1",
            name: "AWS Cloud Practitioner",
            issuer: "Amazon Web Services",
            date: "2024-03-15",
            url: "https://www.credly.com/badges/example",
        },
        {
            id: "cert2",
            name: "IELTS 7.5",
            issuer: "British Council",
            date: "2023-08-10",
            url: "https://ielts.britishcouncil.org/example",
        },
    ],
    achievements: [
        {
            id: "ach1",
            title: "Top contributor",
            description: "Đóng góp nhiều nhất cộng đồng tháng 6/2026",
            earnedDate: "2026-06-30",
            category: "community",
        },
        {
            id: "ach2",
            title: "Streak master",
            description: "Học 30 ngày liên tục",
            earnedDate: "2026-06-15",
            category: "learning",
        },
        {
            id: "ach3",
            title: "Project champion",
            description: "Hoàn thành đồ án xuất sắc SWP391",
            earnedDate: "2026-05-20",
            category: "course",
        },
    ],
})

/** Loads the viewer's portfolio seed. Mocked; SWR-shaped for a BE swap. */
export const useQueryMyPortfolioSwr = () => {
    const { data, isLoading, error } = useSWR(["my-portfolio"], () => fetchMyPortfolioMock())
    return { data, isLoading, error }
}
