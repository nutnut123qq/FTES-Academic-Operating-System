"use client"

import useSWR from "swr"
import type { Subject } from "./useQuerySubjectSwr"

// ponytail: mock BE — no subjects endpoint yet. Deterministic sample list, same
// shape as useQuerySubjectSwr so the catalog + workspace share the Subject type.
// Wire a real GraphQL query (subjects()) when the contract lands; hook API stays.
// `imageUrl` points at local `public/subjects/<code>.png` assets (no remote hosts);
// `net1704` is intentionally null to exercise the initials-badge fallback in the
// real UI. Follow-up when the BE lands: if it serves remote image URLs, add the
// host to `next.config` `images.remotePatterns`.
// `accentColor` (OKLCH strings) is carried but not rendered yet — future tinting.
const fetchSubjectsMock = async (): Promise<Array<Subject>> => [
    { id: "prf192", code: "PRF192", name: "Lập trình C", credits: 3, difficulty: "basic", lecturer: "Lê Minh Quân", progress: 62, imageUrl: "/subjects/prf192.png", accentColor: "oklch(60% 0.18 354)", courseIds: ["prf192-course"], isMember: true },
    { id: "csd201", code: "CSD201", name: "Cấu trúc dữ liệu & Giải thuật", credits: 3, difficulty: "intermediate", lecturer: "Trần Thu Hà", progress: 38, imageUrl: "/subjects/csd201.png", accentColor: "oklch(60% 0.15 250)", courseIds: ["csd201-course"], isMember: true },
    { id: "prj301", code: "PRJ301", name: "Lập trình Java Web", credits: 3, difficulty: "intermediate", lecturer: "Phạm Gia Bảo", progress: 12, imageUrl: "/subjects/prj301.png", accentColor: "oklch(60% 0.15 40)", courseIds: ["prj301-course"], isMember: true },
    { id: "dbi202", code: "DBI202", name: "Cơ sở dữ liệu", credits: 3, difficulty: "basic", lecturer: "Vũ Ngọc Ánh", progress: 80, imageUrl: "/subjects/dbi202.png", accentColor: "oklch(60% 0.14 150)", courseIds: ["dbi202-course"], isMember: true },
    { id: "swp391", code: "SWP391", name: "Đồ án phần mềm", credits: 4, difficulty: "advanced", lecturer: "Đỗ Văn E", progress: 5, imageUrl: "/subjects/swp391.png", accentColor: "oklch(60% 0.16 300)", courseIds: [], isMember: false },
    { id: "net1704", code: "NET1704", name: "Mạng máy tính", credits: 3, difficulty: "intermediate", lecturer: "Vũ Thị F", progress: 46, imageUrl: null, accentColor: "oklch(60% 0.13 200)", courseIds: ["net1704-course"], isMember: true },
]

/** Loads the subject catalog. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQuerySubjectsSwr = () => {
    const { data, isLoading, error } = useSWR(["subjects"], () => fetchSubjectsMock())
    return { subjects: data ?? [], isLoading, error }
}
