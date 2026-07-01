"use client"

import useSWR from "swr"

/** A quiz question (§4/§10, mock until BE lands). */
export interface QuizQuestion {
    id: string
    text: string
    options: Array<string>
    correctIndex: number
}

// ponytail: mock BE — no quiz endpoint yet. Deterministic sample.
const fetchQuizMock = async (): Promise<Array<QuizQuestion>> => [
    {
        id: "q1",
        text: "Toán tử nào lấy địa chỉ của một biến trong C?",
        options: ["*", "&", "%", "#"],
        correctIndex: 1,
    },
    {
        id: "q2",
        text: "Kiểu dữ liệu nào lưu số nguyên trong C?",
        options: ["float", "char", "int", "double"],
        correctIndex: 2,
    },
    {
        id: "q3",
        text: "Hàm nào in ra màn hình trong C?",
        options: ["printf", "echo", "print", "cout"],
        correctIndex: 0,
    },
]

/** Loads a course's quiz. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryQuizSwr = (courseId: string) => {
    const { data, isLoading, error } = useSWR(["quiz", courseId], () => fetchQuizMock())
    return { questions: data ?? [], isLoading, error }
}
