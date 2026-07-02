"use client"

import useSWR from "swr"

/** A skill node in the graph, with the student's mock mastery %. */
export interface CareerSkill {
    id: string
    name: string
    progress: number
}

/** A career roadmap track; `key` maps to a localized label + icon. */
export interface CareerRoadmap {
    id: string
    key: "backend" | "frontend" | "mobile" | "ai" | "data" | "devops"
}

/** A job opening surfaced by the Career Center. */
export interface CareerJob {
    id: string
    title: string
    company: string
    type: "internship" | "fulltime"
}

export interface CareerCenterData {
    skills: Array<CareerSkill>
    roadmaps: Array<CareerRoadmap>
    jobs: Array<CareerJob>
}

// ponytail: mock BE — no career endpoint yet. Deterministic sample so the shell is
// deterministic. Wire a real GraphQL query (careerCenter()) when the contract lands;
// the hook API (return shape) stays, only the fetcher swaps.
const fetchCareerMock = async (): Promise<CareerCenterData> => ({
    skills: [
        { id: "js", name: "JavaScript / TypeScript", progress: 72 },
        { id: "react", name: "React", progress: 58 },
        { id: "node", name: "Node.js", progress: 44 },
        { id: "sql", name: "SQL & Databases", progress: 63 },
        { id: "algo", name: "Data Structures & Algorithms", progress: 51 },
        { id: "git", name: "Git & CI/CD", progress: 39 },
    ],
    roadmaps: [
        { id: "rm-backend", key: "backend" },
        { id: "rm-frontend", key: "frontend" },
        { id: "rm-mobile", key: "mobile" },
        { id: "rm-ai", key: "ai" },
        { id: "rm-data", key: "data" },
        { id: "rm-devops", key: "devops" },
    ],
    jobs: [
        { id: "job-1", title: "Frontend Developer", company: "FPT Software", type: "fulltime" },
        { id: "job-2", title: "Backend Intern", company: "VNG", type: "internship" },
        { id: "job-3", title: "Mobile Developer (Flutter)", company: "MoMo", type: "fulltime" },
        { id: "job-4", title: "Data Analyst Intern", company: "Tiki", type: "internship" },
        { id: "job-5", title: "DevOps Engineer", company: "Shopee", type: "fulltime" },
    ],
})

/** Loads the Career Center (§21). Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryCareerSwr = () => {
    const { data, isLoading, error } = useSWR(["career"], () => fetchCareerMock())
    return {
        skills: data?.skills ?? [],
        roadmaps: data?.roadmaps ?? [],
        jobs: data?.jobs ?? [],
        isLoading,
        error,
    }
}
