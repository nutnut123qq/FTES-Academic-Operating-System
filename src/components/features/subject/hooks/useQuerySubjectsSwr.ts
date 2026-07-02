"use client"

import useSWR from "swr"
import type { Subject } from "./useQuerySubjectSwr"

// ponytail: mock BE — no subjects endpoint yet. Deterministic sample list, same
// shape as useQuerySubjectSwr so the catalog + workspace share the Subject type.
// Wire a real GraphQL query (subjects()) when the contract lands; hook API stays.
const fetchSubjectsMock = async (): Promise<Array<Subject>> => [
    { id: "prf192", code: "PRF192", name: "Lập trình C", credits: 3, difficulty: "basic", lecturer: "Nguyễn Văn A", progress: 62 },
    { id: "csd201", code: "CSD201", name: "Cấu trúc dữ liệu & Giải thuật", credits: 3, difficulty: "intermediate", lecturer: "Trần Thị B", progress: 38 },
    { id: "prj301", code: "PRJ301", name: "Lập trình Java Web", credits: 3, difficulty: "intermediate", lecturer: "Lê Văn C", progress: 12 },
    { id: "dbi202", code: "DBI202", name: "Cơ sở dữ liệu", credits: 3, difficulty: "basic", lecturer: "Phạm Thị D", progress: 80 },
    { id: "swp391", code: "SWP391", name: "Đồ án phần mềm", credits: 4, difficulty: "advanced", lecturer: "Đỗ Văn E", progress: 5 },
    { id: "net1704", code: "NET1704", name: "Mạng máy tính", credits: 3, difficulty: "intermediate", lecturer: "Vũ Thị F", progress: 46 },
]

/** Loads the subject catalog. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQuerySubjectsSwr = () => {
    const { data, isLoading, error } = useSWR(["subjects"], () => fetchSubjectsMock())
    return { subjects: data ?? [], isLoading, error }
}
